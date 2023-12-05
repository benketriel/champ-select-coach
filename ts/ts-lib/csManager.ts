import { interestingFeatures, lcuClassId, lolClassId } from './consts';
import { CsDataFetcher } from './csDataFetcher';
import { ProgressBar } from './progressBar';
import { Lcu } from './lcu';
import { Utils } from './utils';
import { CSCAI } from './cscai';
import { Timer } from './timer';
import { CscApi } from './cscApi';
import { ErrorReporting } from './errorReporting';
import { Logger } from './logger';
import { CsTab } from './csTab';
import { LocalStorage } from './localStorage';
import { MainWindow } from '../windows/mainWindow/mainWindow';

export class CsInput {
  //Trigger onNewCs (except if manual), and require loading CsData
  public region = '';
  public queueId = '';
  public ownerRiotID = null;
  public riotIDs: string[] = ['', '', '', '', '', '', '', '', '', '']; //Order here is arbitrary (and will be invisible on the UI since they are later sorted by roles)
  public hiddenSummoners: boolean[] = [false, false, false, false, false, false, false, false, false, false];
  public chatRiotIDs: string[] = [];

  //Trigger onCsUpdate
  public championIds = ['', '', '', '', '', '', '', '', '', ''];
  public picking = [false, false, false, false, false, false, false, false, false, false];
  public summonerSpells = [
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
  ];
  // public assignedRoles: any[] = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]; //Pros: when making an empty manual lobby, they don't jump around as you pick champs
  public assignedRoles: any[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]; //Pros: when opening CSC from ongoing game, the spectator will arrange according to champs guessing

  public roleSwaps = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  public championSwaps: string[] = [null, null, null, null, null, null, null, null, null, null];

  public static triggersLoadCsData(oldCsInput: CsInput, newCsInput: CsInput) {
    return (
      oldCsInput.queueId != newCsInput.queueId ||
      oldCsInput.region != newCsInput.region ||
      oldCsInput.ownerRiotID != newCsInput.ownerRiotID ||
      !Utils.setsAreEqual(new Set(oldCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)), new Set(newCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0))) ||
      !Utils.setsAreEqual(new Set(oldCsInput.chatRiotIDs), new Set(newCsInput.chatRiotIDs))
    );
  }

  public static triggersNewCs(oldCsInput: CsInput, newCsInput: CsInput) {
    return (
      oldCsInput.queueId != newCsInput.queueId ||
      oldCsInput.region != newCsInput.region ||
      oldCsInput.ownerRiotID != newCsInput.ownerRiotID ||
      !Utils.setIncludes(new Set(newCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)), new Set(oldCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)))
    );
  }

  public static anyChangeInSummoners(oldCsInput: CsInput, newCsInput: CsInput) {
    return !Utils.setsAreEqual(new Set(newCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)), new Set(oldCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)));
  }

  public static anyVisibleChange(oldCsInput: CsInput, newCsInput: CsInput) {
    return JSON.stringify(oldCsInput) != JSON.stringify(newCsInput);
  }

  public static isOlderVersionOfTheSameCS(oldCsInput: CsInput, newCsInput: CsInput) {
    return (
      oldCsInput &&
      newCsInput &&
      oldCsInput.queueId == newCsInput.queueId &&
      oldCsInput.region == newCsInput.region &&
      oldCsInput.ownerRiotID == newCsInput.ownerRiotID &&
      oldCsInput.championIds.filter((x) => x != null && x != '' && x != '0').length == 10 &&
      newCsInput.championIds.filter((x) => x != null && x != '' && x != '0').length == 10 &&
      oldCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0).length == 10 &&
      newCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0).length <= 5 && //also less than 5 because riotIDs are hidden in solo, and because there could be a bug someone is missing?
      Utils.setIncludes(new Set(oldCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)), new Set(newCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0))) &&
      new Set(oldCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)).size > new Set(newCsInput.riotIDs.filter((riotID) => riotID && riotID.length > 0)).size
    );
  }

  public static readyToBeUploaded(csInput: CsInput) {
    //Returns true for both pre-game and in-game
    return (
      (csInput.queueId == '420' || csInput.queueId == '410' || csInput.queueId == '440') &&
      csInput.region != '' &&
      csInput.riotIDs.filter((x) => x == null || x == '').length <= 5 &&
      csInput.championIds.filter((x) => x == null || x == '' || x == '0').length == 0 &&
      csInput.picking.filter((x) => x == true).length == 0
    );
  }

  public static shouldComputeBans(csInput: CsInput) {
    return false; //Until we figure out a faster way to do this
    return csInput.championIds.slice(0, 5).filter((x) => x != null && x != '').length == 0 || csInput.championIds.slice(5, 10).filter((x) => x != null && x != '').length == 0;
  }

  public static isTeamPartial(csInput: CsInput) {
    return csInput.riotIDs.slice(0, 5).filter((x) => x != null && x != '').length == 0 || csInput.riotIDs.slice(5, 10).filter((x) => x != null && x != '').length == 0;
  }

  public static individualScoresNeedUpdate(oldCsInput: CsInput, newCsInput: CsInput) {
    const loadData = this.triggersLoadCsData(oldCsInput, newCsInput);
    const draftChanged =
      !Utils.arraysEqual(oldCsInput.championIds, newCsInput.championIds) ||
      JSON.stringify(oldCsInput.summonerSpells) != JSON.stringify(newCsInput.summonerSpells) ||
      !Utils.arraysEqual(oldCsInput.assignedRoles, newCsInput.assignedRoles) ||
      !Utils.arraysEqual(oldCsInput.roleSwaps, newCsInput.roleSwaps) ||
      !Utils.arraysEqual(oldCsInput.championSwaps, newCsInput.championSwaps) ||
      oldCsInput.ownerRiotID != newCsInput.ownerRiotID;

    return loadData || draftChanged;
  }

  public static getOwnerIdx(csInput: CsInput) {
    const ownerIdx = csInput.riotIDs.indexOf(csInput.ownerRiotID);
    if (ownerIdx == -1) {
      return 0;
    }
    return ownerIdx;
  }

  public static clone(csInput: CsInput): CsInput {
    return JSON.parse(JSON.stringify(csInput)); //Could be optimizer later
  }
}

