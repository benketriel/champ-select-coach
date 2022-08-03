import { Logger } from "./logger";
import { Timer } from "./timer";



export class Updates {

  public static updateStates = {
    UpToDate: 'UpToDate',
    UpdateAvailable: 'UpdateAvailable',
    PendingRestart: 'PendingRestart',
  };

  public static async getUpdateState() {
    let res = await new Promise<overwolf.extensions.CheckForUpdateResult>(resolve => overwolf.extensions.checkForExtensionUpdate(resolve));
    let tries = 0;
    while (!res.success || !res.state) {
      await Timer.wait(1000);
      res = await new Promise<overwolf.extensions.CheckForUpdateResult>(resolve => overwolf.extensions.checkForExtensionUpdate(resolve));
      if (tries > 10) return null;
      tries++;
    }
    return res.state;
  }
  

  public static async update(){
    if (await this.getUpdateState() == this.updateStates.UpdateAvailable) {
      const updateRes = await new Promise(resolve => overwolf.extensions.updateExtension(resolve));
      Logger.log("App was updated with return message: " + JSON.stringify(updateRes));
      return true;
    }
  }

  public static async restartToApplyUpdate() {
    if (await this.getUpdateState() == this.updateStates.PendingRestart) {
      overwolf.extensions.relaunch();
    }
    return false;
  }

  public static async updateOnAppClose() {
    await Updates.update();
  }

}