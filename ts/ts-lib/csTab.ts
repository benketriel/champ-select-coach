import { CsInput, CsManager } from "./csManager";
import { Logger } from "./logger";
import { Timer } from "./timer";
import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { MainWindow } from "../windows/mainWindow/mainWindow";
import { version } from "./consts";
import { Utils } from "./utils";
import { LocalStorage } from "./localStorage";
import { ErrorReporting } from "./errorReporting";
import { Popup } from "./popup";
import { TranslatedText } from "./textLanguage";
import { Subscriptions } from "./subscriptions";


export class CsTab {
  private lcuCsManager: CsManager;
  private historyCsManagers: CsManager[];

  private currentCsManager: CsManager = null;

  public hasBeenUpdated: boolean = false;
  public static NUM_RECOMMENDATIONS: number = 6;
  public static NUM_HISTORY: number = 8;
  public patchInfo: any;

  constructor(patchInfo: any) {
    this.patchInfo = patchInfo;
    //if mode matches then handle their callbacks and set view

    this.lcuCsManager = new CsManager(this, true, null, true, false);
    this.historyCsManagers = [];

    /* await */ this.init();
  }

  private async init() {
    const that = this;
    
    await Subscriptions.updateSubscriptionStatus();

    const history = await LocalStorage.getCsHistory();
    for (let i in history) {
      const h = history[i];
      this.historyCsManagers.push(new CsManager(this, false, h, h.swappable, h.editable));
    }
    this.updateCSHistory();

    if (this.historyCsManagers.length > 0) await MainWindow.showHistoryCS(0);
    else MainWindow.selectHome();

    //Callbacks
    const roleSwappers = $('.cs-table-champion-swap-role').get();
    for (const i in roleSwappers) {
      const idx = Math.round(parseInt(i) % 4);
      const team = Math.floor((parseInt(i) / 4) % 2);
      const role = Math.floor(parseInt(i) / 8);
      $(roleSwappers[i]).on('click', async () => await that.swapRole(5 * team + role, idx + (role <= idx ? 1 : 0)));
    }

    const champSwappers = $('.cs-table-champion-swap-champion').get();
    for (const i in champSwappers) {
      const idx = Math.round(parseInt(i) % 4);
      const team = Math.floor((parseInt(i) / 4) % 2);
      const role = Math.floor(parseInt(i) / 8);
      $(champSwappers[i]).on('click', async () => await that.swapChampion(5 * team + role, 5 * team + idx + (role <= idx ? 1 : 0)));
    }

    const defaultSwappers = $('.cs-table-champion-swap-default').get();
    for (const i in defaultSwappers) {
      const idx = Math.round(parseInt(i) % 2);
      const team = Math.floor((parseInt(i) / 2) % 2);
      const role = Math.floor(parseInt(i) / 4);
      if (idx == 0) {
        $(defaultSwappers[i]).on('click', async () => await that.swapRole(5 * team + role, -1));
      } else {
        $(defaultSwappers[i]).on('click', async () => await that.swapChampion(5 * team + role, -1));
      }
    }

    const editIcons = $('.cs-table-edit-button').get();
    for (const i in editIcons) {
      const idx = Math.round(Math.floor((parseInt(i) + 1) / 2) % 2);
      const team = Math.floor((parseInt(i) / 2) % 2);
      const role = Math.floor(parseInt(i) / 4);

      const elm = editIcons[i]
      $(elm).parent().on('mouseenter', async () => { if (that.currentCsManager.getCsView().editable && Subscriptions.isSubscribed()) $(elm).show(); });
      $(elm).parent().on('mouseleave', () => $(elm).hide());
      if (idx == 0) {
        $(elm).on('click', () => that.editChampion(role + 5 * team));
      } else {
        $(elm).on('click', () => that.editSummoner(role + 5 * team));
      }
    }
    const regionEditIcon = $('.cs-region-edit-button').get(0);
    $('.cs-region').on('mouseenter', async () => { if (that.currentCsManager.getCsView().editable && Subscriptions.isSubscribed()) $(regionEditIcon).show(); });
    $('.cs-region').on('mouseleave', () => $(regionEditIcon).hide());
    $(regionEditIcon).on('click', () => that.editRegion());

    $('.cs-side-blue').on('change', async () => { await that.editSide(true); });
    $('.cs-side-red').on('change', async () => { await that.editSide(false); });

    $('.cs-queue-solo').on('change', async () => { await that.editQueue(true); });
    $('.cs-queue-flex').on('change', async () => { await that.editQueue(false); });
    
  }

  public async onNewCs(managerAsking: any) {
    if (this.lcuCsManager.currCsFirstRunComplete) {
      await this.addCurrentLcuCsToHistory();
    }

    $('.side-menu-current-cs .side-menu-current-cs-score').html('5.0');
    this.currentCsManager = managerAsking;
    await this.onCsUpdate(managerAsking, '');
    MainWindow.showLcuCS();
  }

  public async onCsUpdate(managerAsking: any, change: string) {
    if (managerAsking === this.lcuCsManager) {
      await this.saveHistory();
      this.updateLcuCSMenu();
    } else if (this.historyCsManagers.includes(managerAsking)) {
      await this.saveHistory();
      this.updateCSHistory();
    }

    this.hasBeenUpdated = true;

    if (this.currentCsManager === managerAsking) {
      this.update(managerAsking, change);
    }
  }

  //Navigation
  public swapToLcu() {
    this.update(this.lcuCsManager, '');
  }

  public swapToHistory(i: number) {
    this.update(this.historyCsManagers[i], '');
  }

  public swapToPersonal(csView: any) {
    const manager = new CsManager(this, false, csView, false, false);
    this.update(manager, '');
  }

  //Menu
  private async addCurrentLcuCsToHistory() {
    const csView = JSON.parse(JSON.stringify(this.lcuCsManager.getCsView()));
    csView.date = new Date().getTime();

    const newManager = new CsManager(this, false, csView, false, false);
    await this.addManagerToHistory(newManager);
  }

  public async addEditableCsToHistory() {
    const csView = JSON.parse(JSON.stringify(this.currentCsManager.getCsView()));
    csView.date = null;
    if (csView.csInput) csView.csInput.picking = [false, false, false, false, false, false, false, false, false, false];
    if (csView.csInputView) csView.csInputView.picking = [false, false, false, false, false, false, false, false, false, false];
    
    const newManager = new CsManager(this, false, csView, true, true);
    await this.addManagerToHistory(newManager);
  }

  private async addManagerToHistory(csManager: CsManager) {
    await csManager.refresh();

    this.historyCsManagers.unshift(csManager);
    while (this.historyCsManagers.length > MainWindow.MAX_MENU_HISTORY_SIZE) {
      this.historyCsManagers.pop();
    }
    this.updateCSHistory();

    Popup.close();
  }

  public deleteCSHistory(i: number) {
    if (i >= this.historyCsManagers.length) return;

    this.historyCsManagers.splice(i, 1);
    this.updateCSHistory();
  }