export class CsData {
  //Key on all is the riotID only (no region)
  public summonerInfo = {};
  public histories = {};
  public masteries = {};
  public tiers = {};
  public lcuTiers = {}; //These are preferred to be displayed but may not be used to the AI
  public matches = {};
}

export class SpectatorData {
  public queueId = '';
  public summonerIds = [];
  public championIds = [];
  public summonerSpells = [];
}

export class LcuLiveGameData {
  public queueId = '';
  public riotIDs = [];
  public championIds = [];
  public summonerSpells = [];
}

export class CsManager {
  private static cscaiOwner: CsManager = null;
  private static cscaiBeingUsed: boolean = false;
  private csTab: CsTab;
  private connectedToLcu: boolean = false;
  private csInProgress: boolean = false;
  private swappableCs: boolean = false;
  private editableCs: boolean = false;
  private date: number = null;

  private currCsInput = new CsInput();
  private currCsData = new CsData();

  private currCsInputView = new CsInput();
  private currCsRolePredictionView = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
  private currCsRolePrediction = null;
  private currGuessedRiotIDs = null;
  private currCsApiTiers = null;
  private currCsBans = null;
  private currCsScore = null;
  private currCsMissingScores = null;
  private currCsHistory = null;
  private currCsHistoryStats = null;
  private currCsRecommendations = null;
  public currCsFirstRunComplete = false;

  private latestCsInput: CsInput = null;
  private ongoingCsViewChange = false;
  private pendingCsViewChange = false;

  private ongoingCsChange = false;
  private pendingCsChange = false;

  public ongoingProgressBar = new ProgressBar([], []);
  public ongoingUpdaters: number = 0;

