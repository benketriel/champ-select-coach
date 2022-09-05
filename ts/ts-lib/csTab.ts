import { CsInput, CsManager } from "./csManager";
import { Logger } from "./logger";
import { Timer } from "./timer";
import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { MainWindow } from "../windows/mainWindow/mainWindow";
import { version } from "./consts";
import { Utils } from "./utils";
import { LocalStorage } from "./localStorage";


export class CsTab {
  private lcuCsManager: CsManager;
  private manualCsManager: CsManager;
  private history: any[] = [];
  private lcuManagerActive: boolean = false;
  private currHistoryIndex: number = -1;
  public hasBeenInCS: boolean = false;

  constructor(patchInfo: any) {
    //if mode matches then handle their callbacks and set view
    const that = this;
    const onNewCsLcu = () => that.onNewCsLcu();
    const onCsUpdateLcu = (change: string) => that.onCsUpdateLcu(change);
    const onNewCsManual = () => that.onNewCsManual();
    const onCsUpdateManual = (change: string) => that.onCsUpdateManual(change);
    this.lcuCsManager = new CsManager(patchInfo, true, onNewCsLcu, onCsUpdateLcu);
    this.manualCsManager = new CsManager(patchInfo, false, onNewCsManual, onCsUpdateManual);

    this.init();
  }

  private async init() {
    this.manualCsManager.ongoingProgressBar.setActive();
    this.history = await LocalStorage.getCsHistory();
    if (this.history.length > 0) {
      this.swapToManual(0);
    }

  }

  private onNewCsLcu() {
    this.onCsUpdateLcu('');
    MainWindow.selectCurrentCS();
  }

  private onCsUpdateLcu(change: string) {
    const { inputView, rolePrediction, lcuTiers, bans, score, missingScore, history, recommendations } = this.lcuCsManager.getCsView();

    const ownerIdx = CsInput.getOwnerIdx(inputView);
    const lcuTier = lcuTiers[inputView.summonerNames[ownerIdx]] || {};
    let fullScore = score['full'] ? score['full'][0][0] : 0.5;
    fullScore = ownerIdx < 5 ? fullScore : 1 - fullScore;
  
    this.updateCurrentCSMenu(inputView.championIds[ownerIdx], rolePrediction[ownerIdx], lcuTier.tier, lcuTier.division, lcuTier.lp, fullScore);

    if (this.lcuManagerActive) {
      this.updateView(change);
    }
  }

  private onNewCsManual() {
    this.onCsUpdateManual('');
  }

  private onCsUpdateManual(change: string) {
    if (this.currHistoryIndex != -1) {
      const { inputView, rolePrediction, lcuTiers, bans, score, missingScore, history, recommendations } = this.manualCsManager.getCsView();

      const ownerIdx = CsInput.getOwnerIdx(inputView);
      const lcuTier = lcuTiers[inputView.summonerNames[ownerIdx]] || {};
      let fullScore = score['full'] ? score['full'][0][0] : 0.5;
      fullScore = ownerIdx < 5 ? fullScore : 1 - fullScore;
    
      this.updateHistoryCSMenu(this.currHistoryIndex, inputView.championIds[ownerIdx], rolePrediction[ownerIdx], lcuTier.tier, lcuTier.division, lcuTier.lp, fullScore, null);
    }
    
    if (!this.lcuManagerActive) {
      this.updateView(change);
    }
  }

  public hide() {
    $('.cs-tab').hide();
  }

  public show() {
    $('.cs-tab').show();
  }

  public swapToLcu() {
    this.lcuManagerActive = true;
    this.lcuCsManager.ongoingProgressBar.setActive();
    this.updateView('');
  }

  public swapToManual(historyIndex: number) {
    this.lcuManagerActive = false;
    this.manualCsManager.ongoingProgressBar.setActive();
    this.manualCsManager.setCsView(this.history[historyIndex].csView, this.history[historyIndex].editable);
    this.currHistoryIndex = historyIndex;
    this.updateView('');
  }

  public swapToStatic(csView: any) {
    this.lcuManagerActive = false;
    this.manualCsManager.ongoingProgressBar.setActive();
    this.manualCsManager.setCsView(csView, false);
    this.currHistoryIndex = -1;
    this.updateView('');
  }

