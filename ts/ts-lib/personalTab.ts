import * as $ from 'jquery'; //npm install --save-dev @types/jquery
import { MainWindow } from '../windows/mainWindow/mainWindow';
import { interestingFeatures, lcuClassId } from './consts';
import { CSCAI } from './cscai';
import { CsDataFetcher } from './csDataFetcher';
import { CsData, CsInput, CsManager } from './csManager';
import { CsTab } from './csTab';
import { ErrorReporting } from './errorReporting';
import { Lcu } from './lcu';
import { Popup } from './popup';
import { ProgressBar } from './progressBar';
import { Subscriptions } from './subscriptions';
import { TranslatedText } from './textLanguage';
import { Timer } from './timer';
import { Tutorial } from './tutorial';
import { Utils } from './utils';

export class PersonalTab {
  private static DATA_TIMEOUT_MS: number = 1000 * 60 * 5;
  private patchInfo: any;

  private riotID: string = '';
  private region: string = '';
  private data: CsData = null;
  private dataLoadedTimestamp: number = 0;
  private dataLoadedForRiotID: string = null;
  private dataLoadedForRegion: string = null;
  private dataLoadedForSoloQueue: boolean = false;
  private stats: any = null;
  private tier: any = {};

  private cscHistory: any = null;

  public ongoingProgressBar = new ProgressBar([], []);
  private updateInProgress: boolean = false;
  private updateQueue: any[] = [];

  //Settings
  private soloQueue: boolean = true;
  private sortByMostPlayed: boolean = true;
  private cscHistoryPreGame: boolean = false;

  //State
  private championRoleIndex: number = 0;
  private cscHistoryIndex: number = 0;

  constructor(patchInfo: any) {
    this.patchInfo = patchInfo;
    this.clearView(false);

    //Track LCU
    {
      const that = this; //Need this trick else this will be window inside the callbacks
      const setRequiredLCUFeatures = async () => {
        await Lcu.setRequiredFeatures(true, [interestingFeatures.game_flow, interestingFeatures.champ_select, interestingFeatures.lcu_info]);
        await this.delayedSync();
      };
      overwolf.games.launchers.onLaunched.removeListener(setRequiredLCUFeatures);
      overwolf.games.launchers.onLaunched.addListener(setRequiredLCUFeatures);
      overwolf.games.launchers.getRunningLaunchersInfo((info) => {
        if (Lcu.isLcuRunningFromInfo(info)) {
          setRequiredLCUFeatures();
        }
      });

      const handleLcuEvent = async (event: any) => await that.syncWithLCU();
      overwolf.games.launchers.onTerminated.removeListener(handleLcuEvent);
      overwolf.games.launchers.onTerminated.addListener(handleLcuEvent);
    }

    /* await */ this.init();
  }

  private async init() {
    const that = this;

    await Subscriptions.updateSubscriptionStatus(); //For the edit buttons

    $('.personal-champions-left-arrow').on('click', () => {
      that.scrollChampRole(-1);
    });
    $('.personal-champions-right-arrow').on('click', () => {
      that.scrollChampRole(1);
    });
    $('.personal-champions-options-sort-most-played').on('change', () => {
      that.setSortByMostPlayed(true);
    });
    $('.personal-champions-options-sort-score').on('change', () => {
      that.setSortByMostPlayed(false);
    });
    $('.personal-champions-options-performance-solo-queue').on('change', () => {
      that.setSoloQueue(true);
    });
    $('.personal-champions-options-performance-flex').on('change', () => {
      that.setSoloQueue(false);
    });

    $('.personal-history-left-arrow').on('click', () => {
      that.scrollCscHistory(-1);
    });
    $('.personal-history-right-arrow').on('click', () => {
      that.scrollCscHistory(1);
    });
    $('.personal-history-options-score-pre-game').on('change', () => {
      that.setCscHistoryPreGame(true);
    });
    $('.personal-history-options-score-in-game').on('change', () => {
      that.setCscHistoryPreGame(false);
    });

    const historyElems = $('.personal-history-table-container').get();
    for (const i in historyElems) {
      $(historyElems[i]).on('click', () => {
        that.showCscHistoryCs(parseInt(i));
      });
    }

    Utils.setCallbacksForEditButton(
      $('.personal-title-edit-button').get(0),
      async () => Subscriptions.allowEdits(),
      async () => await that.editSummonerAndRegion()
    );

    const syncElm = $('.personal-sync-button').get(0);
    $(syncElm).on('click', async () => {
      if (!(await that.syncWithLCU())) Popup.message(TranslatedText.error.english, TranslatedText.cscNotConnectingToLCU.english);
    });

    $('.personal-graph-canvas').on('mousemove', (e) => {
      that.mouseOverCanvas(e);
    });
    $('.personal-graph-canvas').on('mouseleave', () => {
      that.mouseLeaveCanvas();
    });
  }