  constructor(csTab: CsTab, connectedToLcu: boolean, csView: any, swappable: boolean, editable: boolean) {
    this.csTab = csTab;
    this.connectedToLcu = connectedToLcu;

    if (this.connectedToLcu) {
      //Set required features when LCU starts
      const setRequiredLCUFeatures = async () => {
        await Lcu.setRequiredFeatures(true, [interestingFeatures.game_flow, interestingFeatures.champ_select, interestingFeatures.lcu_info]);
      };
      overwolf.games.launchers.onLaunched.removeListener(setRequiredLCUFeatures);
      overwolf.games.launchers.onLaunched.addListener(setRequiredLCUFeatures);
      overwolf.games.launchers.getRunningLaunchersInfo((info) => {
        if (Lcu.isLcuRunningFromInfo(info)) {
          setRequiredLCUFeatures();
        }
      });

      const setRequiredLolFeatures = async () => {
        await Lcu.setRequiredFeatures(false, [interestingFeatures.teams]);
      };
      overwolf.games.onGameLaunched.removeListener(setRequiredLolFeatures);
      overwolf.games.onGameLaunched.addListener(setRequiredLolFeatures);
      overwolf.games.getRunningGameInfo((info) => {
        if (Lcu.isLolRunningFromInfo(info)) {
          setRequiredLolFeatures();
        }
      });

      //Listen for champion select
      const that = this; //Need this trick else this will be window inside the callbacks
      const handleLcuEvent = (event: any) => /* await */ that.handleLcuEvent(event);
      overwolf.games.launchers.events.onInfoUpdates.removeListener(handleLcuEvent);
      overwolf.games.launchers.events.onInfoUpdates.addListener(handleLcuEvent);
      overwolf.games.launchers.events.onNewEvents.removeListener(handleLcuEvent);
      overwolf.games.launchers.events.onNewEvents.addListener(handleLcuEvent);

      /* await */ this.handleLcuEvent(null); //Check if currently in champion select
      /* await */ CsManager.pollForSpectator(this, 1000, 10000);
    }

    this.swappableCs = swappable;
    this.editableCs = editable;
    this.init(csView);

    /* await */ this.debug();
  }

  private static debugDone = false;
  private async debug() {}

  public static repairOldCsInput(csInput: CsInput) {
    if (!csInput.ownerRiotID && csInput['ownerName']) {
      csInput.ownerRiotID = csInput['ownerName'];
    }

    if (!csInput.riotIDs && csInput['summonerNames']) {
      csInput.riotIDs = csInput['summonerNames'];
    }

    if (!csInput.chatRiotIDs && csInput['chatSummonerNames']) {
      csInput.chatRiotIDs = csInput['chatSummonerNames'];
    }
  }

  private init(csView: any) {
    if (!csView) return;

    const { csInputView, rolePredictionView, csInput, rolePrediction, guessedRiotIDs, apiTiers, lcuTiers, summonerInfo, bans, score, missingScore, history, historyStats, recommendations, swappable, editable, date } = csView;
    CsManager.repairOldCsInput(csInput);

    this.currCsInputView = csInput;
    this.currCsRolePredictionView = rolePrediction;
    this.currCsInput = csInput;
    this.currCsRolePrediction = rolePrediction;
    this.currCsApiTiers = apiTiers;
    this.currCsData = new CsData();
    this.currCsData.lcuTiers = lcuTiers;
    this.currCsData.summonerInfo = summonerInfo;
    this.currCsBans = bans;
    this.currCsScore = score;
    this.currCsMissingScores = missingScore;
    this.currCsHistory = history;
    this.currCsHistoryStats = historyStats;
    this.currCsRecommendations = recommendations;
    this.date = date;
  }

  public async manualCsChange(newCsInput: CsInput) {
    if (!this.editableCs && !this.swappableCs) return;
    await ((await this.update(newCsInput)) || {})[0];
  }

  private async handleLcuEvent(info: any) {
    const newCsInput = await Lcu.getCsInput(this.currCsInputView, info, this.csInProgress);
    if (newCsInput == null) {
      this.csInProgress = false;
      return;
    }
    this.csInProgress = true;

    await ((await this.update(newCsInput)) || {})[0];
    await this.handleGameStarting(info);
  }

  public async refresh() {
    return await this.update(this.currCsInputView);
  }

  //Main function of CsManager
  private async update(newCsInput: CsInput) {
    if (!CsInput.anyVisibleChange(this.latestCsInput, newCsInput)) {
      return [() => {}];
    }
    if (CsInput.isOlderVersionOfTheSameCS(this.latestCsInput, newCsInput)) {
      //Ignore, these messages can come out of order between CS and spectator and we don't want it to think it's a new CS all of the sudden
      return [() => {}];
    }

    Logger.debug(newCsInput);

    this.latestCsInput = newCsInput;
    return await ErrorReporting.reportIfException(
      async () => {
        await this.updateView();
        const result = [/* await */ this.updateRest()];
        return result;
      },
      'CsManager.update()',
      { newCsInput, csView: this.getCsView() }
    );
  }

  private async updateView() {
    this.pendingCsViewChange = true;
    if (this.ongoingCsViewChange) {
      return false;
    }
    try {
      this.ongoingUpdaters++;
      this.ongoingCsViewChange = true;
      while (this.pendingCsViewChange) {
        this.pendingCsViewChange = false;

        const newCsInput = this.latestCsInput;
        const newSwappedChamps = CsManager.applyChampionSwaps(newCsInput);
        const newRolePred = await CSCAI.getRolePredictions(newCsInput, newSwappedChamps);

        this.currCsInputView = newCsInput;
        this.currCsRolePredictionView = newRolePred;
        await this.csTab.onCsUpdate(this, 'instant');
      }
    } finally {
      this.ongoingCsViewChange = false;
      this.ongoingUpdaters--;
    }
    return true;
  }