  public addManualCs() {
    const hist = {
      editable: true,
      date: null,
      csView: JSON.parse(JSON.stringify((this.lcuManagerActive ? this.lcuCsManager : this.manualCsManager).getCsView())),
    };
    this.history.unshift(hist);
    while (this.history.length > MainWindow.MAX_MENU_HISTORY_SIZE) {
      this.history.pop();
    }
    this.syncMenuWithHistory();
    LocalStorage.setCsHistory(this.history);
  }

  private updateCurrentCSMenu(championId: string, role: number, tier: string, division: string, lp: string, score: number) {
    const patchInfo = MainWindow.instance().patchInfo;

    CsTab.setChampionImg(patchInfo, $('.side-menu-current-cs .side-menu-champion img'), championId);
    CsTab.setRoleImg($('.side-menu-current-cs .side-menu-role img'), role, tier, division, lp);

    $('.side-menu-current-cs .side-menu-current-cs-score').html(Utils.probabilityToScore(score));

    $('.side-menu-current-cs .side-menu-waiting').hide();
    $('.side-menu-current-cs .side-menu-champion').show();
    $('.side-menu-current-cs .side-menu-role').show();
    $('.side-menu-current-cs .side-menu-current-cs-score').show();
    this.hasBeenInCS = true;
  }

  private updateHistoryCSMenu(index: number, championId: string, role: number, tier: string, division: string, lp: string, score: number, date: Date) {
    const patchInfo = MainWindow.instance().patchInfo;

    CsTab.setChampionImg(patchInfo, $($('.side-menu-champion-old img')[index]), championId);
    CsTab.setRoleImg($($('.side-menu-role-old img')[index]), role, tier, division, lp);

    $($('.side-menu-old-cs-score')[index]).html(Utils.probabilityToScore(score));

    const dateString = date == null ? '' : (date.getMonth()+1) + '/' + date.getDate() + '<br/>' + date.getHours() + ":" + date.getMinutes();
    $($('.side-menu-old-cs-date')[index]).html(dateString);

    $($('.side-menu-old-cs')[index]).show();
  }

  private removeHistoryCSMenu(index: number) {
    $($('.side-menu-old-cs')[index]).hide();
  }

  private syncMenuWithHistory() {
    for (let i = 0; i < MainWindow.MAX_MENU_HISTORY_SIZE; ++i) {
      if (i >= this.history.length) {
        this.removeHistoryCSMenu(i);
        continue;
      }
      const h = this.history[i];
      const csInput: CsInput = h.csView.inputView;
      const ownerIdx = CsInput.getOwnerIdx(csInput);
      const lcuTier = h.csView.lcuTiers[csInput.summonerNames[ownerIdx]] || {};
      let score = ((h.csView.score || {})['full'] || 0.5);
      score = ownerIdx < 5 ? score : 1 - score;

      this.updateHistoryCSMenu(i, csInput.championIds[ownerIdx], h.csView.rolePrediction[ownerIdx], lcuTier.tier, lcuTier.division, lcuTier.lp, score, h.date);
    }
  }

  private static setChampionImg(patchInfo: any, element: any, championId: string) {
    const championName = patchInfo.ChampionIdToName[championId] || "";
    const currName = element.attr('title');
    if (currName == championName) return;
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

  private static setRoleImg(element: any, role: number, tier: string, division: string, lp: string) {
    tier = tier || '';
    division = division || '';
    lp = lp || '';
    const grayscale = tier == '';
    const tierFile = tier == "platinum" ? 'plat' : tier == '' ? 'plat' : tier; // Because plat looks the best in grayscale

    const posFileNames = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];
    element.attr('src', '/img/ranked-positions/Position_' + tierFile + '-' + posFileNames[role] + '.png');
    element.parent().attr('title', (tier == '' ? '' : Utils.capitalizeFirstLetter(tier) + ' ' + division + ' ' + lp + ' LP ') + posFileNames[role]);
    element.css('filter', grayscale ? 'grayscale(100%)' : '');
    element.off('load');
    element.on('load', function() { element.show(); });

  }