  public async saveHistory() {
    const history = this.historyCsManagers.map(m => m.getCsView());
    if (this.lcuCsManager.currCsFirstRunComplete) {
      const csView = this.lcuCsManager.getCsView();
      csView.date = new Date().getTime();
      csView.editable = false;
      csView.swappable = false;
      history.unshift(csView);
    }
    await LocalStorage.setCsHistory(history);
  }

  private updateLcuCSMenu() {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = 
      this.lcuCsManager.getCsView();

    const ownerIdx = CsInput.getOwnerIdx(csInputView);
    const mergedTier = CsTab.mergeTiers(lcuTiers, apiTiers)[csInputView.summonerNames[ownerIdx]] || {};
    let fullScore = score && score['full'] ? score['full'][0][0] : null;
    if (fullScore != null) {
      fullScore = ownerIdx < 5 ? fullScore : 1 - fullScore;
    }

    const patchInfo = MainWindow.instance().patchInfo;

    const swappedChamps = CsManager.applyChampionSwaps(csInputView);
    CsTab.setChampionImg(patchInfo, $('.side-menu-current-cs .side-menu-champion img'), swappedChamps[ownerIdx]);
    CsTab.setRoleImg($('.side-menu-current-cs .side-menu-role img'), rolePredictionView[ownerIdx], mergedTier.tier, mergedTier.division, mergedTier.lp);

    if (fullScore != null) {
      $('.side-menu-current-cs .side-menu-current-cs-score').html(Utils.probabilityToScore(fullScore));
    }

    $('.side-menu-current-cs .side-menu-waiting').hide();
    $('.side-menu-current-cs .side-menu-champion').show();
    $('.side-menu-current-cs .side-menu-role').show();
    $('.side-menu-current-cs .side-menu-current-cs-score').show();
  }

  public updateCSHistory() {
    for (let i = 0; i < MainWindow.MAX_MENU_HISTORY_SIZE; ++i) {
      if (i >= this.historyCsManagers.length) {
        $($('.side-menu-old-cs')[i]).hide();
        continue;
      }
      const csView = this.historyCsManagers[i].getCsView();
      const csInput: CsInput = csView.csInput;
      const ownerIdx = CsInput.getOwnerIdx(csInput);
      const mergedTier = CsTab.mergeTiers(csView.lcuTiers, csView.apiTiers);

      const tier = mergedTier[csInput.summonerNames[ownerIdx]] || {};
      let score = csView.score && csView.score['full'] ? csView.score['full'][0][0] : 0.5;
      score = ownerIdx < 5 ? score : 1 - score;

      const swappedChamps = CsManager.applyChampionSwaps(csInput);
      this.updateCSHistoryRow(i, swappedChamps[ownerIdx], (csView.rolePrediction || {})[ownerIdx] || 0, tier.tier, tier.division, tier.lp, score, csView.date);
    }
  }

  private updateCSHistoryRow(index: number, championId: string, role: number, tier: string, division: string, lp: string, score: number, date: number) {
    const patchInfo = MainWindow.instance().patchInfo;

    CsTab.setChampionImg(patchInfo, $($('.side-menu-champion-old img')[index]), championId);
    CsTab.setRoleImg($($('.side-menu-role-old img')[index]), role, tier, division, lp);

    $($('.side-menu-old-cs-score')[index]).html(Utils.probabilityToScore(score));

    const editElm = $($('.side-menu-old-cs-edit').get(index));
    const dateElm = $($('.side-menu-old-cs-date').get(index));
    if (date == null) {
      editElm.show();
      dateElm.hide();
    } else {
      const dateObj = new Date(date);
      const dateString = (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + '<br>' + 
        dateObj.getHours().toString().padStart(2, '0') + ":" + dateObj.getMinutes().toString().padStart(2, '0');
      dateElm.html(dateString);
        
      editElm.hide();
      dateElm.show();
    }

    $($('.side-menu-old-cs')[index]).show();
  }

  public static setChampionImg(patchInfo: any, element: any, championId: string) {
    const championName = patchInfo.ChampionIdToName[championId] || "";
    const currName = element.attr('title');
    if (currName == championName) return;  //Already showing this
    element.attr('title', championName);

    const champInfo = patchInfo.ChampionNameToSprite[championName];
    if (champInfo) {
      element.attr('src', '/img/champion-sprites/' + champInfo.file + '?v=' + version);
      element.off('load');
      element.on('load', function() {
        element.css('margin-top', '' + (-champInfo.y - 2) + 'px');
        element.css('margin-left', '' + (-champInfo.x - 2) + 'px');
        element.show();
      });
    }
    element.hide();
  }

  public static setRoleImg(element: any, role: number, tier: string, division: string, lp: string) {
    tier = tier || '';
    division = division || '';
    lp = lp || '';
    const grayscale = tier == '';
    const tierFile = tier == "platinum" ? 'plat' : tier == '' ? 'plat' : tier; // Because plat looks the best in grayscale
    const posFileNames = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];

    const hash = tierFile + '-' + posFileNames[role] + (grayscale ? 'g':'');
    const currName = element.attr('title');
    if (currName == hash) {
      element.show();
      return;
    }
    element.attr('title', hash);

    element.attr('src', '/img/ranked-positions/Position_' + tierFile + '-' + posFileNames[role] + '.png');
    // element.parent().attr('title', (tier == '' ? '' : Utils.capitalizeFirstLetter(tier) + ' ' + division + ' ' + lp + ' LP ') + posFileNames[role]);
    element.css('filter', grayscale ? 'grayscale(100%)' : '');
    element.off('load');
    element.on('load', function() { element.show(); });
  }