  private async delayedSync() {
    await Timer.wait(1000); //Wait for the app to load to reduce lag as the CsTab may be selecting its first one
    await this.syncWithLCU();
  }

  private async syncWithLCU() {
    const curr = await Lcu.getCurrentRiotIDAndRegion();

    if (curr && curr.riotID) {
      $('.lcuStatusLightDisconnected').hide();
      $('.lcuStatusLightConnected').show();
      $('.s-lcu-status-text').removeClass('s-lcu-status-text-disconnected');
      // $('.s-lcu-status-text').removeClass('translated-text');
      // $('.s-lcu-status-text').off('DOMSubtreeModified'); //This is needed to remove the translation callback as well
      $('.s-lcu-status-text').html(curr.riotID);

      this.enqueueUpdate(async () => {
        const change = this.riotID != curr.riotID || this.region != curr.region;
        this.riotID = curr.riotID;
        this.region = curr.region;
        if (change) {
          await this.updateView();
          if (!(await Lcu.inChampionSelect())) {
            await MainWindow.showPersonalTab();
          }
        }
      });
      return true;
    } else {
      $('.lcuStatusLightDisconnected').show();
      $('.lcuStatusLightConnected').hide();
      $('.s-lcu-status-text').addClass('s-lcu-status-text-disconnected');
      return false;
    }
  }

  public readyToBeDisplayed() {
    return this.riotID.length > 0 && this.region.length > 0;
  }

  private clearView(keepResidual: boolean) {
    if (!keepResidual) {
      $('.personal-title-content').html('');

      $('.personal-champions-left-arrow').hide();
      $('.personal-champions-table-container').hide();
      $('.personal-champions-right-arrow').hide();

      $('.personal-champions-list-warning').hide();
      $('.personal-history-list-warning').hide();
      $('.personal-summary-warning').hide();

      $('.personal-summary-general').hide();
      $('.personal-summary-mains').hide();
      $('.personal-summary-primary').hide();
      $('.personal-summary-secondary').hide();

      $('.personal-history-left-arrow').hide();
      $('.personal-history-left-arrow-text').html('');
      $('.personal-history-right-arrow').hide();
      $('.personal-history-right-arrow-text').html('');

      $('.personal-history-table-container').hide();
      $($('.personal-history-stats-total').get(0)).html('0');
      $($('.personal-history-stats-total').get(1)).html('??');
      $($('.personal-history-stats-total').get(2)).html('??');
      $($('.personal-history-stats-total').get(3)).html('??');

      const clear = [null, null, null, null, null, null, null, null, null, null, null];
      const clearCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.canvasDraw(clear, clear, clear, clearCount, clearCount, clearCount);
    }

    $('.personal-champions-options-sort-most-played').prop('checked', this.sortByMostPlayed);
    $('.personal-champions-options-sort-score').prop('checked', !this.sortByMostPlayed);
    $('.personal-champions-options-performance-solo-queue').prop('checked', this.soloQueue);
    $('.personal-champions-options-performance-flex').prop('checked', !this.soloQueue);
    $('.personal-history-options-score-pre-game').prop('checked', this.cscHistoryPreGame);
    $('.personal-history-options-score-in-game').prop('checked', !this.cscHistoryPreGame);
  }

  private lockOptions() {
    $('.personal-champions-options-sort-most-played').attr('disabled', <any>true);
    $('.personal-champions-options-sort-score').attr('disabled', <any>true);
    $('.personal-champions-options-performance-solo-queue').attr('disabled', <any>true);
    $('.personal-champions-options-performance-flex').attr('disabled', <any>true);
    $('.personal-history-options-score-pre-game').attr('disabled', <any>true);
    $('.personal-history-options-score-in-game').attr('disabled', <any>true);
  }

  private unlockOptions() {
    $('.personal-champions-options-sort-most-played').attr('disabled', <any>false);
    $('.personal-champions-options-sort-score').attr('disabled', <any>false);
    $('.personal-champions-options-performance-solo-queue').attr('disabled', <any>false);
    $('.personal-champions-options-performance-flex').attr('disabled', <any>false);
    $('.personal-history-options-score-pre-game').attr('disabled', <any>false);
    $('.personal-history-options-score-in-game').attr('disabled', <any>false);
  }

