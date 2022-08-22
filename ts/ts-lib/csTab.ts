import { CsManager } from "./csManager";
import { Logger } from "./logger";
import { Timer } from "./timer";


export class CsTab {

  public static MODE_IDLE: number = 0;
  public static MODE_LCU: number = 1;
  public static MODE_MANUAL: number = 2;
  public static MODE_STATIC: number = 3;
  private lcuCsManager: CsManager;
  private manualCsManager: CsManager;

  constructor() {
    //if mode matches then handle their callbacks and set view
    const that = this;
    const onNewCsLcu = () => that.onNewCsLcu();
    const onCsUpdateLcu = () => that.onCsUpdateLcu();
    const onNewCsManual = () => that.onNewCsManual();
    const onCsUpdateManual = () => that.onCsUpdateManual();
    this.lcuCsManager = new CsManager(true, onNewCsLcu, onCsUpdateLcu);
    this.manualCsManager = new CsManager(false, onNewCsManual, onCsUpdateManual);
   
    this.debug();
  }

  private async debug() {
    await Timer.wait(5000);
    let json = 'REDACTED';
    this.lcuCsManager.manualCsChange(JSON.parse(json));

  }

  private onNewCsLcu() {
    Logger.debug('NEW CS');
    Logger.debug(this.lcuCsManager.getCsView());
  }

  private onCsUpdateLcu() {
    Logger.debug('UPDATED CS');
    Logger.debug(this.lcuCsManager.getCsView());
  }

  private onNewCsManual() {
    
  }

  private onCsUpdateManual() {
    
  }

  public setMode(mode: number) {
    //Different modes print differently (can change region? can swap champions?)
    //TODO
    //Query the relevant csManager for its info and set view
  }


  private resetView(csView: any) {
    //TODO
  }

  private updateView(csUpdate: any) {
    //TODO
  }

}