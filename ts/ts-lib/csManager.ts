import { interestingFeatures } from "./consts";
import { CsDataFetcher } from "./csDataFetcher";
import { ProgressBar } from "./progressBar"
import { Lcu } from "./lcu";
import { Utils } from "./utils";
import { CSCAI } from "./cscai";
import { Timer } from "./timer";
import { Aws } from "./aws";
import { ErrorReporting } from "./errorReporting";
import { Logger } from "./logger";


export class CsInput {
  //Trigger onNewCs (except if manual), and require loading CsData
  public region = "";
  public queueId = "";
  public ownerName = null;
  public summonerNames = ['', '', '', '', '', '', '', '', '', '']; //Order here is arbitrary (and will be invisible on the UI since they are later sorted by roles)

  //Trigger onCsUpdate
  public championIds = ['', '', '', '', '', '', '', '', '', ''];
  public picking = [false, false, false, false, false, false, false, false, false, false];
  public summonerSpells = [[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1]];
  public assignedRoles: any[] = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];

  public roleSwaps = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  public championSwaps: string[] = [null, null, null, null, null, null, null, null, null, null];

  public static triggerLoadCsData(oldCsInput: CsInput, newCsInput: CsInput) {
    return oldCsInput.queueId != newCsInput.queueId || oldCsInput.region != newCsInput.region || oldCsInput.ownerName != newCsInput.ownerName || !Utils.setsAreEqual(new Set(oldCsInput.summonerNames), new Set(newCsInput.summonerNames));
  }

  public static triggerNewCs(oldCsInput: CsInput, newCsInput: CsInput) {
    return oldCsInput.queueId != newCsInput.queueId || oldCsInput.region != newCsInput.region || oldCsInput.ownerName != newCsInput.ownerName || !Utils.setIncludes(new Set(newCsInput.summonerNames), new Set(oldCsInput.summonerNames));
  }
  
  public static anyVisibleChange(oldCsInput: CsInput, newCsInput: CsInput) {
    return JSON.stringify(oldCsInput) != JSON.stringify(newCsInput);
  }
  
  public static readyToBeUploaded(csInput: CsInput) {
    //Returns true for both pre-game and in-game
    return (csInput.queueId == '420' || csInput.queueId == '440') && 
      csInput.region != '' && 
      csInput.summonerNames.filter(x => x == null || x == '' ).length <= 5 &&
      csInput.championIds.filter(x => x == null || x == '' || x == '0').length == 0 && 
      csInput.picking.filter(x => x == true).length == 0;
  }

  public static shouldComputeBans(csInput: CsInput) {
    return false; //Until we figure out a faster way to do this
    return csInput.championIds.slice(0, 5).filter(x => x != null && x != "").length == 0 || csInput.championIds.slice(5, 10).filter(x => x != null && x != "").length == 0;
  }

  public static isTeamPartial(csInput: CsInput) {
    return csInput.summonerNames.slice(0, 5).filter(x => x != null && x != "").length == 0 || csInput.summonerNames.slice(5, 10).filter(x => x != null && x != "").length == 0;
  }

  public static individualScoresNeedUpdate(oldCsInput: CsInput, newCsInput: CsInput) {
    const loadData = this.triggerLoadCsData(oldCsInput, newCsInput);
    const draftChanged = !Utils.arraysEqual(oldCsInput.championIds, newCsInput.championIds) ||
      JSON.stringify(oldCsInput.summonerSpells) != JSON.stringify(newCsInput.summonerSpells) ||
      !Utils.arraysEqual(oldCsInput.assignedRoles, newCsInput.assignedRoles) ||
      !Utils.arraysEqual(oldCsInput.roleSwaps, newCsInput.roleSwaps) || 
      !Utils.arraysEqual(oldCsInput.championSwaps, newCsInput.championSwaps) ||
      oldCsInput.ownerName != newCsInput.ownerName;

    return loadData || draftChanged;
  }

  public static getOwnerIdx(csInput: CsInput) {
    const ownerIdx = csInput.summonerNames.indexOf(csInput.ownerName);
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
  //Key on all is the summonerName only (no region)
  public summonerInfo = {};
  public histories = {};
  public masteries = {};
  public tiers = {};
  public lcuTiers = {};  //These are preferred to be displayed but may not be used to the AI
  public matches = {};
}