  private enqueueUpdate(func: any) {
    this.updateQueue.push(func);
    /* await */ this.handleUpdateQueue();
  }

  private async handleUpdateQueue() {
    if (this.updateInProgress) {
      return;
    }
    try {
      this.updateInProgress = true;
      while (this.updateQueue.length > 0) {
        const currFunc = this.updateQueue.shift();
        await currFunc();
      }
    } finally {
      this.updateInProgress = false;
    }
  }

  public async updateView() {
    this.enqueueUpdate(async () => {
      if (this.riotID == null || this.region == null) {
        this.clearView(false);
        return;
      }
      const loadData = this.riotID != this.dataLoadedForRiotID || this.region != this.dataLoadedForRegion || this.soloQueue != this.dataLoadedForSoloQueue || new Date().getTime() - this.dataLoadedTimestamp > PersonalTab.DATA_TIMEOUT_MS;
      const keepResidual = this.riotID == this.dataLoadedForRiotID && this.region == this.dataLoadedForRegion;
      ErrorReporting.reportIfException(
        async () => {
          if (loadData) {
            this.tier = {};
            this.clearView(keepResidual);
            this.updateTitle();

            this.ongoingProgressBar = new ProgressBar(['loadPersonalData'], [1]);
            this.ongoingProgressBar.setActive();

            try {
              this.lockOptions();
              await this.loadData();
            } finally {
              this.unlockOptions();
            }

            this.ongoingProgressBar.taskCompleted();
            this.updateTitle();
          } else {
            this.ongoingProgressBar.setActive();
          }

          this.updateChampionRoleStats();
          this.updateAverageSoloScores();
          this.updateCSCHistoryStats();
          this.updateCSCHistoryHistogram();
        },
        'PersonalTab.updateView()',
        { summoner: this.riotID, region: this.region }
      );
    });
  }

  private updateTitle() {
    const riotIDString = this.riotID;
    const tierString = this.riotID == '' || !this.tier || !this.tier.tier || this.tier.tier == '' ? '' : Utils.capitalizeFirstLetter(this.tier.tier) + ' ' + this.tier.division + ' ' + this.tier.lp + ' LP ';
    const regionString = this.riotID == '' || !this.region || this.region == '' ? '' : this.patchInfo.RegionIdToGg[this.region].toUpperCase();
    $('.personal-title-content').html(this.riotID == '' ? '' : riotIDString + ' - ' + tierString + ' ' + regionString);
    $('.personal-graph-legend-personal .personal-graph-legend-text').html(this.riotID);

    if (this.riotID == '') {
      $('.personal-title-empty').show();
    } else {
      $('.personal-title-empty').hide();
    }
  }

  private async loadData() {
    this.data = await CsDataFetcher.getPersonalData(this.region, this.riotID, this.soloQueue);
    this.dataLoadedTimestamp = new Date().getTime();
    this.dataLoadedForRiotID = this.riotID;
    this.dataLoadedForRegion = this.region;
    this.dataLoadedForSoloQueue = this.soloQueue;
    this.stats = await CSCAI.analyzePersonalData(this.riotID, this.region, this.soloQueue, this.data);
    this.tier = CsTab.mergeTiers(this.data.lcuTiers, this.stats.apiTiers)[this.riotID] || {};

    const puuid = (this.data.summonerInfo[this.riotID] || {}).puuid;
    this.cscHistory = await CsDataFetcher.getCscHistoryData(this.region, puuid);
    if (this.cscHistory && this.cscHistory.personalHistory) {
      this.cscHistory.personalHistory = this.cscHistory.personalHistory.slice(-200);
    }
  }