  private async updateRest() {
    this.pendingCsChange = true;
    if (this.ongoingCsChange) {
      return;
    }
    try {
      this.ongoingUpdaters++;
      this.ongoingCsChange = true;
      while (this.pendingCsChange) {
        this.pendingCsChange = false;

        const newCsInput = this.currCsInputView;
        const newRolePred = this.currCsRolePredictionView;
        const newSwappedChamps = CsManager.applyChampionSwaps(newCsInput);

        const newCs = CsInput.triggersNewCs(this.currCsInput, newCsInput);
        if (this.connectedToLcu && newCs) await this.csTab.onNewCs(this);

        //Find out what needs to be done
        const loadData = !this.currCsFirstRunComplete || CsInput.triggersLoadCsData(this.currCsInput, newCsInput);
        const computeBans = CsInput.shouldComputeBans(newCsInput);
        const isTeamPartial = CsInput.isTeamPartial(newCsInput);
        const individualScoresNeedUpdate = CsInput.individualScoresNeedUpdate(loadData ? new CsInput() : this.currCsInput, newCsInput);

        //Init progress bar
        this.ongoingProgressBar.abort();
        const activeProgressBar = this.ongoingProgressBar.isActive();

        const useProgressBar = loadData || computeBans; // The slow ones

        if (useProgressBar) {
          const taskNames = [];
          const taskParallelism = [];
          if (loadData) {
            taskNames.push('loadData');
            taskParallelism.push(1);
          }
          {
            taskNames.push('prepareData');
            taskParallelism.push(1);
          }
          {
            taskNames.push('getScore');
            taskParallelism.push(isTeamPartial ? 1 : 3);
          }
          if (individualScoresNeedUpdate) {
            taskNames.push('getMissingScore');
            taskParallelism.push(10);
          }
          if (computeBans) {
            taskNames.push('getBans');
            taskParallelism.push(1);
          }
          {
            taskNames.push('getRecommendations');
            taskParallelism.push(isTeamPartial ? 5 : 10);
          }

          this.ongoingProgressBar = new ProgressBar(taskNames, taskParallelism);

          if (activeProgressBar) this.ongoingProgressBar.setActive();
        }

        //Start processing
        this.currCsInput = newCsInput;
        this.currCsRolePrediction = newRolePred;
        this.currGuessedRiotIDs = null;
        this.currCsApiTiers = null;
        this.currCsBans = null;
        this.currCsScore = null;
        this.currCsMissingScores = null;
        this.currCsHistory = null;
        this.currCsHistoryStats = null;
        this.currCsRecommendations = null;

        if (loadData) {
          this.currCsFirstRunComplete = false;
          if (newCs) {
            await this.csTab.onCsUpdate(this, 'clearData');
          }

          this.currCsData = await CsDataFetcher.getCsData(this.csTab.patchInfo, this.currCsInput);
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();
        }

        //Mutex the usage of CSCAI since it's a singleton and prepareData sets up for some of the functions
        while (CsManager.cscaiBeingUsed) await Timer.wait(500);
        try {
          CsManager.cscaiBeingUsed = true;

          //Do not abort before this task because it's important that the loaded data is loaded to the AI because you make it the owner
          const dataIsInPlace = CsManager.cscaiOwner == this && !loadData;
          const prepData = await CSCAI.prepareData(this.currCsInput, dataIsInPlace ? null : this.currCsData, newRolePred, newSwappedChamps);
          CsManager.cscaiOwner = this;
          const { historySortedByRoles, apiTiers, guessedRiotIDs } = prepData;
          Logger.debug(JSON.stringify({ guessedRiotIDs, newRolePred }));

          this.currGuessedRiotIDs = guessedRiotIDs; //This is just for debug, it doesn't affect what is shown, use hiddenSummoners if needed instead
          this.currCsApiTiers = apiTiers;
          this.currCsHistory = this.reverseRoleSortIntoDict(historySortedByRoles);
          this.currCsHistoryStats = this.extractHistoryStats(this.currCsHistory);
          this.currCsHistory = this.compressHistory(this.currCsHistory);

          await this.csTab.onCsUpdate(this, 'data');
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();

          if (this.currCsFirstRunComplete && this.pendingCsChange) continue;

          const singleThread = LocalStorage.getSingleThreadedMode();
          await CSCAI.setSingleThreadMode(singleThread);

          const fullTask = CSCAI.getFullScore();
          if (singleThread) await fullTask;
          const bluePartialTask = isTeamPartial ? Timer.wait(0) : CSCAI.getPartialScore(true);
          if (singleThread) await bluePartialTask;
          const redPartialTask = isTeamPartial ? Timer.wait(0) : CSCAI.getPartialScore(false);
          if (singleThread) await redPartialTask;
          this.currCsScore = {};
          this.currCsScore['full'] = await fullTask;
          if (!isTeamPartial) {
            this.currCsScore['partial'] = [await bluePartialTask, await redPartialTask];
          }
          this.compressScore(this.currCsScore);
          await this.csTab.onCsUpdate(this, 'score');
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();

          if (individualScoresNeedUpdate) {
            if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
            const missingTasks = {};
            for (let missingI = 0; missingI < 10; missingI++) {
              missingTasks[missingI] = CSCAI.getMissingScore(newRolePred[missingI] + (missingI < 5 ? 0 : 5));
              if (singleThread) await missingTasks[missingI];
            }
            this.currCsMissingScores = {};
            for (let missingI = 0; missingI < 10; missingI++) {
              this.currCsMissingScores[this.currCsInput.riotIDs[missingI]] = await missingTasks[missingI];
            }
            if (useProgressBar) this.ongoingProgressBar.taskCompleted();
          }
          await this.csTab.onCsUpdate(this, 'missing');

          if (computeBans) {
            if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
            this.currCsBans = await CSCAI.getBans();
            await this.csTab.onCsUpdate(this, 'bans');
            if (useProgressBar) this.ongoingProgressBar.taskCompleted();
          }

          if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
          const recommendationTasks = [];
          for (let i = 0; i < 10; ++i) {
            const j = i;
            const t = CSCAI.getRecommendations(j, this.getPlayedChampions(historySortedByRoles[j], j % 5));
            recommendationTasks.push(t);
            if (singleThread) await recommendationTasks[recommendationTasks.length - 1];
          }
          this.currCsRecommendations = {};
          for (let i = 0; i < 10; ++i) {
            this.currCsRecommendations[i] = await recommendationTasks[i];
            await this.csTab.onCsUpdate(this, 'picks' + i);
          }
          this.currCsFirstRunComplete = true;
          await this.csTab.onCsUpdate(this, 'finished');
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();

          if (!this.pendingCsChange && this.connectedToLcu && CsInput.readyToBeUploaded(this.currCsInput)) {
            /* await */ CsManager.uploadCurrentCS(this.getCsView());
          }
        } finally {
          CsManager.cscaiBeingUsed = false;
        }
      }
    } finally {
      this.ongoingCsChange = false;
      this.ongoingUpdaters--;
    }
  }