  // Heart of this class
  private update(manager: CsManager, change: string) {
    const subscribed = Subscriptions.isSubscribed();
    this.currentCsManager = manager;
    this.currentCsManager.ongoingProgressBar.setActive();

    let time = new Date().getTime();
    const timeStats = {};
    //Updates the html view, change is for optimization, if empty reset everything
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = 
      manager.getCsView();

    const mergedTier = CsTab.mergeTiers(lcuTiers, apiTiers);
    //csInputView and rolePredictionView are always available
    const ownerIdx = CsInput.getOwnerIdx(csInputView);
    const side = Math.floor(ownerIdx/5);
    const patchInfo = MainWindow.instance().patchInfo;
    const swappedChampsView = CsManager.applyChampionSwaps(csInputView);
    if (swappable) {
      $('.cs-table-champion-swap').show();
    } else {
      $('.cs-table-champion-swap').hide();
    }

    if (change == 'clearData') {
      change = '';
    }
    timeStats['init'] = new Date().getTime() - time; time = new Date().getTime();
    if (!change || change == '' || change == 'instant') {
      const roleToIdxView = this.roleToIdx(rolePredictionView);
      this.setAllToLoading();
      this.updateDistributionLegend(patchInfo, side, swappedChampsView, rolePredictionView);
      this.updateFooter(patchInfo, csInputView, editable && subscribed);
      this.updateSwaps(patchInfo, side, csInputView, roleToIdxView, mergedTier);
      this.updateSummonersAndRoles(patchInfo, side, csInputView, rolePredictionView, mergedTier);
      this.updatePicking(side, csInputView, rolePredictionView);
    }
    timeStats['instant'] = new Date().getTime() - time; time = new Date().getTime();
    if (!change || change == '' || change == 'data') {
      this.updateWarnings(patchInfo, csInput, history);
      this.updateHistory(patchInfo, side, rolePrediction, csInput, history, historyStats, mergedTier);
      if (change == 'data') {
        const roleToIdx =  this.roleToIdx(rolePrediction);
        this.updateSwaps(patchInfo, side, csInput, roleToIdx, mergedTier); //Now the tiers are updated
        this.updateSummonersAndRoles(patchInfo, side, csInput, rolePrediction, mergedTier); //Now the tiers are updated
      }
    }
    timeStats['data'] = new Date().getTime() - time; time = new Date().getTime();
    if (!change || change == '' || change == 'score') {
      if (score && score.full && score.partial) {
        this.updateScore(score.full[0][side], score.partial[side][0][side], score.partial[1 - side][0][1 - side]);
      } else if (score && score.full) {
        this.updateScore(score.full[0][Math.floor(ownerIdx/5)], -1, -1);
      } else {
        this.updateScore(0.5, -1, -1);
      }
      if (score && score.full) {
        this.updateObjectives(side, score.full);
        this.updateDistributions(side, score.full);
        this.updateRoleScores(side, score.full);
      } else {
        this.updateObjectives(side, null);
        this.updateDistributions(side, null);
        this.updateRoleScores(side, null);
      }
    }
    timeStats['score'] = new Date().getTime() - time; time = new Date().getTime();
    if (!change || change == '' || change == 'missing') {
      if (score && score.full) this.updateTeamScores(side, csInput, rolePrediction, score.full[0], missingScore);
    }
    timeStats['missing'] = new Date().getTime() - time; time = new Date().getTime();
    if (!change || change == '' || change.startsWith('picks')) {
      if (score && score.full && rolePrediction && csInput) {
        const roleToIdx =  this.roleToIdx(rolePrediction);

        for (let pickI of (change == '' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [parseInt(change.substring(5))])) {
          const name = csInput.summonerNames[roleToIdx[pickI]];
          const role = pickI % 5;
          const currRecommendations = (recommendations || {})[pickI] || [];
          const currHistory = (history || {})[name] || [];
          const currHistoryStats = (((historyStats || {}).champStats || {})[name] || {})[role] || [];
    
          this.updatePicks(patchInfo, side, score.full, pickI, currRecommendations, currHistory, currHistoryStats);
        }
      } else {
        this.updatePicks(patchInfo, side, null, null, null, null, null);
      }
    }
    timeStats['picks'] = new Date().getTime() - time; time = new Date().getTime();
    if (!change || change == '' || change == 'finished') {
      //Do nothing, this is for registering into history
    }
    //Logger.debug(JSON.stringify(timeStats));
  }

  private roleToIdx(roles: number[]) {
    const res = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    for (let i = 0; i < 10; i++) {
      res[Math.floor(i / 5) * 5 + roles[i]] = i;
    }    
    return res;
  }

  public static mergeTiers(lcuTiers: any, apiTiers: any[]) {
    const res = {};
    if (lcuTiers) {
      for (const name in lcuTiers) {
        res[name] = lcuTiers[name];
      }
    }
    if (apiTiers) {
      for (const i in apiTiers) {
        const x = apiTiers[i];
        if (res[x.name] && res[x.name].tier != '') continue;
        res[x.name] = { tier: x.tier.toLowerCase(), division: x.division, lp: x.lp };
      }
    }
    return res;
  }

  private updateScore(wr: number, wrLeft: number, wrRight: number) {
    if (isNaN(wr)) return;
    const showSideScores = !isNaN(wrLeft) && !isNaN(wrRight) && wrLeft != -1 && wrRight != -1;

    $('.cs-wr-total').addClass('tooltip');
    if (showSideScores) {
      $('.cs-wr-total-left').addClass('tooltip');
      $('.cs-wr-total-right').addClass('tooltip');
    }

    $('.cs-wr-total-tooltip').removeClass('tooltiptext-lg-error');
    $('.cs-wr-total-tooltip').addClass('tooltiptext-lg-msg');
    if (showSideScores) {
      $('.cs-wr-total-left-tooltip').removeClass('tooltiptext-lg-error');
      $('.cs-wr-total-left-tooltip').addClass('tooltiptext-lg-msg');
      $('.cs-wr-total-right-tooltip').removeClass('tooltiptext-lg-error');
      $('.cs-wr-total-right-tooltip').addClass('tooltiptext-lg-msg');
    }

    this.clearAllFrameColorClasses();

    if (Math.round(Math.abs(wr - 0.5) * 100) >= 10) {
      if (wr > 0.5) {
        $('.cs-wr-total-frame').addClass('cs-wr-total-frame-success' + (showSideScores ? '-holes' : ''));
      } else {
        $('.cs-wr-total-frame').addClass('cs-wr-total-frame-danger' + (showSideScores ? '-holes' : ''));
      }
    } else if (Math.round(Math.abs(wr - 0.5) * 100) >= 3) {
      if (wr > 0.5) {
        $('.cs-wr-total-frame').addClass('cs-wr-total-frame-little-success' + (showSideScores ? '-holes' : ''));
      } else {
        $('.cs-wr-total-frame').addClass('cs-wr-total-frame-little-danger' + (showSideScores ? '-holes' : ''));
      }
    } else if (showSideScores) {
      $('.cs-wr-total-frame').addClass('cs-wr-total-frame-holes');
    }

    $('.cs-wr-total-result').css('opacity', '1.0');
    /* await */ Utils.smoothChangeNumber($('.cs-wr-total-result').get(0), wr * 10);
    if (showSideScores) {
      $('.cs-wr-total-left-result').css('opacity', '1.0');
      $('.cs-wr-total-right-result').css('opacity', '1.0');
      /* await */ Utils.smoothChangeNumber($('.cs-wr-total-left-result').get(0), wrLeft * 10);
      /* await */ Utils.smoothChangeNumber($('.cs-wr-total-right-result').get(0), wrRight * 10);
    } else {
      /* await */ Utils.stopSmoothChangeNumberAnimation($('.cs-wr-total-left-result').get(0));
      /* await */ Utils.stopSmoothChangeNumberAnimation($('.cs-wr-total-right-result').get(0));
      $('.cs-wr-total-left-result').html('');
      $('.cs-wr-total-right-result').html('');
    }
  }

