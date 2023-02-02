import { Aws } from "./aws";
import { LocalStorage } from "./localStorage";
import { Timer } from "./timer";


export class DynamicSettings {
  private POLLING_INTERVAL_MS: number = 1000 * 60 * 60;
  private onStatusUpdate: any = null;
  private currStatus: string = null;
  
  constructor(onStatusUpdate: any) {
    this.onStatusUpdate = onStatusUpdate;
    /* await */ this.pollForStatusUpdates();
  }

  public async pollForStatusUpdates() { 
    while (true) {
      const oldStatus = this.currStatus;
      this.currStatus = await Aws.getSetting('status');
      if (oldStatus == null || oldStatus != this.currStatus) {
        this.onStatusUpdate(this.currStatus);
      }
      await Timer.wait(this.POLLING_INTERVAL_MS);
    }
  }

  public getCurrentStatus() {
    return this.currStatus;
  }


}