  private updateChampionRoleStats() {
    let visibleGroupedStats = this.stats.groupedStats.sort((a, b) => (this.sortByMostPlayed && b.Amount != a.Amount ? b.Amount - a.Amount : b.SoloWr - a.SoloWr));
    visibleGroupedStats = visibleGroupedStats.filter((x) => x.Amount >= 3);

    const numChampRoleObjects = 4;
    this.championRoleIndex = Math.max(0, Math.min(this.championRoleIndex, visibleGroupedStats.length - numChampRoleObjects));
    if (this.championRoleIndex > 0) {
      $('.personal-champions-left-arrow').show();
    } else {
      $('.personal-champions-left-arrow').hide();
    }
    if (this.championRoleIndex < visibleGroupedStats.length - numChampRoleObjects) {
      $('.personal-champions-right-arrow').show();
    } else {
      $('.personal-champions-right-arrow').hide();
    }
    if (visibleGroupedStats.length == 0) {
      $('.personal-champions-list-warning').show();
    } else {
      $('.personal-champions-list-warning').hide();
    }

    const champRoleElems = $('.personal-champions-table-container').get();
    let showTutorial = false;
    for (let i = 0; i < numChampRoleObjects; ++i) {
      const elmn = $(champRoleElems[i]);
      if (visibleGroupedStats.length <= i) {
        elmn.hide();
        continue;
      }

      const stat = visibleGroupedStats[this.championRoleIndex + i];

      CsTab.setChampionImg(this.patchInfo, elmn.find('.personal-champions-champion-icon img'), stat.ChampionId);
      CsTab.setRoleImg($(elmn.find('.personal-champions-value img').get(0)), stat.Role, this.tier.tier, this.tier.division, this.tier.lp);

      CsTab.setSubScore(elmn.find('.personal-champions-solo-score-value'), stat.SoloWr - 0.5, true, false);

      elmn.find('.personal-champions-champion-name').html(this.patchInfo.ChampionIdToName[stat.ChampionId] || '');

      const daysAgo = Math.round((new Date().getTime() - new Date(stat.LastPlayed).getTime()) / (1000 * 60 * 60 * 24)).toString();
      elmn.find('.personal-champions-games .personal-champions-value').html(stat.Amount);
      elmn.find('.personal-champions-days .personal-champions-value').html(daysAgo);
      elmn.find('.personal-champions-wr .personal-champions-value').html(Math.round(100 * stat.WinRate) + '%');

      elmn.find('.stat-kda-kills').html((Math.round(stat.AvgKills * 10) / 10).toString());
      elmn.find('.stat-kda-deaths').html((Math.round(stat.AvgDeaths * 10) / 10).toString());
      elmn.find('.stat-kda-assists').html((Math.round(stat.AvgAssists * 10) / 10).toString());

      const totalAvgDmg = stat.AvgAdToChamps + stat.AvgApToChamps + stat.AvgTrueToChamps;
      elmn.find('.personal-champions-dmg-type-bar-ad').css('width', (100 * stat.AvgAdToChamps) / totalAvgDmg + '%');
      elmn.find('.personal-champions-dmg-type-bar-ap').css('width', (100 * stat.AvgApToChamps) / totalAvgDmg + '%');
      elmn.find('.personal-champions-dmg-type-bar-true').css('width', (100 * stat.AvgTrueToChamps) / totalAvgDmg + '%');

      const setBars = (selector, x, o, t, isPercentage) => {
        elmn.find(selector + ' .personal-champions-value').html(isPercentage ? (Math.round(x * 1000) / 10).toString() + '%' : (Math.round(x * 10) / 10).toString());
        const xo = Math.max(1, Math.round((100 * x) / Math.max(x, o)));
        const xt = Math.max(1, Math.round((100 * x) / Math.max(x, t)));
        elmn.find(selector + ' .personal-champions-bar-upper').css('width', xo + '%');
        elmn.find(selector + ' .personal-champions-bar-buffer').css('width', 'calc(' + (100 - xo) + '% - 0px)');
        elmn.find(selector + ' .personal-champions-bar-lower').css('width', xt + '%');
      };

      setBars('.personal-champions-kp', stat.AvgKillParticipation, stat.AvgKillParticipationOpponent, stat.AvgKillParticipationTeam, true);
      setBars('.personal-champions-damage', stat.AvgDmgToChamps, stat.AvgDmgToChampsOpponent, stat.AvgDmgToChampsTeam, false);
      setBars('.personal-champions-objectives', stat.AvgDmgToObj, stat.AvgDmgToObjOpponent, stat.AvgDmgToObjTeam, false);
      setBars('.personal-champions-cs', stat.AvgLaneCs + stat.AvgJungleCs, stat.AvgLaneCsOpponent + stat.AvgJungleCsOpponent, stat.AvgLaneCsTeam + stat.AvgJungleCsTeam, false);
      setBars('.personal-champions-gold', stat.AvgGold, stat.AvgGoldOpponent, stat.AvgGoldTeam, false);
      setBars('.personal-champions-cc', stat.AvgCC, stat.AvgCCOpponent, stat.AvgCCTeam, false);
      setBars('.personal-champions-vision', stat.AvgVisionScore, stat.AvgVisionScoreOpponent, stat.AvgVisionScoreTeam, false);

      elmn.show();
      showTutorial = true;
    }
    if (showTutorial) {
      //Need to wait until all are shown so it gets the right coords of the first card
      Tutorial.runShowingPersonalCard();
    }

    $('.personal-champions-options-sort-most-played').prop('checked', this.sortByMostPlayed);
    $('.personal-champions-options-sort-score').prop('checked', !this.sortByMostPlayed);
    $('.personal-champions-options-performance-solo-queue').prop('checked', this.soloQueue);
    $('.personal-champions-options-performance-flex').prop('checked', !this.soloQueue);
  }