  private updateView(change: string) {
    //Updates the html view, change is for optimization, if empty reset everything
    const { inputView, rolePrediction, lcuTiers, bans, score, missingScore, history, recommendations } = (this.lcuManagerActive ? this.lcuCsManager : this.manualCsManager).getCsView();

    //inputView and rolePrediction are assumed to always be there
    const ownerIdx = CsInput.getOwnerIdx(inputView);
    const side = Math.floor(ownerIdx/5);
    const patchInfo = MainWindow.instance().patchInfo;

    if (!change || change == 'instant') {
      this.dimAllScores();
      this.updateDistributionLegend(patchInfo, side, inputView.championIds, rolePrediction);
      this.updateRegionAndWarnings(patchInfo, inputView, history);
      this.updateSwaps(patchInfo, side, inputView, rolePrediction, lcuTiers);
      this.updateSummonersAndRoles(patchInfo, side, inputView, rolePrediction, lcuTiers);
    } else if (!change || change == 'clearData') {
    } else if (!change || change == 'data') {
    } else if (!change || change == 'score') {
      if (score.partial) {
        this.updateScore(score.full[0][side], score.partial[side][0][side], score.partial[1 - side][0][1 - side]);
      } else {
        this.updateScore(score.full[0][Math.floor(ownerIdx/5)], -1, -1);
      }
      this.updateObjectives(side, score.full);
      this.updateDistributions(side, score.full);
      this.updateRoleScores(side, score.full);
    } else if (!change || change == 'missing') {
      this.updateTeamScores(side, inputView, rolePrediction, score.full[0], missingScore);
    } else if (!change || change == 'picks' + 0) {


    } else {
      Logger.warn('updateView() - Unknown change: ' + change);
    }

    MainWindow.instance().repositionOverflowingPopups();
  }