  public static applyChampionSwaps(csInput: CsInput) {
    const res = [null, null, null, null, null, null, null, null, null, null];
    for (let team = 0; team < 2; ++team) {
      const champToI = {};
      for (let i = 0; i < 5; ++i) {
        const cId = csInput.championIds[i + 5 * team];
        res[i + 5 * team] = cId;
        if (cId && cId != '' && cId != '0') {
          champToI[cId] = i + 5 * team;
        }
      }
      for (let i = 0; i < 5; ++i) {
        const cId = csInput.championSwaps[i + 5 * team];
        if (cId == null) continue;
        if (champToI[cId] === undefined || res[i + 5 * team] == cId) {
          csInput.championSwaps[i + 5 * team] = null;
          continue;
        }
        const targetI = champToI[cId];
        res[targetI] = res[i + 5 * team];
        res[i + 5 * team] = cId;
        if (res[targetI] && res[targetI] != '' && res[targetI] != '0') {
          champToI[res[targetI]] = targetI;
        }
        champToI[cId] = i + 5 * team;
      }
    }
    return res;
  }

  private reverseRoleSortIntoDict(sortedByRole: any[]) {
    const result = {};
    for (let i = 0; i < 5; ++i) {
      result[this.currCsInput.riotIDs[i]] = sortedByRole[this.currCsRolePrediction[i]];
      result[this.currCsInput.riotIDs[5 + i]] = sortedByRole[5 + this.currCsRolePrediction[5 + i]];
    }
    return result;
  }