  private updateAverageSoloScores() {
    const championPlayCount = {};
    const rolePlayCount = {};
    for (const g of this.stats.groupedStats) {
      if (!championPlayCount[g.ChampionId]) championPlayCount[g.ChampionId] = 0;
      championPlayCount[g.ChampionId] += g.Amount;

      if (!rolePlayCount[g.Role]) rolePlayCount[g.Role] = 0;
      rolePlayCount[g.Role] += g.Amount;
    }
    const mostPlayedChampions = Object.keys(championPlayCount)
      .filter((x) => championPlayCount[x] >= 3)
      .sort((a, b) => championPlayCount[b] - championPlayCount[a])
      .slice(0, 3);
    const mostPlayedRoles = Object.keys(rolePlayCount)
      .filter((x) => rolePlayCount[x] >= 3)
      .sort((a, b) => rolePlayCount[b] - rolePlayCount[a])
      .slice(0, 2);

    let totalSum = 0.0;
    let totalCount = 0.0;
    let mainsSum = 0.0;
    let mainsCount = 0.0;
    let primarySum = 0.0;
    let primaryCount = 0.0;
    let secondarySum = 0.0;
    let secondaryCount = 0.0;
    for (const g of this.stats.groupedStats) {
      totalSum += g.SoloWr * g.Amount;
      totalCount += g.Amount;

      if ((mostPlayedChampions[0] && g.ChampionId == mostPlayedChampions[0]) || (mostPlayedChampions[1] && g.ChampionId == mostPlayedChampions[1]) || (mostPlayedChampions[2] && g.ChampionId == mostPlayedChampions[2])) {
        mainsSum += g.SoloWr * g.Amount;
        mainsCount += g.Amount;
      }

      if (mostPlayedRoles[0] && g.Role == mostPlayedRoles[0]) {
        primarySum += g.SoloWr * g.Amount;
        primaryCount += g.Amount;
      }

      if (mostPlayedRoles[1] && g.Role == mostPlayedRoles[1]) {
        secondarySum += g.SoloWr * g.Amount;
        secondaryCount += g.Amount;
      }
    }

    if (totalCount > 0) {
      $('.personal-summary-general').show();
      CsTab.setSubScore($('.personal-summary-general .personal-summary-value'), totalSum / totalCount - 0.5, true, false);
      $('.personal-summary-warning').hide();
    } else {
      $('.personal-summary-warning').show();
      $('.personal-summary-general').hide();
    }

    if (mainsCount > 0) {
      $('.personal-summary-mains').show();
      const imgs = $('.personal-summary-mains img').get();
      const imgFrames = $('.personal-summary-champion-icon').get();
      CsTab.setSubScore($('.personal-summary-mains .personal-summary-value'), mainsSum / mainsCount - 0.5, true, false);
      for (let i = 0; i < 3; ++i) {
        if (mostPlayedChampions[i]) {
          CsTab.setChampionImg(this.patchInfo, $(imgs[i]), mostPlayedChampions[i]);
          $(imgFrames[i]).show();
        } else {
          $(imgFrames[i]).hide();
        }
      }
    } else {
      $('.personal-summary-mains').hide();
    }

    if (primaryCount > 0 && mostPlayedRoles[0]) {
      $('.personal-summary-primary').show();
      const imgs = $('.personal-summary-primary img').get();
      CsTab.setSubScore($('.personal-summary-primary .personal-summary-value'), primarySum / primaryCount - 0.5, true, false);
      CsTab.setRoleImg($(imgs[0]), parseInt(mostPlayedRoles[0]), this.tier.tier, this.tier.division, this.tier.lp);
    } else {
      $('.personal-summary-primary').hide();
    }

    if (secondaryCount > 0 && mostPlayedRoles[1]) {
      $('.personal-summary-secondary').show();
      const imgs = $('.personal-summary-secondary img').get();
      CsTab.setSubScore($('.personal-summary-secondary .personal-summary-value'), secondarySum / secondaryCount - 0.5, true, false);
      CsTab.setRoleImg($(imgs[0]), parseInt(mostPlayedRoles[1]), this.tier.tier, this.tier.division, this.tier.lp);
    } else {
      $('.personal-summary-secondary').hide();
    }
  }