  private clearAllFrameColorClasses() {
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-holes');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-success');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-success-holes');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-danger');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-danger-holes');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-little-success');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-little-success-holes');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-little-danger');
    $('.cs-wr-total-frame').removeClass('cs-wr-total-frame-little-danger-holes');
  }

  private updateObjectives(side:number, scores: number[][]) {
    if (!scores) {
      $('.cs-objective-cell-value').css('opacity', '0.0');
      $('.cs-objective-timer-cell-value').css('opacity', '0.0');
      return;
    }

    const IOUT_TIME = 11;
    const IOUT_OBJECTIVES = 12;
    const oArr = scores[IOUT_OBJECTIVES];
    const tArr = scores[IOUT_TIME]; //(0-10, -15, -20, -25, -30, -35, 35+)
    const minuteI = tArr.indexOf(Math.max(...tArr));
    let minutes = '';
    if (minuteI == 0) {
      minutes = '<10m';
    } else if (minuteI == 6) {
      minutes = '>35m';
    } else {
      let wAvg = 0.0;
      for (let i = 0; i < 7; ++i) {
        wAvg += tArr[i] * (i * 5 + 7.5);
      }
      // const probs = [ tArr[minuteI - 1], tArr[minuteI], tArr[minuteI + 1] ];
      // const vals = [ minuteI * 5 + 2.5, minuteI * 5 + 7.5, minuteI * 5 + 12.5 ];
      // const probSum = probs[0] + probs[1] + probs[2];
      // minutes = '~' + Math.round((probs[0] * vals[0] + probs[1] * vals[1] + probs[2] * vals[2]) / probSum).toString() + 'm';
      minutes = '~' + Math.round(wAvg).toString() + 'm';
    }

    $('.cs-objective-cell-value').css('opacity', '1.0');
    $('.cs-objective-timer-cell-value').css('opacity', '1.0');
    const objVa = $('.cs-objective-cell-value').get();
    objVa[0].innerHTML = Math.round(oArr[side * 3 + 0]).toString();
    objVa[1].innerHTML = Math.round(oArr[side * 3 + 1]).toString();
    objVa[2].innerHTML = Math.round(oArr[side * 3 + 2]).toString();
    objVa[3].innerHTML = Math.round(oArr[(1 - side) * 3 + 0]).toString();
    objVa[4].innerHTML = Math.round(oArr[(1 - side) * 3 + 1]).toString();
    objVa[5].innerHTML = Math.round(oArr[(1 - side) * 3 + 2]).toString();
    $('.cs-objective-timer-cell-value').get(0).innerHTML = minutes;
  }

  private updateDistributionLegend(patchInfo: any, side: number, championIds: string[], rolePrediction: number[]) {
    const imgElems = $('.cs-colors-legend-table').find('img').get(); 
    for (let i = 0; i < 5; ++i) {
      const el0 = $(imgElems[side * 5 + rolePrediction[i]]);
      const el1 = $(imgElems[(1 - side) * 5 + rolePrediction[5 + i]]);
      CsTab.setChampionImg(patchInfo, el0, championIds[i]);
      CsTab.setChampionImg(patchInfo, el1, championIds[5 + i]);
    }
  }

  private updateDistributions(side:number, scores: number[][]) {
    if (!scores) {
      const barElems =  $('.cs-total-bars-table').find('.cs-colors-bar').get();
      for (let i = 0; i < barElems.length; ++i) {
        this.setBar(barElems[i], 0.0);
      }
      return;
    }

    const IOUT_FIRST_BLOOD = 13;
    const IOUT_DMG_TOTAL_BLUE = 110;
    const IOUT_DMG_TOTAL_RED = 111;
    const IOUT_TURRET_DAMAGE_BLUE = 96;
    const IOUT_TURRET_DAMAGE_RED = 97;
    const IOUT_GOLD_BLUE = 100;
    const IOUT_GOLD_RED = 101;
    const IOUT_KP_BLUE = 15;
    const IOUT_KP_RED = 16;
    const fbArr = scores[IOUT_FIRST_BLOOD];
    const teamFbArr = fbArr.slice(side * 5, side * 5 + 5);
    const enemyFbArr = fbArr.slice((1 - side) * 5, (1 - side) * 5 + 5);
    const fbNorm = Math.max(
      teamFbArr[0] + teamFbArr[1] + teamFbArr[2] + teamFbArr[3] + teamFbArr[4], 
      enemyFbArr[0] + enemyFbArr[1] + enemyFbArr[2] + enemyFbArr[3] + enemyFbArr[4]
    );

    const teamDmgArr = scores[side == 0 ? IOUT_DMG_TOTAL_BLUE : IOUT_DMG_TOTAL_RED];
    const enemyDmgArr = scores[side == 1 ? IOUT_DMG_TOTAL_BLUE : IOUT_DMG_TOTAL_RED];

    const teamTurretDmgArr = scores[side == 0 ? IOUT_TURRET_DAMAGE_BLUE : IOUT_TURRET_DAMAGE_RED];
    const enemyTurretDmgArr = scores[side == 1 ? IOUT_TURRET_DAMAGE_BLUE : IOUT_TURRET_DAMAGE_RED];

    const teamGoldArr = scores[side == 0 ? IOUT_GOLD_BLUE : IOUT_GOLD_RED];
    const enemyGoldArr = scores[side == 1 ? IOUT_GOLD_BLUE : IOUT_GOLD_RED];

    const teamKpArr = scores[side == 0 ? IOUT_KP_BLUE : IOUT_KP_RED];
    const enemyKpArr = scores[side == 1 ? IOUT_KP_BLUE : IOUT_KP_RED];

    const barElems =  $('.cs-total-bars-table').find('.cs-colors-bar').get();
    for (let role = 0; role < 5; ++role) {
      this.setBar(barElems[0 + role], teamFbArr[role] / fbNorm);
      this.setBar(barElems[5 + role], enemyFbArr[role] / fbNorm);

      this.setBar(barElems[10 + role], teamDmgArr[role]);
      this.setBar(barElems[15 + role], enemyDmgArr[role]);

      this.setBar(barElems[20 + role], teamTurretDmgArr[role]);
      this.setBar(barElems[25 + role], enemyTurretDmgArr[role]);

      this.setBar(barElems[30 + role], teamGoldArr[role]);
      this.setBar(barElems[35 + role], enemyGoldArr[role]);

      this.setBar(barElems[40 + role], teamKpArr[role]);
      this.setBar(barElems[45 + role], enemyKpArr[role]);
    }
  }

  private setBar(elem: HTMLElement, p: number) {
    const w = (100 * p).toFixed(2).toString() + '%';
    if ($(elem).attr('title') == w) return;
    $(elem).stop();
    $(elem).animate({ width: w }, 400); //this line is slow (100 ms in total)
    // $(elem).css('width', w); //This one is faster but uglier (10 ms)
    //TODO use a canvas instead, then remove the hack in MainWindow.selectHistoryCS()
    $(elem).attr('title', w);
  }

  private updateRoleScores(side: number, scores: number[][]) {
    if (!scores) {
      $('.cs-table-prio-p').css('opacity', 0.0);
      $('.cs-table-lane-winner-p').css('opacity', 0.0);
      $('.cs-table-individuals-p').css('opacity', 0.0);
      return;
    }

    const IOUT_ROLE_EARLY_XP = 19; //+3
    const IOUT_ROLE_XP = 20; //+3
    const IOUT_ROLE_GOLD = 21; //+3
    const prioElems = $('.cs-table-prio-p').get();
    const winnerElems = $('.cs-table-lane-winner-p').get();
    
    for (let i = 0; i < 5; ++i) {
      const earlyXp = scores[IOUT_ROLE_EARLY_XP + i * 3][side];
      const xp = scores[IOUT_ROLE_XP + i * 3][side];
      const gold = scores[IOUT_ROLE_GOLD + i * 3][side];
      CsTab.setSubScore($(prioElems[i]), earlyXp - 0.5, true);
      CsTab.setSubScore($(winnerElems[i]), (xp + gold) / 2 - 0.5, true);
    }

    //Solo scores
    const elems = $('.cs-table-individuals-p').get();
    for (let i = 0; i < 5; ++i) {
      CsTab.setSubScore($(elems[4 * i + side]), scores[1 + i][0] - 0.5, side == 0);
      CsTab.setSubScore($(elems[4 * i + 1 - side]), scores[1 + 5 + i][0] - 0.5, side != 0);
    }
  }

  public static setSubScore(elem: any, score: number, isMyTeam: boolean, fadeIn: boolean = true) {
    const signedScore = (Math.round(score * 100) >= 0 ? "+" : "") + (Math.round(score * 100) / 10).toFixed(1);

    elem.html(signedScore);

    elem.removeClass('text-success');
    elem.removeClass('text-danger');
    elem.removeClass('text-little-success');
    elem.removeClass('text-little-danger');
    if (Math.abs(score) >= 0.05) {
      if (score > 0 && isMyTeam || score < 0 && !isMyTeam) {
        elem.addClass('text-success');
      } else if (score < 0 && isMyTeam || score > 0 && !isMyTeam) {
        elem.addClass('text-danger');
      }
    } else if (Math.abs(score) >= 0.02) {
      if (score > 0 && isMyTeam || score < 0 && !isMyTeam) {
        elem.addClass('text-little-success');
      } else if (score < 0 && isMyTeam || score > 0 && !isMyTeam) {
        elem.addClass('text-little-danger');
      }
    }

    elem.stop();
    if (fadeIn) {
      elem.css('opacity', 0.1);
      elem.animate({ opacity: 1.0 }, 400);
    } else {
      elem.css('opacity', 1.0);
    }
  }

  private updateFooter(patchInfo: any, inputView: CsInput, editableCs: boolean) {
    $('.cs-region-value').html((patchInfo.RegionIdToGg[inputView.region] || 'Enter Region').toUpperCase());

    const blue = CsInput.getOwnerIdx(inputView) < 5;

    $('.cs-side-blue').prop("checked", blue);
    $('.cs-side-red').prop("checked", !blue);

    const isFlex = CsTab.isFlex(patchInfo, inputView.queueId);
    $('.cs-queue-solo').prop("checked", !isFlex);
    $('.cs-queue-flex').prop("checked", isFlex);

    if (!editableCs) {
      $('.cs-side input').hide();
      $('.cs-queue input').hide();
      $($('.cs-side .translated-text').get(blue ? 1 : 2)).show();
      $($('.cs-side .translated-text').get(blue ? 2 : 1)).hide();
      $($('.cs-queue .translated-text').get(isFlex ? 2 : 1)).show();
      $($('.cs-queue .translated-text').get(isFlex ? 1 : 2)).hide();
    } else {
      $('.cs-side input').show();
      $('.cs-queue input').show();
      $('.cs-side .translated-text').show();
      $('.cs-queue .translated-text').show();
    }

    //Keep these just in case:
    $('.cs-side-blue').attr('disabled', <any>!editableCs);
    $('.cs-side-red').attr('disabled', <any>!editableCs);
    $('.cs-queue-solo').attr('disabled', <any>!editableCs);
    $('.cs-queue-flex').attr('disabled', <any>!editableCs);
  }

  public static isFlex(patchInfo: any, queueId: any) {
    const isRanked = patchInfo.RankedQueueTypeIds.includes(parseInt(queueId));
    const isSolo = patchInfo.SoloQueueTypeIds.includes(parseInt(queueId));
    return isRanked && !isSolo;
  }

  private updateWarnings(patchInfo: any, inputView: CsInput, history: any) {
    let warn = false;

    if (inputView && patchInfo.RankedQueueTypeIds.includes(parseInt(inputView.queueId))) {
      $('.cs-warning-unranked').hide();
    } else {
      $('.cs-warning-unranked').show();
      warn = true;
    }
    if (inputView && history && inputView.summonerNames.filter(name => name != '' && (!(name in history) || history[name].length == 0)).length == 0) {
      $('.cs-warning-missing-history').hide();
    } else {
      $('.cs-warning-missing-history').show();
      warn = true;
    }

    if (warn) {
      $('.cs-warning').show();
    } else {
      $('.cs-warning').hide();
    }
    
  }

  private updateSwaps(patchInfo: any, side: number, inputView: CsInput, roleToIdx: number[], lcuTiers: any) {
    if (!inputView || !roleToIdx) {
      return;
    } 

    const swappedChampsView = CsManager.applyChampionSwaps(inputView);

    const swapElems = $('.cs-table-champion-swap-options').get();
    for (let role = 0; role < 5; ++role) {
      const idx0 = roleToIdx[role];
      const idx1 = roleToIdx[5 + role];
      const lcuTier0 = (lcuTiers || {})[inputView.summonerNames[idx0]] || {};
      const lcuTier1 = (lcuTiers || {})[inputView.summonerNames[idx1]] || {};
      const e0 = swapElems[2 * role + side];
      const e1 = swapElems[2 * role + 1 - side];
      let z = 0;

      const rImgElems0 = $(e0).find('.cs-table-champion-swap-role img').get();
      const rImgElems1 = $(e1).find('.cs-table-champion-swap-role img').get();
      const cElems0 = $(e0).find('.cs-table-champion-swap-champion').get();
      const cElems1 = $(e1).find('.cs-table-champion-swap-champion').get();
      const cImgElems0 = $(e0).find('.cs-table-champion-swap-champion img').get();
      const cImgElems1 = $(e1).find('.cs-table-champion-swap-champion img').get();
      for (let otherRole = 0; otherRole < 5; ++otherRole) {
        if (otherRole == role) continue;

        CsTab.setRoleImg($(rImgElems0[z]), otherRole, lcuTier0.tier, lcuTier0.division, lcuTier0.lp)
        CsTab.setRoleImg($(rImgElems1[z]), otherRole, lcuTier1.tier, lcuTier1.division, lcuTier1.lp)

        const cId0 = swappedChampsView[roleToIdx[otherRole]];
        if (cId0 && cId0 != '' && cId0 != '0') {
          CsTab.setChampionImg(patchInfo, $(cImgElems0[z]), cId0);
          $(cElems0[z]).show();
        } else {
          $(cElems0[z]).hide();
        }
        const cId1 = swappedChampsView[roleToIdx[5 + otherRole]];
        if (cId1 && cId1 != '' && cId1 != '0') {
          CsTab.setChampionImg(patchInfo, $(cImgElems1[z]), cId1);
          $(cElems1[z]).show();
        } else {
          $(cElems1[z]).hide();
        }

        z++;
      }
  
    }
  }

  private updateSummonersAndRoles(patchInfo: any, side: number, inputView: CsInput, rolePrediction: number[], tiers: any) {
    if (!inputView || !rolePrediction) return;

    const swappedChampsView = CsManager.applyChampionSwaps(inputView);
    const championsImgs = $('.cs-table').find('.cs-table-champion-icon-cell .cs-table-champion-icon img').get();
    const summonerNames = $('.cs-table').find('.cs-table-summoner-name-cell .cs-table-cell').get();
    const tierFields = $('.cs-table').find('.cs-table-summoner-tier-cell .cs-table-cell').get();
    const roleIcons = $('.cs-table').find('.role-icon img').get();
    const roleTooltips = $('.cs-table').find('.role-icon .translated-text').get();
    const roleNames = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];
    for (let i = 0; i < 5; ++i) {
      const role0 = rolePrediction[i];
      const role1 = rolePrediction[5 + i];
      CsTab.setChampionImg(patchInfo, $(championsImgs[2 * role0 + side]), swappedChampsView[i])
      CsTab.setChampionImg(patchInfo, $(championsImgs[2 * role1 + 1 - side]), swappedChampsView[5 + i])

      const sName0 = inputView.summonerNames[i];
      const sName1 = inputView.summonerNames[i + 5];
      summonerNames[2 * role0 + side].innerHTML = !sName0 || sName0 == '' ? '❔' : sName0; //�
      summonerNames[2 * role1 + 1 - side].innerHTML = !sName1 || sName1 == '' ? '❔' : sName1;
      $(summonerNames[2 * role0 + side]).css('text-overflow', 'ellipsis');
      $(summonerNames[2 * role1 + 1 - side]).css('text-overflow', 'ellipsis');

      const t0 = (tiers || {})[inputView.summonerNames[i]] || {};
      const t1 = (tiers || {})[inputView.summonerNames[i + 5]] || {};
      tierFields[2 * role0 + side].innerHTML = (!t0.tier || t0.tier == '' ? '' : Utils.capitalizeFirstLetter(t0.tier) + ' ' + t0.division + ' ' + t0.lp + ' LP ');
      tierFields[2 * role1 + 1 - side].innerHTML = (!t1.tier || t1.tier == '' ? '' : Utils.capitalizeFirstLetter(t1.tier) + ' ' + t1.division + ' ' + t1.lp + ' LP ');

      const tTeam = (tiers || {})[inputView.summonerNames[i + 5 * side]] || {};
      const teamRole = rolePrediction[i + 5 * side];
      CsTab.setRoleImg($(roleIcons[teamRole]), teamRole, tTeam.tier, tTeam.division, tTeam.lp);
      roleTooltips[teamRole].innerHTML = roleNames[teamRole];
    }
  }

  private updatePicking(side: number, inputView: CsInput, rolePrediction: number[]) {
    const elems = [
      $('.cs-table-champion-icon-cell').get(),
      $('.cs-table-summoner-name-cell').get(),
      $('.cs-table-individuals-solo-cell').get(),
      $('.cs-table-summoner-tier-cell').get(),
      $('.cs-table-individuals-team-cell').get(),
      $('.cs-table-recommended-champions-cell').get(),
    ];
    for (let i = 0; i < 5; ++i) {
      const role0 = rolePrediction[i];
      const role1 = rolePrediction[5 + i];
      const pick0 = inputView.picking[i];
      const pick1 = inputView.picking[5 + i];
      const champ0 = inputView.championIds[i];
      const champ1 = inputView.championIds[5 + i];
      const assigned0 = inputView.assignedRoles[i];
      const assigned1 = inputView.assignedRoles[5 + i];

      for (let j = 0; j < elems.length; ++j) {
        if (pick0 && assigned0 != -1 && champ0 != '0' && champ0 != '-1' && champ0.length > 0) {
          $(elems[j][2 * role0 + side]).addClass('picking');
        } else {
          $(elems[j][2 * role0 + side]).removeClass('picking');
        }
        if (pick1 && assigned1 != -1 && champ1 != '0' && champ1 != '-1' && champ1.length > 0) {
          $(elems[j][2 * role1 + 1 - side]).addClass('picking');
        } else {
          $(elems[j][2 * role1 + 1 - side]).removeClass('picking');
        }
      }
    }

  }

  private updateHistory(patchInfo: any, side: number, rolePrediction: number[], inputView: CsInput, history: any, historyStats: any, lcuTiers: any) {
    if (!rolePrediction || !inputView || !history) {
      $('.cs-table-history-border').hide();
      $('.cs-table-history-separator').hide();
      $('.cs-table-role-wr').hide();
      $('.cs-table-role-win-lose-cell img').hide();
      return;
    }

    const elements = $('.cs-table-history-border').get();
    const historyWarningElements = $('.cs-table-history-cell-warning').get();
    const separators = $('.cs-table-history-separator').get();
    const roleWrElements = $('.cs-table-role-wr').get();
    const roleImgElements = $('.cs-table-role-win-lose-cell img').get();

    for (let i = 0; i < 10; ++i) {
      const name = inputView.summonerNames[i];
      const role = rolePrediction[i];
      const team = Math.floor(i / 5);
      const elemI = (2 * role + (team + side) % 2) % 10; //Good luck understanding this
      const mainRoleI = 4 * role + (team + side) % 2;
      const lcuTier = (lcuTiers || {})[name] || {};
      const currHistory = (history || {})[name] || [];
      const currRoleStats = ((historyStats || {}).roleStats || {})[name] || [];

      const totalGames = <number>Object.values(currRoleStats).map((x: any) => x.games).reduce((a, b) => <number>a + <number>b, 0);

      const mainRoles = Object.keys(currRoleStats).sort((a,b) => currRoleStats[a].games < currRoleStats[b].games ? 1 : currRoleStats[a].games > currRoleStats[b].games ? -1 : 
        currRoleStats[a].timestamp < currRoleStats[b].timestamp ? 1 : -1);

      if (mainRoles.length > 0) {
        // $(roleWrElements[mainRoleI]).html(Math.round(100 * roleStats[mainRoles[0]].wins / roleStats[mainRoles[0]].games).toString() + '%');
        // $(roleWrElements[mainRoleI]).html(roleStats[mainRoles[0]].wins + '/'  + roleStats[mainRoles[0]].games);
        $(roleWrElements[mainRoleI]).html(Math.round(100 * currRoleStats[mainRoles[0]].games / totalGames).toString() + '%');
        $(roleWrElements[mainRoleI]).show();
        CsTab.setRoleImg($(roleImgElements[mainRoleI]), parseInt(mainRoles[0]), lcuTier.tier, lcuTier.division, lcuTier.lp);
      } else {
        $(roleWrElements[mainRoleI]).hide();
        $(roleImgElements[mainRoleI]).hide();
      }
      if (mainRoles.length > 1) {
        // $(roleWrElements[mainRoleI + 2]).html(Math.round(100 * roleStats[mainRoles[1]].wins / roleStats[mainRoles[1]].games).toString() + '%');
        // $(roleWrElements[mainRoleI + 2]).html(roleStats[mainRoles[1]].wins + '/' + roleStats[mainRoles[1]].games);
        $(roleWrElements[mainRoleI + 2]).html(Math.round(100 * currRoleStats[mainRoles[1]].games / totalGames).toString() + '%');
        $(roleWrElements[mainRoleI + 2]).show();
        CsTab.setRoleImg($(roleImgElements[mainRoleI + 2]), parseInt(mainRoles[1]), lcuTier.tier, lcuTier.division, lcuTier.lp);
      } else {
        $(roleWrElements[mainRoleI + 2]).hide();
        $(roleImgElements[mainRoleI + 2]).hide();
      }
  
      if (currHistory.length == 0 && name.length > 0) {
        $(historyWarningElements[elemI]).show();
      } else {
        $(historyWarningElements[elemI]).hide();
      }

      for (let h = 0; h < CsTab.NUM_HISTORY; ++h) {
        const root = $(elements[elemI * CsTab.NUM_HISTORY + (elemI % 2 == 0 ? h : CsTab.NUM_HISTORY - 1 - h)]);
        const separator = $(separators[elemI * CsTab.NUM_HISTORY + (elemI % 2 == 0 ? h : CsTab.NUM_HISTORY - 1 - h)]);
        if (currHistory.length <= h) {
          root.hide();
          separator.hide();
          continue;
        }
        
        const hist = currHistory[h];
        CsTab.setChampionImg(patchInfo, root.find('.cs-table-history-champion img'), hist.ChampionId);
        CsTab.setRoleImg(root.find('.cs-table-history-role img'), hist.Role, lcuTier.tier, lcuTier.division, lcuTier.lp);
        root.find('.cs-table-stats-champion-name').html(patchInfo.ChampionIdToName[hist.ChampionId] || "");

        if (
          elemI % 2 == 0 && h < CsTab.NUM_HISTORY - 1 && h + 1 < currHistory.length && (currHistory[h].Timestamp - currHistory[h + 1].Timestamp) > 1000 * 60 * 60 * 3 ||
          elemI % 2 == 1 && h > 0 && (currHistory[h - 1].Timestamp - currHistory[h].Timestamp) > 1000 * 60 * 60 * 3
          ) {
          separator.show();
        } else {
          separator.hide();
        }

        root.removeClass('cs-table-history-border-win');
        root.removeClass('cs-table-history-border-lose');
        if (hist.Victory) {
          root.addClass('cs-table-history-border-win');
        } else {
          root.addClass('cs-table-history-border-lose');
        }

        const rootElems = root.find('.cs-table-stats-value').get();
        $(rootElems[0]).html(Math.floor((Date.now() - hist.Timestamp) / (1000 * 60 * 60 * 24)).toString());
        $(rootElems[1]).html(hist.Assists);
        $(rootElems[2]).html(hist.Deaths);
        $(rootElems[3]).html(hist.Kills);

        root.show();
        // root.stop();
        // root.css('opacity', 0.1);
        // root.animate({ opacity: 1.0 }, 400);
      }
    }
  }

  private updateTeamScores(side: number, inputView: CsInput, rolePrediction: number[], fullScore: number[], missingScore: any) {
    const elems = $('.cs-table-individuals-p').get();
    if (!inputView || !rolePrediction || !fullScore || !missingScore) {
      for (let i = 0; i < 5; ++i) {
        $(elems[4 * i + 2]).css('opacity', 0.0);
        $(elems[4 * i + 1 + 2]).css('opacity', 0.0);
      }
      return;
    }

    for (let i = 0; i < 5; ++i) {
      const nameBlue = inputView.summonerNames[i];
      const nameRed = inputView.summonerNames[5 + i];
      CsTab.setSubScore($(elems[4 * rolePrediction[i] + side + 2]), nameBlue != '' && nameBlue in missingScore ? fullScore[0] - missingScore[nameBlue][0] : 0.0, side == 0);
      CsTab.setSubScore($(elems[4 * rolePrediction[5 + i] + 1 - side + 2]), nameRed != '' && nameRed in missingScore ? fullScore[1] - missingScore[nameRed][1] : 0.0, side != 0);
    }
  }

  private updatePicks(patchInfo: any, side: number, fullScore: number[], participantI: number, recommendations: any[], history: any[], champStats: any[]) {
    if (!fullScore || !recommendations || !history || !champStats) {
      $('.cs-table-recommended-champion').hide();
      // $('.cs-lds-ring').hide();
      return;
    }
    
    const elements = $('.cs-table-recommended-champion').get();
    const baseline = fullScore[0][Math.floor(participantI / 5)];
    const role = participantI % 5;
    const team = Math.floor(participantI / 5);

    const partI = (2 * role + (team + side) % 2) % 10; //Good luck understanding this
    for (let i = 0; i < CsTab.NUM_RECOMMENDATIONS; ++i) {
      const root = $(elements[partI * CsTab.NUM_RECOMMENDATIONS + (team == side ? i : CsTab.NUM_RECOMMENDATIONS - 1 - i)]);
      const rootElems = root.find('.cs-table-stats-value').get();
      if (recommendations.length <= i) {
        root.hide();
        continue;
      }
      const cId = recommendations[i].championId;
      const stats = champStats[cId];
      if (!stats) {
        ErrorReporting.report('updatePicks', '!stats');
        return;
      }
      root.find('.cs-table-stats-champion-name').html(patchInfo.ChampionIdToName[cId] || "");
      CsTab.setSubScore($(rootElems[0]), recommendations[i].winRate - baseline, team == side);
      CsTab.setChampionImg(patchInfo, root.find('.cs-table-recommended-champion-border img'), cId);
      $(rootElems[1]).html(stats.games);
      $(rootElems[2]).html(stats.daysAgo);
      $(rootElems[3]).html(Math.round(100 * stats.wins / stats.games).toString() + '%');
      $(rootElems[4]).html((Math.round(10 * stats.assists / stats.games) / 10).toString());
      $(rootElems[5]).html((Math.round(10 * stats.deaths / stats.games) / 10).toString());
      $(rootElems[6]).html((Math.round(10 * stats.kills / stats.games) / 10).toString());

      root.show();
      root.stop();
      root.css('opacity', 0.1);
      root.animate({ opacity: 1.0 }, 400);
      root.find('.cs-table-recommended-champion-border img').css('opacity', 1.0);
    }

    $($('.cs-lds-ring').get(partI)).hide();
  }

  private setAllToLoading() {
    $('.cs-wr-total-result').css('opacity', '0.6');
    $('.cs-wr-total-left-result').css('opacity', '0.6');
    $('.cs-wr-total-right-result').css('opacity', '0.6');
    $('.cs-objective-cell-value').css('opacity', '0.6');
    $('.cs-objective-timer-cell-value').css('opacity', '0.6');
    $('.cs-table-individuals-p').css('opacity', '0.6');
    $('.cs-table-prio-p').css('opacity', '0.6');
    $('.cs-table-lane-winner-p').css('opacity', '0.6');

    $('.cs-table-recommended-champion-border img').css('opacity', '0.6');
    // $('.cs-table-history-border').css('opacity', '0.6'); //Too flickery

    $('.cs-lds-ring').show();
  }

  //Manual edits
  public async swapRole(role: number, i: number) {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const roleToIdx =  this.roleToIdx(rolePredictionView);
    const blue = CsInput.getOwnerIdx(csInputView) < 5;
    const swapped = CsInput.clone(csInputView);
    for (const j in swapped.roleSwaps) {
      if (swapped.roleSwaps[j] == i) swapped.roleSwaps[j] = -1;
    }
    swapped.roleSwaps[roleToIdx[(role + (blue ? 0 : 5)) % 10]] = i;
    await this.currentCsManager.manualCsChange(swapped);
  }

  public async swapChampion(role: number, i: number) {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const swappedChampsView = CsManager.applyChampionSwaps(csInputView);

    const roleToIdx =  this.roleToIdx(rolePredictionView);
    const blue = CsInput.getOwnerIdx(csInputView) < 5;
    const swapped = CsInput.clone(csInputView);
    const targetChampion = i == -1 ? null : swappedChampsView[roleToIdx[(i + (blue ? 0 : 5)) % 10]];
    for (const j in swapped.championSwaps) {
      if (swapped.championSwaps[j] == targetChampion) swapped.championSwaps[j] = null;
    }
    swapped.championSwaps[roleToIdx[(role + (blue ? 0 : 5)) % 10]] = targetChampion;
    await this.currentCsManager.manualCsChange(swapped);
  }

  public editSummoner(role: number) {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const roleToIdx =  this.roleToIdx(rolePredictionView);
    const blue = CsInput.getOwnerIdx(csInputView) < 5;
    const idx = roleToIdx[(role + (blue ? 0 : 5)) % 10];
    Popup.text(TranslatedText.editPlayer.english, TranslatedText.enterPlayerName.english, csInputView.summonerNames[idx], [], async result => {
      const edited = CsInput.clone(csInputView);
      if (edited.ownerName == edited.summonerNames[idx]) {
        edited.ownerName = result;
      }
      edited.summonerNames[idx] = result;
      await this.currentCsManager.manualCsChange(edited);
    });
  }

  public editChampion(role: number) {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const roleToIdx =  this.roleToIdx(rolePredictionView);
    const blue = CsInput.getOwnerIdx(csInputView) < 5;
    const idx = roleToIdx[(role + (blue ? 0 : 5)) % 10];
    const currName = this.patchInfo.ChampionIdToName[csInputView.championIds[idx]] || "";
    Popup.text(TranslatedText.editChampion.english, TranslatedText.enterChampionName.english, currName, Object.values(this.patchInfo.ChampionIdToName), async result => {
      const picked = Object.keys(this.patchInfo.ChampionIdToName).filter(k => this.patchInfo.ChampionIdToName[k] == result);
      if (result.length > 0 && picked.length == 0) {
        Popup.message(TranslatedText.error.english, TranslatedText.championNotFound.english);
        return;
      }

      const edited = CsInput.clone(csInputView);
      edited.championIds[idx] = picked.length == 0 ? '' : picked[0];
      await this.currentCsManager.manualCsChange(edited);
    });
  }

  public editRegion() {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const currentRegion = (this.patchInfo.RegionIdToGg[csInputView.region] || '').toUpperCase();
    const regions = Object.values(this.patchInfo.RegionIdToGg).map(x => (<string>x).toUpperCase());
    Popup.text(TranslatedText.editRegion.english, TranslatedText.enterRegionInitials.english, currentRegion, regions, async result => {

      const picked = Object.keys(this.patchInfo.RegionIdToGg).filter(k => this.patchInfo.RegionIdToGg[k].toUpperCase() == result.toUpperCase());
      if (picked.length == 0) {
        Popup.message(TranslatedText.error.english, TranslatedText.regionNotFound.english);
        return;
      }

      const edited = CsInput.clone(csInputView);
      edited.region = picked[0];
      await this.currentCsManager.manualCsChange(edited);
    });
  }

  public async editSide(blue: boolean) {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const edited = CsInput.clone(csInputView);
    if (edited.ownerName == null || edited.ownerName == "" || !edited.summonerNames.includes(edited.ownerName)) {
      const availableNames = edited.summonerNames.filter(x => x && x.length > 0);
      if (availableNames.length == 0) {
        Popup.message(TranslatedText.error.english, TranslatedText.inputOneSummonerName.english);
        //Reverse click
        $('.cs-side-blue').prop("checked", !blue);
        $('.cs-side-red').prop("checked", blue);
        return;
      }
      edited.ownerName = availableNames[0];
    }
    const currBlue = CsInput.getOwnerIdx(csInputView) < 5;
    if (currBlue != blue) {
      
      edited.summonerNames = this.flipArray(edited.summonerNames);
      edited.championIds = this.flipArray(edited.championIds);
      edited.picking = this.flipArray(edited.picking);
      edited.summonerSpells = this.flipArray(edited.summonerSpells);
      edited.assignedRoles = this.flipArray(edited.assignedRoles);
      edited.roleSwaps = this.flipArray(edited.roleSwaps);
      edited.championSwaps = this.flipArray(edited.championSwaps);
    
      await this.currentCsManager.manualCsChange(edited);
    }
  }

  private flipArray(arr: any[]) {
    return [arr[5], arr[6], arr[7], arr[8], arr[9], arr[0], arr[1], arr[2], arr[3], arr[4]];
  }

  public async editQueue(soloQueue: boolean) {
    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = this.currentCsManager.getCsView();

    const edited = CsInput.clone(csInputView);
    edited.queueId = soloQueue ? '420' : '440';
    await this.currentCsManager.manualCsChange(edited);
  }


}