  private extractHistoryStats(history: any) {
    const roleStats = {};
    for (const riotID in history) {
      const stats = {};
      for (let h of history[riotID]) {
        if (!(h.Role in stats)) {
          stats[h.Role] = { wins: 0, games: 0, timestamp: h.Timestamp };
        }

        if (h.Victory) stats[h.Role].wins++;
        stats[h.Role].games++;
      }
      roleStats[riotID] = stats;
    }

    const champStats = {};
    for (const riotID in history) {
      const riotIDStats = {};
      for (let role = 0; role < 5; ++role) {
        const stats = {};
        for (let h of history[riotID]) {
          if (h.Role != role) continue;
          if (!(h.ChampionId in stats)) {
            stats[h.ChampionId] = { wins: 0, games: 0, daysAgo: Math.floor((Date.now() - h.Timestamp) / (1000 * 60 * 60 * 24)), kills: 0, deaths: 0, assists: 0 };
          }

          if (h.Victory) stats[h.ChampionId].wins++;
          stats[h.ChampionId].games++;
          stats[h.ChampionId].kills += h.Kills;
          stats[h.ChampionId].deaths += h.Deaths;
          stats[h.ChampionId].assists += h.Assists;
        }
        riotIDStats[role] = stats;
      }
      champStats[riotID] = riotIDStats;
    }

    return { champStats, roleStats };
  }

  private compressHistory(history: any) {
    const res = {};
    for (const riotID in history) {
      res[riotID] = history[riotID].slice(0, CsTab.NUM_HISTORY);
    }
    return res;
  }

  private compressScore(score: any) {
    if (score && score.full) {
      for (const i in score.full) {
        const arr = score.full[i];
        for (const j in arr) {
          arr[j] = Math.round(arr[j] * 10000) / 10000;
        }
      }
    }
    if (score && score.partial) {
      for (const side in score.partial) {
        for (const i in score.partial[side]) {
          const arr = score.partial[side][i];
          for (const j in arr) {
            arr[j] = Math.round(arr[j] * 10000) / 10000;
          }
        }
      }
    }
  }

  private getPlayedChampions(history: any[], role: number, minPlayed: number = 3) {
    const playCount = {};
    for (let h of history) {
      if (h.Role != role) continue;
      if (!(h.ChampionId in playCount)) playCount[h.ChampionId] = 0;
      playCount[h.ChampionId]++;
    }
    const res = Object.keys(playCount).filter((k) => playCount[k] >= minPlayed);
    return res;
  }

  public getCsView() {
    return {
      csInputView: this.currCsInputView,
      rolePredictionView: this.currCsRolePredictionView,
      csInput: this.currCsInput,
      rolePrediction: this.currCsRolePrediction,
      guessedRiotIDs: this.currGuessedRiotIDs,
      apiTiers: this.currCsApiTiers,
      lcuTiers: (this.currCsData || {}).lcuTiers,
      summonerInfo: (this.currCsData || {}).summonerInfo,
      bans: this.currCsBans,
      score: this.currCsScore,
      missingScore: this.currCsMissingScores,
      history: this.currCsHistory,
      historyStats: this.currCsHistoryStats,
      recommendations: this.currCsRecommendations,
      swappable: this.swappableCs,
      editable: this.editableCs,
      date: this.date,
    };
  }

  //When CS ends
  private async handleGameStarting(info: any) {
    try {
      if (!info || !info.info || !info.info.champ_select || !info.info.champ_select.raw) return;
      const lcuInfo = JSON.parse(info.info.champ_select.raw);
      if (!lcuInfo || !lcuInfo.timer || (lcuInfo.timer.phase != 'GAME_STARTING' && lcuInfo.timer.phase != 'FINALIZATION')) return;

      await CsManager.pollForSpectator(this, lcuInfo.timer.adjustedTimeLeftInPhase);
    } catch (ex) {
      ErrorReporting.report('handleGameStarting', { ex, info });
    }
  }