  private updateCSCHistoryStats() {
    const numCscHistoryObjects = 10;
    const cscHistory = this.cscHistory.personalHistory || [];
    if (this.cscHistoryIndex > 0) {
      $('.personal-history-left-arrow').show();
      $('.personal-history-left-arrow-text').html('+' + this.cscHistoryIndex);
    } else {
      $('.personal-history-left-arrow').hide();
      $('.personal-history-left-arrow-text').html('');
    }
    if (this.cscHistoryIndex < cscHistory.length - numCscHistoryObjects) {
      $('.personal-history-right-arrow').show();
      $('.personal-history-right-arrow-text').html('+' + (cscHistory.length - numCscHistoryObjects - this.cscHistoryIndex));
    } else {
      $('.personal-history-right-arrow').hide();
      $('.personal-history-right-arrow-text').html('');
    }

    if (cscHistory.length == 0) {
      $('.personal-history-list-warning').show();
    } else {
      $('.personal-history-list-warning').hide();
    }

    $('.personal-history-options-score-pre-game').prop('checked', this.cscHistoryPreGame);
    $('.personal-history-options-score-in-game').prop('checked', !this.cscHistoryPreGame);

    let showTutorial = false;
    const personalHistoryElems = $('.personal-history-table-container').get();
    for (let i = 0; i < numCscHistoryObjects; ++i) {
      const elmn = $(personalHistoryElems[i]);
      if (cscHistory.length <= i) {
        elmn.hide();
        continue;
      }
      const hist = cscHistory[cscHistory.length - 1 - (this.cscHistoryIndex + i)];
      const data = JSON.parse(hist.data);
      const csInput = <CsInput>data.csInput;
      CsManager.repairOldCsInput(csInput);
      const idx = CsInput.getOwnerIdx(csInput);
      const swappedChamps = CsManager.applyChampionSwaps(csInput);
      const championId = swappedChamps[idx];
      const role = data.rolePrediction[idx];
      const pred = this.cscHistoryPreGame ? hist.partialPrediction : hist.fullPrediction;
      const date = new Date(hist.timestamp);
      const dateHtml = date.getMonth() + 1 + '/' + date.getDate() + '<br>' + date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');

      CsTab.setChampionImg(this.patchInfo, elmn.find('.personal-history-champion-icon img'), championId);
      CsTab.setRoleImg($(elmn.find('.personal-history-role-icon img').get(0)), role, this.tier.tier, this.tier.division, this.tier.lp);
      elmn.find('.personal-history-score').html(Utils.probabilityToScore(pred));
      elmn.find('.personal-history-date').html(dateHtml);
      elmn.removeClass('personal-history-table-container-' + (!hist.userWon ? 'win' : 'lose'));
      elmn.addClass('personal-history-table-container-' + (hist.userWon ? 'win' : 'lose'));
      elmn.show();
      showTutorial = true;
    }
    let hits = 0;
    for (let i = 0; i < cscHistory.length; ++i) {
      const hist = cscHistory[i];
      const pred = this.cscHistoryPreGame ? hist.partialPrediction : hist.fullPrediction;
      if ((pred > 0.5 && hist.userWon) || (pred < 0.5 && !hist.userWon)) {
        hits++;
      }
    }

    const cscHistogram = this.cscHistory.globalHistogram || [];
    let allHit = 0;
    let allCount = 0;
    let cscHit = 0;
    let cscCount = 0;
    for (const h of cscHistogram) {
      if (this.cscHistoryPreGame != h.isPartial) continue;

      const tp = h.wins.slice(10).reduce((partialSum, a) => partialSum + a, 0);
      const fp = h.wins.slice(0, 10).reduce((partialSum, a) => partialSum + a, 0);
      const fn = h.losses.slice(10).reduce((partialSum, a) => partialSum + a, 0);
      const tn = h.losses.slice(0, 10).reduce((partialSum, a) => partialSum + a, 0);
      if (h.isCSCuser) {
        cscHit += tp + tn;
        cscCount += tp + tn + fp + fn;
      } else {
        allHit += tp + tn;
        allCount += tp + tn + fp + fn;
      }
    }

    $($('.personal-history-stats-total-games').get(0)).html(cscHistory.length.toString());
    $($('.personal-history-stats-total-all').get(0)).html(allCount == 0 ? '??' : Math.round((100 * allHit) / allCount).toString());
    $($('.personal-history-stats-total-csc').get(0)).html(cscCount == 0 ? '??' : Math.round((100 * cscHit) / cscCount).toString());
    $($('.personal-history-stats-total-user').get(0)).html(cscHistory.length == 0 ? '??' : Math.round((100 * hits) / cscHistory.length).toString());

    if (showTutorial) Tutorial.runHistoryInPersonalTab();
  }

