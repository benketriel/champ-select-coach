import { interestingFeatures } from "./consts";
import { Lcu } from "./lcu";


export class CsManager {
  public connectedToLcu: boolean = false;
  public onNewCs: any;
  public onCsUpdate: any;

  constructor(connectedToLcu: boolean, onNewCs: any, onCsUpdate: any) {
    this.connectedToLcu = connectedToLcu;
    this.onNewCs = onNewCs;
    this.onCsUpdate = onCsUpdate;

    if (this.connectedToLcu) {
      //Set required features when LCU starts
      const setRequiredFeatures = () => { Lcu.setRequiredFeatures([interestingFeatures.game_flow]); };
      overwolf.games.launchers.onLaunched.removeListener(setRequiredFeatures);
      overwolf.games.launchers.onLaunched.addListener(setRequiredFeatures);
      overwolf.games.launchers.getRunningLaunchersInfo(info => { if (Lcu.isLcuRunningFromInfo(info)) { setRequiredFeatures(); }});

      //Listen for champion select
      overwolf.games.launchers.events.onInfoUpdates.removeListener(this.handleLcuEvent);
      overwolf.games.launchers.events.onInfoUpdates.addListener(this.handleLcuEvent);
      overwolf.games.launchers.events.onNewEvents.removeListener(this.handleLcuEvent);
      overwolf.games.launchers.events.onNewEvents.addListener(this.handleLcuEvent);
    }
  }

  public manualCsChange() {
    //TODO
    //call handleCsChange()
  }

  private handleLcuEvent(event: any) {
    //TODO
    //call handleCsChange()
  }

  private handleCsChange() {
    //TODO
    //Interrupt previous job
    //Get tiers if needed from LCU
    //Get summoner, history (and tiers?) from AWS if needed
    //Build the MatchSample
    //Create new job at CscAI and read results
    //  Creating a new job here automatically interrupts old ones, and subsequent GetNextResult(jobId) calls will get from this job
    //Each progression call onCsUpdate or onNewCs if new
  }

  public getCsView() {
    //TODO
    //Returns JSON
  }

  public getComputationProgress() {
    //TODO
    //Returns what tasks are done, which are remaining, and how long time on current task so far
  }




}