  private static pollingUntil: number = 0;
  private static async pollForSpectator(manager: CsManager, msBeforePollingStart: number, msToKeepPolling: number = 60000) {
    let pollingIntervalMs = 3000;
    const now = Date.now();
    const alreadyPolling = now < this.pollingUntil;
    this.pollingUntil = Math.max(this.pollingUntil, now + msBeforePollingStart + msToKeepPolling);
    if (alreadyPolling) return;

    const curr = await Lcu.getCurrentRiotIDAndRegion();
    if (curr == null) {
      Logger.warn('Could not check if in an active game because could not get riotID and region from LoL client.');
      return;
    }
    const puuid = await CsDataFetcher.getPuuidByRegionAndRiotID(curr.region, curr.riotID); //Typically cached already
    const sId = await CsDataFetcher.getSummonerIdByRegionAndPuuid(curr.region, puuid); //Typically cached already
    await Timer.wait(msBeforePollingStart);
    let spect = null;
    let csInput = null;
    while (Date.now() < this.pollingUntil) {
      try {
        let spectData = await CsManager.getPartialCsInputThroughAPI(curr.region, sId);
        if (spectData != null && !Lcu.WHITELISTED_QUEUES.includes(spectData.queueId)) {
          Logger.log('Active game not whitelisted queue = ' + JSON.stringify(spect));
          return null;
        }

        let lcuLiveData: LcuLiveGameData = null;
        if (spectData == null && manager.currCsInputView.queueId) {
          lcuLiveData = await CsManager.getPartialCsInputThroughOWEvents();

          if (lcuLiveData != null) {
            lcuLiveData.queueId = manager.currCsInputView.queueId; //OW can't get it for some reason so use this
          }
        }

        if (spectData == null && lcuLiveData == null) {
          await Timer.wait(pollingIntervalMs);
          pollingIntervalMs += 1000;
          Logger.log('Active game not found = ' + JSON.stringify(spect));
          continue;
        }

        const newCsInput = new CsInput();
        newCsInput.region = curr.region;
        newCsInput.ownerRiotID = curr.riotID;
        newCsInput.picking = [false, false, false, false, false, false, false, false, false, false];
        if (spectData) {
          const riotIDs = await CsDataFetcher.getRiotIDsByRegionAndSummonerId(curr.region, spectData.summonerIds);

          newCsInput.championIds = spectData.championIds;
          newCsInput.queueId = spectData.queueId;
          newCsInput.riotIDs = riotIDs;
          newCsInput.summonerSpells = spectData.summonerSpells;
        } else {
          //lcuLiveData
          newCsInput.championIds = lcuLiveData.championIds;
          newCsInput.queueId = lcuLiveData.queueId;
          newCsInput.riotIDs = lcuLiveData.riotIDs;
          newCsInput.summonerSpells = lcuLiveData.summonerSpells;
        }

        //Note: no await between you start to use manager and when you call update on it (except the queueId above which we don't care about)
        {
          const patchInfo = MainWindow.instance().patchInfo;
          const isRanked = patchInfo.RankedQueueTypeIds.includes(parseInt(newCsInput.queueId));
          const sToCs = isRanked ? this.findSpectatorToCsMapping(manager.currCsInputView.championIds, newCsInput.championIds) : this.findSpectatorToCsMapping(manager.currCsInputView.riotIDs, newCsInput.riotIDs);
          if (sToCs) {
            //roles not in the data here
            newCsInput.assignedRoles = this.applyMapping(manager.currCsInputView.assignedRoles, sToCs);
            // csInput.assignedRoles = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]; //alt
            // csInput.assignedRoles = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]; //or maybe it's like this?

            newCsInput.roleSwaps = this.applyMapping(manager.currCsInputView.roleSwaps, sToCs);
            newCsInput.championSwaps = this.applyMapping(manager.currCsInputView.championSwaps, sToCs);
          }

          await ((await manager.update(newCsInput)) || {})[0];
        }
        break;
      } catch (ex) {
        ErrorReporting.report('pollForSpectator', { ex, spect, csInput });
        await Timer.wait(pollingIntervalMs);
        continue;
      }
    }
  }

  private static async getPartialCsInputThroughAPI(region, summonerId) {
    const spect = await CscApi.getRunningGame(region, summonerId);

    if (spect == null || !spect.result || !spect.result.participants || spect.result.participants.length != 10) return null;

    const spectData = new SpectatorData();
    spectData.queueId = spect.result.gameQueueConfigId.toString();
    spectData.summonerIds = spect.result.participants.map((x) => x.summonerId);
    spectData.championIds = spect.result.participants.map((x) => x.championId.toString());
    spectData.summonerSpells = spect.result.participants.map((x) => [x.spell1Id || -1, x.spell2Id || -1]);

    return spectData;
  }