export class CsManager {
  private static cscaiOwner: CsManager = null;
  private static cscaiBeingUsed: boolean = false;
  private patchInfo: any;
  public connectedToLcu: boolean = false;
  public swappableCs: boolean = false;
  public editableCs: boolean = false;
  public date: number = null;
  public onNewCs: any;
  public onCsUpdate: any;

  private currCsInput = new CsInput();
  private currCsData = new CsData();

  private currCsInputView = new CsInput();
  private currCsRolePredictionView = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
  private currCsRolePrediction = null;
  private currCsApiTiers = null;
  private currCsBans = null;
  private currCsScore = null;
  private currCsMissingScores = null;
  private currCsHistory = null;
  private currCsRecommendations = null;
  public currCsFirstRunComplete = false;

  private newCsInput: CsInput = null;
  private ongoingRolePred = false;
  private pendingRolePred = false;

  private ongoingCsChange = false;
  private pendingCsChange = false;

  public ongoingProgressBar = new ProgressBar([], []);

  constructor(patchInfo: any, connectedToLcu: boolean, onNewCs: any, onCsUpdate: any, csView: any, swappable: boolean, editable: boolean) {
    this.patchInfo = patchInfo;
    this.connectedToLcu = connectedToLcu;
    this.onNewCs = onNewCs;
    this.onCsUpdate = onCsUpdate;

    if (this.connectedToLcu) {
      //Set required features when LCU starts
      const setRequiredFeatures = () => { Lcu.setRequiredFeatures([interestingFeatures.game_flow, interestingFeatures.champ_select, interestingFeatures.lcu_info]); };
      overwolf.games.launchers.onLaunched.removeListener(setRequiredFeatures);
      overwolf.games.launchers.onLaunched.addListener(setRequiredFeatures);
      overwolf.games.launchers.getRunningLaunchersInfo(info => { if (Lcu.isLcuRunningFromInfo(info)) { setRequiredFeatures(); }});

      //Listen for champion select
      const that = this; //Need this trick else this will be window inside the callbacks
      const handleLcuEvent = (event: any) => that.handleLcuEvent(event);
      overwolf.games.launchers.events.onInfoUpdates.removeListener(handleLcuEvent);
      overwolf.games.launchers.events.onInfoUpdates.addListener(handleLcuEvent);
      overwolf.games.launchers.events.onNewEvents.removeListener(handleLcuEvent);
      overwolf.games.launchers.events.onNewEvents.addListener(handleLcuEvent);
    }

    this.swappableCs = swappable;
    this.editableCs = editable;
    this.init(csView);

    this.debug();
  }

  private async debug() {
  }

  private init(csView: any) {
    if (!csView) return;

    const { csInputView, rolePredictionView, csInput, rolePrediction, apiTiers, lcuTiers, bans, score, missingScore, history, recommendations, swappable, editable, date } = csView;

    this.currCsInputView = csInput;
    this.currCsRolePredictionView = rolePrediction;
    this.currCsInput = csInput;
    this.currCsRolePrediction = rolePrediction;
    this.currCsApiTiers = apiTiers;
    this.currCsData = new CsData();
    this.currCsData.lcuTiers = lcuTiers;
    this.currCsBans = bans;
    this.currCsScore = score;
    this.currCsMissingScores = missingScore;
    this.currCsHistory = history;
    this.currCsRecommendations = recommendations;
    this.date = date;
  }

  public manualCsChange(newCsInput: CsInput) {
    if (!this.editableCs && !this.swappableCs) return;
    this.handleCsChange(newCsInput);
  }