  private updateCSCHistoryHistogram() {
    const cscHistory = this.cscHistory.personalHistory || [];
    const cscHistogram = this.cscHistory.globalHistogram || [];

    const allWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const cscWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const allLosses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const cscLosses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const playerWins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const playerLosses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (const h of cscHistogram) {
      if (this.cscHistoryPreGame != h.isPartial) continue;
      const targetWins = h.isCSCuser ? cscWins : allWins;
      const targetLosses = h.isCSCuser ? cscLosses : allLosses;
      for (let i = 0; i < 20; ++i) {
        targetWins[Math.floor((i + 1) / 2)] += h.wins[i];
        targetLosses[Math.floor((i + 1) / 2)] += h.losses[i];
      }
    }

    for (const hist of cscHistory) {
      const pred = this.cscHistoryPreGame ? hist.partialPrediction : hist.fullPrediction;
      const targetI = Math.floor((pred + 0.05) / 0.1);
      if (hist.userWon) {
        playerWins[targetI]++;
      } else {
        playerLosses[targetI]++;
      }
    }

    const all = [null, null, null, null, null, null, null, null, null, null, null];
    const csc = [null, null, null, null, null, null, null, null, null, null, null];
    const player = [null, null, null, null, null, null, null, null, null, null, null];
    const allCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const cscCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const playerCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 11; ++i) {
      all[i] = allWins[i] + allLosses[i] > 100 ? allWins[i] / (allWins[i] + allLosses[i]) : null;
      allCount[i] += allWins[i] + allLosses[i];
      csc[i] = cscWins[i] + cscLosses[i] > 100 ? cscWins[i] / (cscWins[i] + cscLosses[i]) : null;
      cscCount[i] += cscWins[i] + cscLosses[i];
      player[i] = playerWins[i] + playerLosses[i] != 0 ? playerWins[i] / (playerWins[i] + playerLosses[i]) : null;
      playerCount[i] += playerWins[i] + playerLosses[i];
    }

