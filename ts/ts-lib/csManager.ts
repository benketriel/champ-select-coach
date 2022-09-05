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
  public blueSide = true;
  public summonerNames = []; //Order here is arbitrary (and will be invisible on the UI since they are later sorted by roles)

  //Trigger onCsUpdate
  public ownerName = '';
  public championIds = [];
  public picking = [];
  public summonerSpells = [];
  public assignedRoles = [];

  public roleSwaps = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  public championSwaps = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

  public static triggerLoadCsData(oldCsInput: CsInput, newCsInput: CsInput) {
    return oldCsInput.queueId != newCsInput.queueId || oldCsInput.region != newCsInput.region || oldCsInput.blueSide != newCsInput.blueSide || !Utils.setsAreEqual(new Set(oldCsInput.summonerNames), new Set(newCsInput.summonerNames));
  }

  public static triggerNewCs(oldCsInput: CsInput, newCsInput: CsInput) {
    return oldCsInput.queueId != newCsInput.queueId || oldCsInput.region != newCsInput.region || oldCsInput.blueSide != newCsInput.blueSide || !Utils.setIncludes(new Set(newCsInput.summonerNames), new Set(oldCsInput.summonerNames));
  }
  
  public static anyVisibleChange(oldCsInput: CsInput, newCsInput: CsInput) {
    return JSON.stringify(oldCsInput) != JSON.stringify(newCsInput);
  }
  
  public static readyToBeUploaded(csInput: CsInput) {
    //Returns true for both pre-game and in-game
    return (csInput.queueId == '420' || csInput.queueId == '440') && 
      csInput.region != '' && 
      csInput.summonerNames.filter(x => x == null).length <= 5 &&
      csInput.championIds.filter(x => x == null).length == 0 && 
      csInput.picking.filter(x => x == true).length == 0;
  }

  public static shouldComputeBans(csInput: CsInput) {
    return false; //Until we figure out a faster way to do this
    return csInput.championIds.slice(0, 5).filter(x => x != null && x != "").length == 0 || csInput.championIds.slice(5, 10).filter(x => x != null && x != "").length == 0;
  }

  public static isTeamPartial(csInput: CsInput) {
    return csInput.summonerNames.slice(0, 5).filter(x => x != null && x != "").length == 0 || csInput.summonerNames.slice(5, 10).filter(x => x != null && x != "").length == 0;
  }

  public static individualScoresThatNeedUpdate(oldCsInput: CsInput, newCsInput: CsInput) {
    const loadData = this.triggerLoadCsData(oldCsInput, newCsInput);
    const draftChanged = !Utils.arraysEqual(oldCsInput.championIds, newCsInput.championIds) ||
      JSON.stringify(oldCsInput.summonerSpells) != JSON.stringify(newCsInput.summonerSpells) ||
      !Utils.arraysEqual(oldCsInput.assignedRoles, newCsInput.assignedRoles) ||
      !Utils.arraysEqual(oldCsInput.roleSwaps, newCsInput.roleSwaps) || 
      !Utils.arraysEqual(oldCsInput.championSwaps, newCsInput.championSwaps);

    const res = [];
    for (let i = 0; i < 10; ++i) {
      if (newCsInput.summonerNames[i] == null || newCsInput.summonerNames[i] == "") continue;
      if (loadData || draftChanged) res.push(i);
    }

    return res;
  }

  public static getOwnerIdx(csInput: CsInput) {
    const ownerIdx = csInput.summonerNames.indexOf(csInput.ownerName);
    if (ownerIdx == -1) {
      //TODO get the one with higest elo? will be relevant for manual cs
      return 0;
    }
    return ownerIdx;
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
  private patchInfo: any;
  public connectedToLcu: boolean = false;
  public onNewCs: any;
  public onCsUpdate: any;

  private currCsInput = new CsInput();
  private currCsData = new CsData();

  private currCsInputView = new CsInput();
  private currCsRolePrediction = null;
  private currCsBans = null;
  private currCsScore = null;
  private currCsMissingScores = null;
  private currCsHistory = null;
  private currCsRecommendations = null;
  private currCsFirstRunComplete = false;

  private ongoingCsChange = false;
  public ongoingProgressBar = new ProgressBar([], []);;
  private pendingCsChange = null;

  constructor(patchInfo: any, connectedToLcu: boolean, onNewCs: any, onCsUpdate: any) {
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

    this.debug();
  }

  private async debug() {
    //TODO
    await Timer.wait(2000);
  }

  public manualCsChange(newCsInput: CsInput) {
    this.handleCsChange(newCsInput);
  }

  private async handleLcuEvent(info: any) {
    const newCsInput = await Lcu.getCsInput(this.currCsInput, info);
    if (newCsInput == null) return;

    this.handleCsChange(newCsInput);
    this.handleGameStarting(info);
  }

  private async handleCsChange(newCsInput: CsInput) {
    if (!CsInput.anyVisibleChange(this.currCsInputView, newCsInput)) {
      return;
    }
    const rolePred = await CSCAI.getRolePredictions(newCsInput);
    this.currCsInputView = newCsInput;
    this.currCsRolePrediction = rolePred;
    this.onCsUpdate('instant');

    if (this.ongoingCsChange) {
      this.pendingCsChange = newCsInput;
      return;
    }

    while(true) {
      if (this.pendingCsChange != null) { //This would never happen on the first iteration, it's to be able to just do 'continue' to abort for pending
        newCsInput = this.pendingCsChange;
        this.pendingCsChange = null;
      }

      try {
        this.ongoingCsChange = true;
        const newCs = CsInput.triggerNewCs(this.currCsInput, newCsInput);
        if (this.connectedToLcu && newCs) this.onNewCs();

        //Find out what needs to be done
        const loadData = CsInput.triggerLoadCsData(this.currCsInput, newCsInput);
        const computeBans = CsInput.shouldComputeBans(newCsInput);
        const isTeamPartial = CsInput.isTeamPartial(newCsInput);
        const individualScoresThatNeedUpdate = CsInput.individualScoresThatNeedUpdate(this.currCsInput, newCsInput);

        //Init progress bar
        this.ongoingProgressBar.abort();
        const activeProgressBar = this.ongoingProgressBar.isActive();

        const taskNames = [];
        const taskParallelism = [];
        if (loadData) { taskNames.push('loadData'); taskParallelism.push(1); }
        { taskNames.push('prepareData'); taskParallelism.push(1); }
        { taskNames.push('getScore'); taskParallelism.push(isTeamPartial ? 1 : 3); }
        if (individualScoresThatNeedUpdate.length > 0) { taskNames.push('getMissingScore'); taskParallelism.push(individualScoresThatNeedUpdate.length); }
        if (computeBans) { taskNames.push('getBans'); taskParallelism.push(1); }
        { taskNames.push('getRecommendations'); taskParallelism.push(isTeamPartial ? 5 : 10); }

        this.ongoingProgressBar = new ProgressBar(taskNames, taskParallelism);
        if (activeProgressBar) this.ongoingProgressBar.setActive();

        //Start processing
        this.currCsInput = newCsInput;
        if (loadData) {
          this.currCsBans = {};
          this.currCsScore = {};
          this.currCsMissingScores = {};
          this.currCsHistory = {};
          this.currCsRecommendations = {};
          this.currCsFirstRunComplete = false;
          this.onCsUpdate('clearData');

          this.currCsData = await CsDataFetcher.getCsData(this.patchInfo, this.currCsInput);
          this.ongoingProgressBar.taskCompleted();
        }
        
        //Do not abort before this task because it's important that the loaded data is loaded to the AI
        const { history, roles } = await CSCAI.prepareData(this.currCsInput, loadData ? this.currCsData : null);
        const historySortedByRoles = history;

        const TODOdebug = await CSCAI.debugView();

        this.currCsHistory = this.reverseRoleSortIntoDict(historySortedByRoles, roles);
        this.onCsUpdate('data');
        this.ongoingProgressBar.taskCompleted();

        if (this.currCsFirstRunComplete && this.pendingCsChange != null) continue;
        const fullTask = CSCAI.getFullScore();
        const bluePartialTask = isTeamPartial ? Timer.wait(0) : CSCAI.getPartialScore(true);
        const redPartialTask = isTeamPartial ? Timer.wait(0) : CSCAI.getPartialScore(false);
        this.currCsScore['full'] = await fullTask;
        if (!isTeamPartial) {
          this.currCsScore['partial'] = [ await bluePartialTask, await redPartialTask ];
        }
        this.onCsUpdate('score');
        this.ongoingProgressBar.taskCompleted();

        if (individualScoresThatNeedUpdate.length > 0) {
          if (this.currCsFirstRunComplete && this.pendingCsChange != null) continue;
          const missingTasks = {}
          for (let missingI of individualScoresThatNeedUpdate) {
            missingTasks[missingI] = CSCAI.getMissingScore(roles[missingI] + (missingI < 5 ? 0 : 5));
          }
          for (let missingI of individualScoresThatNeedUpdate) {
            this.currCsMissingScores[this.currCsInput.summonerNames[missingI]] = await missingTasks[missingI];
          }
          this.onCsUpdate('missing');
          this.ongoingProgressBar.taskCompleted();
        }

        if (computeBans) {
          if (this.currCsFirstRunComplete && this.pendingCsChange != null) continue;
          this.currCsBans = await CSCAI.getBans();
          this.onCsUpdate('bans');
          this.ongoingProgressBar.taskCompleted();
        }

        if (this.currCsFirstRunComplete && this.pendingCsChange != null) continue;
        const recommendationTasks = [];
        for (let i = 0; i < 10; ++i) {
          recommendationTasks.push(CSCAI.getRecommendations(i, this.getPlayedChampions(historySortedByRoles[i], i % 5)));
        }
        for (let i = 0; i < 10; ++i) {
          this.currCsRecommendations[i] = await recommendationTasks[i];
          this.onCsUpdate('picks' + i);
        }
        this.currCsFirstRunComplete = true;
        this.ongoingProgressBar.taskCompleted();

        if (this.pendingCsChange == null && this.connectedToLcu && CsInput.readyToBeUploaded(this.currCsInput)) {
          this.uploadCurrentCS();
        }
      
      } finally {
        this.ongoingCsChange = false;
      }
      if (this.pendingCsChange == null) break;
    }
  }

  private reverseRoleSortIntoDict(sortedByRole: any[], roles: number[]) {
    const result = {};
    for (let i = 0; i < 5; ++i) {
      result[this.currCsInput.summonerNames[i]] = sortedByRole[roles[i]];
    }
    for (let i = 0; i < 5; ++i) {
      result[this.currCsInput.summonerNames[5 + i]] = sortedByRole[5 + roles[i]];
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
      inputView: this.currCsInputView,
      rolePrediction: this.currCsRolePrediction,
      lcuTiers: (this.currCsData || {}).lcuTiers || {},
      bans: this.currCsBans || {},
      score: this.currCsScore || {},
      missingScore: this.currCsMissingScores || {},
      history: this.currCsHistory || {},
      recommendations: this.currCsRecommendations || {},
    };
  }

  public setCsView(csView: any, editable: boolean) {
    //TODO
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
    const sId = (await CsDataFetcher.getSummoner(nr.region, nr.name)).summonerId; //Typically cached already
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
        csInput.blueSide = spect.result.participants.filter(p => p.summonerName == nr.name)[0].teamId == "100";
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
    const puuid = (await CsDataFetcher.getSummoner(nr.region, nr.name)).puuid;
    const data = this.getCsView(); //Need the full view to be able to load an old CS from personal tab

    //TODO: Add more data to view such as usage statistics here
    //TODO: Wrap this in error reporting

    const partialPrediction = data.inputView.blueSide ? data.score.bluePartialScore : data.score.redPartialScore;
    const fullPrediction = data.inputView.blueSide ? data.score.totalScore : 1 - data.score.totalScore;
    Aws.uploadPrediction(nr.region, puuid, JSON.stringify(data), partialPrediction, fullPrediction);
  }

}