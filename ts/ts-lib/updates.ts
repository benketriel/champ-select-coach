import { Logger } from './logger';
import { Timer } from './timer';

export class Updates {
  public static updateStates = {
    UpToDate: 'UpToDate',
    UpdateAvailable: 'UpdateAvailable',
    PendingRestart: 'PendingRestart',
  };

  public static async getUpdateState() {
    let res = await new Promise<overwolf.extensions.CheckForUpdateResult>((resolve) => overwolf.extensions.checkForExtensionUpdate(resolve));
    let tries = 0;
    while (!res || !res.success || !res.state) {
      await Timer.wait(1000);
      res = await new Promise<overwolf.extensions.CheckForUpdateResult>((resolve) => overwolf.extensions.checkForExtensionUpdate(resolve));
      if (tries > 10) return null;
      tries++;
    }
    return res.state;
  }

  public static async update() {
    const updateRes = await new Promise((resolve) => overwolf.extensions.updateExtension(resolve));
    Logger.log('App was updated with return message: ' + JSON.stringify(updateRes));
    return updateRes;
  }

  public static async updateOnAppClose() {
    if ((await Updates.getUpdateState()) == 'UpdateAvailable') {
      await Updates.update();
    }
  }
}