    this.canvasDraw(all, csc, player, allCount, cscCount, playerCount);
  }

  private canvasDraw(all: number[], csc: number[], player: number[], allCount: number[], cscCount: number[], playerCount: number[]) {
    const canvas: any = $('.personal-graph-canvas').get()[0];
    canvas.width = 320;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#BE943A';
    const yellow = '#BE943A'; //Yellowish
    const white = '#DFDACB'; //White
    const blue = '#3B6284'; //Blue
    const red = '#755663'; //Red
    const whiteShadow = '#DFDACB55'; //White
    const blueShadow = '#3B628455'; //Blue
    const redShadow = '#75566355'; //Red
    const shadow = '#000000'; //Shadow
    // ctx.fillRect(0, 0, 150, 75);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    for (let sh = 0; sh < 2; ++sh) {
      const o = sh == 0 ? 2 : 0;
      ctx.strokeStyle = sh == 0 ? shadow : yellow;

      ctx.beginPath();
      ctx.moveTo(o + 10, o + 10);
      ctx.lineTo(o + 10, o + 210);
      ctx.lineTo(o + 310, o + 210);
      // ctx.closePath();
      ctx.stroke();
      for (let i = 1; i <= 9; ++i) {
        ctx.beginPath();
        ctx.moveTo(o + 10, o + 10 + 20 * i);
        ctx.lineTo(o + 3, o + 10 + 20 * i);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(o + 10 + 30 * i, o + 210);
        ctx.lineTo(o + 10 + 30 * i, o + 217);
        ctx.stroke();
      }
    }

    for (const arr of [allCount, cscCount, playerCount]) {
      const sum = arr.reduce((partialSum, a) => partialSum + a, 0);
      if (sum <= 0) continue;
      for (let i in arr) {
        arr[i] /= sum;
      }
    }

    for (let wh = 0; wh < 6; ++wh) {
      ctx.strokeStyle = wh == 0 ? whiteShadow : wh == 1 ? blueShadow : wh == 2 ? redShadow : wh == 3 ? white : wh == 4 ? blue : red;
      const data = wh == 0 ? allCount : wh == 1 ? cscCount : wh == 2 ? playerCount : wh == 3 ? all : wh == 4 ? csc : player;
      ctx.lineWidth = wh < 3 ? 3 : 4;

      for (let i = 1; i < 9; ++i) {
        var y0 = data[i];
        var y1 = data[i + 1];
        if (y0 != null && y1 != null) {
          ctx.beginPath();
          ctx.moveTo(10 + 30 * i, 210 - 200 * y0);
          ctx.lineTo(10 + 30 * (i + 1), 210 - 200 * y1);
          ctx.stroke();
        }
      }
    }

    // // the fill color
    // ctx.fill();
  }

  public setSortByMostPlayed(value: boolean) {
    this.enqueueUpdate(async () => {
      this.sortByMostPlayed = value;
      this.championRoleIndex = 0;
      await this.updateView();
    });
  }

  public setSoloQueue(value: boolean) {
    this.enqueueUpdate(async () => {
      this.soloQueue = value;
      this.championRoleIndex = 0;
      await this.updateView();
    });
  }

  public setCscHistoryPreGame(value: boolean) {
    this.enqueueUpdate(async () => {
      this.cscHistoryPreGame = value;
      await this.updateView();
    });
  }

  public scrollChampRole(value: number) {
    this.enqueueUpdate(async () => {
      this.championRoleIndex += value;
      await this.updateView();
    });
  }

  public scrollCscHistory(value: number) {
    this.enqueueUpdate(async () => {
      this.cscHistoryIndex += value;
      await this.updateView();
    });
  }

  public mouseOverCanvas(e: any) {
    var rect = e.target.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    const score = Math.max(0, Math.min(10, Math.round((100 * (x - 10)) / 300) / 10));
    const accuracy = Math.max(0, Math.min(100, Math.round((1000 * (210 - y)) / 200) / 10));
    $('.personal-graph-canvas-mouseover').html('(' + score.toString() + ', ' + accuracy.toString() + '%)');
  }

  public mouseLeaveCanvas() {
    $('.personal-graph-canvas-mouseover').html('');
  }

  public showCscHistoryCs(i: number) {
    const cscHistory = this.cscHistory.personalHistory || [];
    const hist = cscHistory[cscHistory.length - 1 - (this.cscHistoryIndex + i)];
    const data = JSON.parse(hist.data);
    MainWindow.showPersonalCS(data);
  }

  public async editSummonerAndRegion() {
    if (!Subscriptions.allowEdits()) return;

    Popup.text(TranslatedText.editPlayer.english, TranslatedText.enterPlayerRiotID.english, this.riotID || '', [], (riotID) => {
      if (riotID.length == 0 || riotID.search('<') != -1 || riotID.search('>') != -1) {
        Popup.message(TranslatedText.error.english, TranslatedText.badRiotID.english);
        return;
      }

      const currentRegion = (this.patchInfo.RegionIdToGg[this.region] || '').toUpperCase();
      const regions = Object.values(this.patchInfo.RegionIdToGg).map((x) => (<string>x).toUpperCase());
      Popup.text(TranslatedText.editRegion.english, TranslatedText.enterRegionInitials.english, currentRegion, regions, (rawRegion) => {
        const picked = Object.keys(this.patchInfo.RegionIdToGg).filter((k) => this.patchInfo.RegionIdToGg[k].toUpperCase() == rawRegion.toUpperCase());
        if (picked.length == 0) {
          Popup.message(TranslatedText.error.english, TranslatedText.regionNotFound.english);
          return;
        }

        this.enqueueUpdate(async () => {
          const change = this.riotID != riotID || this.region != picked[0];
          this.riotID = riotID;
          this.region = picked[0];
          if (change) {
            await this.updateView();
            if (!(await Lcu.inChampionSelect())) {
              MainWindow.showPersonalTab();
            }
          }
        });
      });
    });
  }
}