  private static async getPartialCsInputThroughOWEvents() {
    const liveGameInfo = await Lcu.getLiveGameInfo();
    const lcuLiveGameData = new LcuLiveGameData();
    if (liveGameInfo && liveGameInfo.res && liveGameInfo.res.game_info && liveGameInfo.res.game_info.queueId) {
      lcuLiveGameData.queueId = liveGameInfo.res.game_info.queueId;
    }

    if (liveGameInfo && liveGameInfo.res && liveGameInfo.res.live_client_data && liveGameInfo.res.live_client_data.all_players && liveGameInfo.res.match_info && liveGameInfo.res.match_info.players_tagline) {
      const players = JSON.parse(liveGameInfo.res.live_client_data.all_players);
      const taglines = JSON.parse(liveGameInfo.res.match_info.players_tagline);

      if (players && players.length == 10 && taglines && taglines.length == 10) {
        const nameToRiotID = {};
        for (let i = 0; i < 10; ++i) {
          const nameI = players[i].summonerName;
          nameToRiotID[nameI] = taglines[i].playerName + '#' + taglines[i].tagline;
        }

        const sortedPlayers = players.sort((a, b) => b.team.localeCompare(a.team)); // Basically comparing ORDER vs CHAOS, where ORDER should be first
        const summonerNames = sortedPlayers.map((x) => x.summonerName);
        lcuLiveGameData.riotIDs = summonerNames.map((x) => nameToRiotID[x]);
        lcuLiveGameData.championIds = await Promise.all(sortedPlayers.map(async (x) => (await CSCAI.championNameToId(x.championName)).toString()));
        lcuLiveGameData.summonerSpells = await Promise.all(
          sortedPlayers.map(async (x) => [(await CSCAI.summonerSpellNameToId(x.summonerSpells.summonerSpellOne.displayName)) || -1, (await CSCAI.summonerSpellNameToId(x.summonerSpells.summonerSpellTwo.displayName)) || -1])
        );

        return lcuLiveGameData;
      }
    }

    //This method is less preferred because it doesn't have summoner spells - doesn't work since riotID
    // if (liveGameInfo && liveGameInfo.res && liveGameInfo.res.game_info && liveGameInfo.res.game_info.teams) {
    //   const teams = JSON.parse(decodeURI(liveGameInfo.res.game_info.teams));

    //   if (teams && teams.length == 10) {
    //     for (let i = 0; i < 10; ++i) {
    //       spectData.summonerIds[i] = teams[i].summoner;
    //       if (spectData.summonerIds[i].indexOf("'") != -1) {
    //         //'[NAME HERE]' **local**
    //         spectData.summonerIds[i] = spectData.summonerIds[i].split("'")[1];
    //       }
    //       spectData.championIds[i] = (await CSCAI.championNameToId(teams[i].champion)).toString();
    //     }

    //     return spectData;
    //   }
    // }

    return null;
  }

  private static findSpectatorToCsMapping(csRiotIDs: string[], spectRiotIDs: string[]) {
    const mapping = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 10; ++i) {
      const riotID = csRiotIDs[i];
      const idx = spectRiotIDs.indexOf(riotID);
      if (riotID.length > 0 && idx >= 0) {
        mapping[idx] = i;
      }
    }
    if (new Set(mapping).size != 10) return null;
    return mapping;
  }

  private static applyMapping(arr: any[], mapping: number[]) {
    const res = [];
    for (let i = 0; i < 10; ++i) {
      res[i] = arr[mapping[i]];
    }
    return res;
  }

  private static async uploadCurrentCS(data: any) {
    let curr = await Lcu.getCurrentRiotIDAndRegion();
    if (curr == null) {
      for (let tries = 0; tries < 5; tries++) {
        await Timer.wait(10000);
        curr = await Lcu.getCurrentRiotIDAndRegion();
        if (curr != null) break;
      }
    }
    if (curr == null) {
      ErrorReporting.report('uploadCurrentCS', { ex: 'Lcu.getCurrentRiotIDAndRegion', data });
      return;
    }

    try {
      const puuid = await CsDataFetcher.getPuuidByRegionAndRiotID(curr.region, curr.riotID);
      const side = CsInput.getOwnerIdx(data.csInputView) < 5 ? 0 : 1;
      const partialPrediction = data.score.partial ? data.score.partial[side][0][side] : 0.5;
      const fullPrediction = data.score.full ? data.score.full[0][side] : 0.5;
      await CscApi.uploadPrediction(curr.region, puuid, JSON.stringify(data), partialPrediction.toString(), fullPrediction.toString());
    } catch (ex) {
      ErrorReporting.report('uploadCurrentCS', { ex, data });
      Logger.warn(ex);
    }
  }
}