  private updateScore(wr: number, wrLeft: number, wrRight: number) {
    if (isNaN(wr)) return;
    const showSideScores = !isNaN(wrLeft) && !isNaN(wrRight) && wrLeft != -1 && wrRight != -1;

    $('.cs-wr-total').addClass('tooltip');
    if (showSideScores) {
      $('.cs-wr-total-left').addClass('tooltip');
      $('.cs-wr-total-right').addClass('tooltip');
    }

    $('.cs-wr-total-tooltip').html(showSideScores ? 'Combined score' : 'Total score');

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
    Utils.smoothChangeNumber($('.cs-wr-total-result').get(0), wr * 10);
    if (showSideScores) {
      $('.cs-wr-total-left-result').css('opacity', '1.0');
      $('.cs-wr-total-right-result').css('opacity', '1.0');
      Utils.smoothChangeNumber($('.cs-wr-total-left-result').get(0), wrLeft * 10);
      Utils.smoothChangeNumber($('.cs-wr-total-right-result').get(0), wrRight * 10);
    } else {
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

  private IOUT_TIME = 11;
  private IOUT_OBJECTIVES = 12;
  private updateObjectives(side:number, scores: number[][]) {
    const oArr = scores[this.IOUT_OBJECTIVES];
    const tArr = scores[this.IOUT_TIME]; //(0-10, -15, -20, -25, -30, -35, 35+)
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

  private IOUT_FIRST_BLOOD = 13;
  private IOUT_DMG_TOTAL_BLUE = 110;
  private IOUT_DMG_TOTAL_RED = 111;
  private IOUT_TURRET_DAMAGE_BLUE = 96;
  private IOUT_TURRET_DAMAGE_RED = 97;
  private IOUT_GOLD_BLUE = 100;
  private IOUT_GOLD_RED = 101;
  private IOUT_KP_BLUE = 15;
  private IOUT_KP_RED = 16;
  private updateDistributions(side:number, scores: number[][]) {
    const fbArr = scores[this.IOUT_FIRST_BLOOD];
    const teamFbArr = fbArr.slice(side * 5, side * 5 + 5);
    const enemyFbArr = fbArr.slice((1 - side) * 5, (1 - side) * 5 + 5);
    const fbNorm = Math.max(
      teamFbArr[0] + teamFbArr[1] + teamFbArr[2] + teamFbArr[3] + teamFbArr[4], 
      enemyFbArr[0] + enemyFbArr[1] + enemyFbArr[2] + enemyFbArr[3] + enemyFbArr[4]
    );

    const teamDmgArr = scores[side == 0 ? this.IOUT_DMG_TOTAL_BLUE : this.IOUT_DMG_TOTAL_RED];
    const enemyDmgArr = scores[side == 1 ? this.IOUT_DMG_TOTAL_BLUE : this.IOUT_DMG_TOTAL_RED];

    const teamTurretDmgArr = scores[side == 0 ? this.IOUT_TURRET_DAMAGE_BLUE : this.IOUT_TURRET_DAMAGE_RED];
    const enemyTurretDmgArr = scores[side == 1 ? this.IOUT_TURRET_DAMAGE_BLUE : this.IOUT_TURRET_DAMAGE_RED];

    const teamGoldArr = scores[side == 0 ? this.IOUT_GOLD_BLUE : this.IOUT_GOLD_RED];
    const enemyGoldArr = scores[side == 1 ? this.IOUT_GOLD_BLUE : this.IOUT_GOLD_RED];

    const teamKpArr = scores[side == 0 ? this.IOUT_KP_BLUE : this.IOUT_KP_RED];
    const enemyKpArr = scores[side == 1 ? this.IOUT_KP_BLUE : this.IOUT_KP_RED];

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
    $(elem).animate({ width: w }, 400);
    $(elem).attr('title', w);
  }

  private IOUT_ROLE_EARLY_XP = 19; //+3
  private IOUT_ROLE_XP = 20; //+3
  private IOUT_ROLE_GOLD = 21; //+3
  private updateRoleScores(side: number, scores: number[][]) {
    const prioElems = $('.cs-table-prio-p').get();
    const winnerElems = $('.cs-table-lane-winner-p').get();
    
    for (let i = 0; i < 5; ++i) {
      const earlyXp = scores[this.IOUT_ROLE_EARLY_XP + i * 3][side];
      const xp = scores[this.IOUT_ROLE_XP + i * 3][side];
      const gold = scores[this.IOUT_ROLE_GOLD + i * 3][side];
      this.setSubScore($(prioElems[i]), earlyXp - 0.5);
      this.setSubScore($(winnerElems[i]), (xp + gold) / 2 - 0.5);
    }

    //Solo scores
    const elems = $('.cs-table-individuals-p').get();
    for (let i = 0; i < 5; ++i) {
      this.setSubScore($(elems[4 * i + side]), scores[1 + i][0] - 0.5);
      this.setSubScore($(elems[4 * i + 1 - side]), scores[1 + 5 + i][0] - 0.5);
    }
  }

  private setSubScore(elem: any, score: number) {
    const signedScore = (Math.round(score * 100) >= 0 ? "+" : "") + (Math.round(score * 100) / 10).toFixed(1);

    elem.html(signedScore);

    elem.removeClass('text-success');
    elem.removeClass('text-danger');
    elem.removeClass('text-little-success');
    elem.removeClass('text-little-danger');
    if (Math.abs(score) >= 0.05) {
      if (score > 0) {
        elem.addClass('text-success');
      } else if (score < 0) {
        elem.addClass('text-danger');
      }
    } else if (Math.abs(score) >= 0.02) {
      if (score > 0) {
        elem.addClass('text-little-success');
      } else if (score < 0) {
        elem.addClass('text-little-danger');
      }
    }

    elem.stop();
    elem.css('opacity', 0.1);
    elem.animate({ opacity: 1.0 }, 400);
  }

  private updateRegionAndWarnings(patchInfo: any, inputView: CsInput, history: any) {
    $('.cs-region').html(patchInfo.RegionIdToGg[inputView.region].toUpperCase());
    let warn = false;

    if (inputView.queueId in patchInfo.RankedQueueTypeIds) {
      $('.cs-warning-unranked').hide();
    } else {
      $('.cs-warning-unranked').show();
      warn = true;
    }
    if (inputView.summonerNames.filter(name => name != '' && (!(name in history) || history[name].length == 0)).length == 0) {
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

  private updateSwaps(patchInfo: any, side: number, inputView: CsInput, rolePrediction: number[], lcuTiers: any) {
    const roleToIdx = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    for (let i = 0; i < 10; i++) {
      roleToIdx[Math.floor(i / 5) * 5 + rolePrediction[i]] = i;
    }

    const swapElems = $('.cs-table-champion-swap-options').get();
    for (let role = 0; role < 5; ++role) {
      const idx0 = roleToIdx[role];
      const idx1 = roleToIdx[5 + role];
      const lcuTier0 = lcuTiers[inputView.summonerNames[idx0]] || {};
      const lcuTier1 = lcuTiers[inputView.summonerNames[idx1]] || {};
      const e0 = swapElems[2 * role + side];
      const e1 = swapElems[2 * role + 1 - side];
      let z = 0;

      const rImgElems0 = $(e0).find('.cs-table-champion-swap-role img').get();
      const rImgElems1 = $(e1).find('.cs-table-champion-swap-role img').get();
      const cImgElems0 = $(e0).find('.cs-table-champion-swap-champion img').get();
      const cImgElems1 = $(e1).find('.cs-table-champion-swap-champion img').get();
      for (let otherRole = 0; otherRole < 5; ++otherRole) {
        if (otherRole == role) continue;

        CsTab.setRoleImg($(rImgElems0[z]), otherRole, lcuTier0.tier, lcuTier0.division, lcuTier0.lp)
        CsTab.setRoleImg($(rImgElems1[z]), otherRole, lcuTier1.tier, lcuTier1.division, lcuTier1.lp)

        const cId0 = inputView.championIds[roleToIdx[otherRole]];
        CsTab.setChampionImg(patchInfo, $(cImgElems0[z]), cId0);
        const cId1 = inputView.championIds[roleToIdx[5 + otherRole]];
        CsTab.setChampionImg(patchInfo, $(cImgElems1[z]), cId1);

        z++;
      }
  
    }
  }

  private updateSummonersAndRoles(patchInfo: any, side: number, inputView: CsInput, rolePrediction: number[], lcuTiers: any) {
    const championsImgs = $('.cs-table').find('.cs-table-champion-icon-cell .cs-table-champion-icon img').get();
    const championNames = $('.cs-table').find('.cs-table-champion-name-cell .cs-table-cell').get();
    const summonerNames = $('.cs-table').find('.cs-table-summoner-name-cell .cs-table-cell').get();
    const roleIcons = $('.cs-table').find('.role-icon img').get();
    const roleTooltips = $('.cs-table').find('.role-icon .translated-text').get();
    const roleNames = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];
    for (let i = 0; i < 5; ++i) {
      const role0 = rolePrediction[i];
      const role1 = rolePrediction[5 + i];
      CsTab.setChampionImg(patchInfo, $(championsImgs[2 * role0 + side]), inputView.championIds[i])
      CsTab.setChampionImg(patchInfo, $(championsImgs[2 * role1 + 1 - side]), inputView.championIds[5 + i])

      const cName0 = patchInfo.ChampionIdToName[inputView.championIds[i]] || "";
      const cName1 = patchInfo.ChampionIdToName[inputView.championIds[5 + i]] || "";
      championNames[2 * role0 + side].innerHTML = cName0;
      championNames[2 * role1 + 1 - side].innerHTML = cName1;

      summonerNames[2 * role0 + side].innerHTML = inputView.summonerNames[i];
      summonerNames[2 * role1 + 1 - side].innerHTML = inputView.summonerNames[5 + i];

      const teamRole = rolePrediction[i + 5 * side];
      const lcuTier = lcuTiers[inputView.summonerNames[i + 5 * side]] || {};
      CsTab.setRoleImg($(roleIcons[teamRole]), teamRole, lcuTier.tier, lcuTier.division, lcuTier.lp);
      roleTooltips[teamRole].innerHTML = roleNames[teamRole];
    }
  }

  private updateTeamScores(side: number, inputView: CsInput, rolePrediction: number[], fullScore: number[], missingScore: any) {
    const elems = $('.cs-table-individuals-p').get();
    for (let i = 0; i < 5; ++i) {
      const nameBlue = inputView.summonerNames[i];
      const nameRed = inputView.summonerNames[5 + i];
      this.setSubScore($(elems[4 * rolePrediction[i] + side + 2]), nameBlue != '' && nameBlue in missingScore ? fullScore[0] - missingScore[nameBlue][0] : 0.0);
      this.setSubScore($(elems[4 * rolePrediction[5 + i] + 1 - side + 2]), nameRed != '' && nameRed in missingScore ? fullScore[1] - missingScore[nameRed][1] : 0.0);
    }
  }

  private updatePicks(i: number) {
    //TODO
  }

  private dimAllScores() {
    $('.cs-wr-total-result').css('opacity', '0.6');
    $('.cs-wr-total-left-result').css('opacity', '0.6');
    $('.cs-wr-total-right-result').css('opacity', '0.6');
    $('.cs-objective-cell-value').css('opacity', '0.6');
    $('.cs-objective-timer-cell-value').css('opacity', '0.6');
    $('.cs-table-individuals-p').css('opacity', '0.6');
    $('.cs-table-prio-p').css('opacity', '0.6');
    $('.cs-table-lane-winner-p').css('opacity', '0.6');

  }


}