  private async handleLcuEvent(info: any) {
    const newCsInput = await Lcu.getCsInput(this.currCsInputView, info);
    if (newCsInput == null) return;

    this.handleCsChange(newCsInput);
    this.handleGameStarting(info);
  }

  public async refreshView() {
    await this.handleCsChange(this.currCsInputView);
  }

  private async handleCsChange(newCsInput: CsInput) {
    if (!CsInput.anyVisibleChange(this.newCsInput, newCsInput)) {
      return;
    }

    if (this.ongoingRolePred) {
      this.pendingRolePred = true;
      this.newCsInput = newCsInput;
      return;
    }

    let newRolePred = null;
    let newSwappedChamps = null;
    while(true) {
      if (this.pendingRolePred) {
        newCsInput = this.newCsInput;
        this.pendingRolePred = false;
      }
      try {
        this.ongoingRolePred = true;
        newSwappedChamps = CsManager.applyChampionSwaps(newCsInput);
        newRolePred = await CSCAI.getRolePredictions(newCsInput, newSwappedChamps);

      } finally {
        this.ongoingRolePred = false;
      }
      if (!this.pendingRolePred) break;
    }
    
    this.currCsInputView = newCsInput;
    this.currCsRolePredictionView = newRolePred;
    this.onCsUpdate('instant');

    if (this.ongoingCsChange) {
      this.pendingCsChange = true;
      return;
    }

    while(true) {
      if (this.pendingCsChange) { //This would never happen on the first iteration, it's to be able to just do 'continue' to abort for pending
        newCsInput = this.currCsInputView;
        newRolePred = this.currCsRolePredictionView;
        newSwappedChamps = CsManager.applyChampionSwaps(newCsInput);
        this.pendingCsChange = false;
      }

      try {
        this.ongoingCsChange = true;
        const newCs = CsInput.triggerNewCs(this.currCsInput, newCsInput);
        if (this.connectedToLcu && newCs) this.onNewCs();

        //Find out what needs to be done
        const loadData = !this.currCsFirstRunComplete || CsInput.triggerLoadCsData(this.currCsInput, newCsInput);
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
          if (loadData) { taskNames.push('loadData'); taskParallelism.push(1); }
          { taskNames.push('prepareData'); taskParallelism.push(1); }
          { taskNames.push('getScore'); taskParallelism.push(isTeamPartial ? 1 : 3); }
          if (individualScoresNeedUpdate) { taskNames.push('getMissingScore'); taskParallelism.push(10); }
          if (computeBans) { taskNames.push('getBans'); taskParallelism.push(1); }
          { taskNames.push('getRecommendations'); taskParallelism.push(isTeamPartial ? 5 : 10); }
  
          this.ongoingProgressBar = new ProgressBar(taskNames, taskParallelism);

          if (activeProgressBar) this.ongoingProgressBar.setActive();
        }

        //Start processing
        this.currCsInput = newCsInput;
        this.currCsRolePrediction = newRolePred;
        this.currCsApiTiers = null;
        this.currCsBans = null;
        this.currCsScore = null;
        this.currCsMissingScores = null;
        this.currCsHistory = null;
        this.currCsRecommendations = null;
      
        if (loadData) {
          this.currCsFirstRunComplete = false;
          this.onCsUpdate('clearData');

          this.currCsData = await CsDataFetcher.getCsData(this.patchInfo, this.currCsInput);
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();
        }
        
        //Mutex the usage of CSCAI since it's a singleton
        while (CsManager.cscaiBeingUsed) await Timer.wait(500);
        try {
          CsManager.cscaiBeingUsed = true;

          //Do not abort before this task because it's important that the loaded data is loaded to the AI
          const dataIsInPlace = CsManager.cscaiOwner == this && !loadData;
          const prepData = await CSCAI.prepareData(this.currCsInput, dataIsInPlace ? null : this.currCsData, newRolePred, newSwappedChamps);
          CsManager.cscaiOwner = this;
          const { historySortedByRoles, apiTiers } = prepData;

          // const TODOdebug = await CSCAI.debugView();
          
          this.currCsApiTiers = apiTiers;
          this.currCsHistory = this.reverseRoleSortIntoDict(historySortedByRoles);
          this.onCsUpdate('data');
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();

          if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
          const fullTask = CSCAI.getFullScore();
          const bluePartialTask = isTeamPartial ? Timer.wait(0) : CSCAI.getPartialScore(true);
          const redPartialTask = isTeamPartial ? Timer.wait(0) : CSCAI.getPartialScore(false);
          this.currCsScore = {};
          this.currCsScore['full'] = await fullTask;
          if (!isTeamPartial) {
            this.currCsScore['partial'] = [ await bluePartialTask, await redPartialTask ];
          }
          this.onCsUpdate('score');
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();

          if (individualScoresNeedUpdate) {
            if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
            const missingTasks = {}
            for (let missingI = 0; missingI < 10; missingI++) {
              missingTasks[missingI] = CSCAI.getMissingScore(newRolePred[missingI] + (missingI < 5 ? 0 : 5));
            }
            this.currCsMissingScores = {};
            for (let missingI = 0; missingI < 10; missingI++) {
              this.currCsMissingScores[this.currCsInput.summonerNames[missingI]] = await missingTasks[missingI];
            }
            if (useProgressBar) this.ongoingProgressBar.taskCompleted();
          }
          this.onCsUpdate('missing');

          if (computeBans) {
            if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
            this.currCsBans = await CSCAI.getBans();
            this.onCsUpdate('bans');
            if (useProgressBar) this.ongoingProgressBar.taskCompleted();
          }

          if (this.currCsFirstRunComplete && this.pendingCsChange) continue;
          const recommendationTasks = [];
          for (let i = 0; i < 10; ++i) {
            const j = i;
            recommendationTasks.push(CSCAI.getRecommendations(j, this.getPlayedChampions(historySortedByRoles[j], j % 5)));
          }
          this.currCsRecommendations = {};
          for (let i = 0; i < 10; ++i) {
            this.currCsRecommendations[i] = await recommendationTasks[i];
            this.onCsUpdate('picks' + i);
          }
          this.currCsFirstRunComplete = true;
          this.onCsUpdate('finished');
          if (useProgressBar) this.ongoingProgressBar.taskCompleted();

          if (!this.pendingCsChange && this.connectedToLcu && CsInput.readyToBeUploaded(this.currCsInput)) {
            this.uploadCurrentCS();
          }

        } finally {
          CsManager.cscaiBeingUsed = false;
        }
      
      } finally {
        this.ongoingCsChange = false;
      }
      if (!this.pendingCsChange) break;
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
      result[this.currCsInput.summonerNames[i]] = sortedByRole[this.currCsRolePrediction[i]];
      result[this.currCsInput.summonerNames[5 + i]] = sortedByRole[5 + this.currCsRolePrediction[5 + i]];
    }
    return result;
  }

  private getPlayedChampions(history: any[], role: number, minPlayed: number = 3) {
    const playCount = {};
    for (let h of history) {
      if (h.Role != role) continue;
      if (!(h.ChampionId in playCount)) playCount[h.ChampionId] = 0;
      playCount[h.ChampionId]++;
    }
    const res = Object.keys(playCount).filter(k => playCount[k] >= minPlayed);
    return res;
  }

  public getCsView() {
    return {
      csInputView: this.currCsInputView,
      rolePredictionView: this.currCsRolePredictionView,
      csInput: this.currCsInput,
      rolePrediction: this.currCsRolePrediction,
      apiTiers: this.currCsApiTiers,
      lcuTiers: (this.currCsData || {}).lcuTiers,
      bans: this.currCsBans,
      score: this.currCsScore,
      missingScore: this.currCsMissingScores,
      history: this.currCsHistory,
      recommendations: this.currCsRecommendations,
      swappable: this.swappableCs,
      editable: this.editableCs,
      date: this.date,
    };
  }

  private async handleGameStarting(info: any) {
    try {
      if (!info || !info.info || !info.info.champ_select || !info.info.champ_select.raw) return;
      const lcuInfo = JSON.parse(info.info.champ_select.raw);
      if (!lcuInfo || !lcuInfo.timer || lcuInfo.timer.phase != "GAME_STARTING") return;
      
      this.pollForSpectator(lcuInfo.timer.adjustedTimeLeftInPhase);

    } catch (ex) {
      ErrorReporting.report('handleGameStarting', ex);
    }
  }

  private pollingUntil: number = 0;
  private async pollForSpectator(msBeforePollingStart: number, msToKeepPolling: number = 60000) {
    let pollingIntervalMs = 3000;
    const now = Date.now();
    const alreadyPolling = now < this.pollingUntil;
    this.pollingUntil = Math.max(this.pollingUntil, now + msBeforePollingStart + msToKeepPolling);
    if (alreadyPolling) return;

    const nr = await Lcu.getCurrentNameAndRegion();
    if (nr == null) {
      ErrorReporting.report('pollForSpectator', 'Lcu.getCurrentNameAndRegion');
      return;
    }
    const sId = await CsDataFetcher.getSummonerIdByRegionAndName(nr.region, nr.name); //Typically cached already
    await Timer.wait(msBeforePollingStart);
    while (Date.now() < this.pollingUntil) {
      try {
        let spect = await Aws.getRunningGame(nr.region, sId);

        if (spect == null || !spect.result || !spect.result.participants || spect.result.participants.length != 10) {
          await Timer.wait(pollingIntervalMs);
          pollingIntervalMs += 1000;
          Logger.log("Active game not found = " + JSON.stringify(spect));
          continue;
        }
        //Use this in the upload prediction?
        //spect.gameId;
        //spect.gameStartTime;

        const csInput = new CsInput();
        csInput.queueId = spect.result.gameQueueConfigId;
        csInput.region = nr.region;
        csInput.ownerName = nr.name;
        csInput.summonerNames = spect.result.participants.map(x => x.summonerName);

        csInput.championIds = spect.result.participants.map(x => x.championId);
        csInput.picking = [false, false, false, false, false, false, false, false, false, false];
        csInput.summonerSpells = spect.result.participants.map(x => [x.spell1Id || -1, x.spell2Id || -1]);
        csInput.assignedRoles = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]; //TODO roles not in the data here??
        // csInput.assignedRoles = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]; //TODO maybe it's like this??
        
        csInput.roleSwaps = this.currCsInputView.roleSwaps;
        csInput.championSwaps = this.currCsInputView.championSwaps;
        
        this.handleCsChange(csInput);
        break;
      } catch (ex) {
        ErrorReporting.report('pollForSpectator', ex);
        await Timer.wait(pollingIntervalMs);
        continue;
      }
    }
  }

  private async uploadCurrentCS() {
    const nr = await Lcu.getCurrentNameAndRegion();
    if (nr == null) {
      ErrorReporting.report('uploadCurrentCS', 'Lcu.getCurrentNameAndRegion');
      return;
    }
    const puuid = await CsDataFetcher.getPuuidByRegionAndName(nr.region, nr.name);
    const data = this.getCsView(); //Need the full view to be able to load an old CS from personal tab

    //TODO: Add more data to view such as usage statistics here
    //TODO: Wrap this in error reporting

    const partialPrediction = CsInput.getOwnerIdx(data.csInputView) < 5 ? data.score.bluePartialScore : data.score.redPartialScore;
    const fullPrediction = CsInput.getOwnerIdx(data.csInputView) < 5 ? data.score.totalScore : 1 - data.score.totalScore;
    Aws.uploadPrediction(nr.region, puuid, JSON.stringify(data), partialPrediction, fullPrediction);
  }

}