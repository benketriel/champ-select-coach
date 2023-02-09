import { windowNames, interestingFeatures } from "../../ts-lib/consts";
import { OWWindow } from '../../ts-lib/ow-window';
import { CSCAI } from "../../ts-lib/cscai";
import { Lcu } from '../../ts-lib/lcu';
import { Updates } from "../../ts-lib/updates";
import { ErrorReporting } from "../../ts-lib/errorReporting"; //Consider that this reporting may not connect to LCU nor CsDataFetcher
import { Logger } from "../../ts-lib/logger";
import { Timer } from "../../ts-lib/timer";
import { LocalStorage } from "../../ts-lib/localStorage";

class BackgroundController {
  private static _instance: BackgroundController;
  private _windows = {};

  public static instance(): BackgroundController {
    return BackgroundController._instance = BackgroundController._instance || new BackgroundController();
  }

  private constructor() {
    Logger.log("BackgroundController begin");
    this._windows[windowNames.background] = new OWWindow(windowNames.background);
    this._windows[windowNames.mainWindow] = new OWWindow(windowNames.mainWindow);

    const that = this;
    //Set required features when LCU starts
    const onLcuLaunch = async () => { 
      await Lcu.setRequiredFeatures([interestingFeatures.game_flow, interestingFeatures.champ_select, interestingFeatures.lcu_info]);
      if (LocalStorage.getAutoOpenMode() == 0) await that.run();
    };
    overwolf.games.launchers.onLaunched.removeListener(onLcuLaunch);
    overwolf.games.launchers.onLaunched.addListener(onLcuLaunch);
    overwolf.games.launchers.getRunningLaunchersInfo(info => { if (Lcu.isLcuRunningFromInfo(info)) { onLcuLaunch(); }});

    //Trigger run() when the app is manually launched
    const onLaunch = async (event: overwolf.extensions.AppLaunchTriggeredEvent) => { await that.run();};
    overwolf.extensions.onAppLaunchTriggered.removeListener(onLaunch);
    overwolf.extensions.onAppLaunchTriggered.addListener(onLaunch);

    //Listen for champion select
    const handleInfoUpdateEvent = async (event: any) => await that.handleInfoUpdateEvent(event);
    overwolf.games.launchers.events.onInfoUpdates.removeListener(handleInfoUpdateEvent);
    overwolf.games.launchers.events.onInfoUpdates.addListener(handleInfoUpdateEvent);
    overwolf.games.launchers.events.onNewEvents.removeListener(handleInfoUpdateEvent);
    overwolf.games.launchers.events.onNewEvents.addListener(handleInfoUpdateEvent);

    //Log errors
    const reportError = (info: overwolf.games.events.ErrorEvent) => ErrorReporting.report('overwolf.games.events.onError', JSON.stringify(info));
    overwolf.games.events.onError.removeListener(reportError);
    overwolf.games.events.onError.addListener(reportError);

    //Closing
    const handleCloseMessage = (event: any) => that.handleCloseMessage(event);
    overwolf.windows.onMessageReceived.removeListener(handleCloseMessage);
    overwolf.windows.onMessageReceived.addListener(handleCloseMessage);
    
    /* await */ this.ensureModelLoads();
  };

  private async ensureModelLoads() {
    const info = await CSCAI.getPatchInfo();
    if (info == null) {
      alert("Fatal error, some required app files are missing. Try reinstalling the app. The app will now exit.");

      this._windows[windowNames.mainWindow].close();
      await Updates.updateOnAppClose();
      ErrorReporting.report('CSCAI.dll', 'Failed to load CSCAI.dll');
      await Timer.wait(5000); //await in case close kills it
      overwolf.windows.close(windowNames.background);
      return; // This line shouldn't happen
    }
    Logger.log("CSCAI loaded successfully");
  }

  private handleCloseMessage = async (message: overwolf.windows.MessageReceivedEvent) => { 
    if (message.id === 'close') {
      this._windows[windowNames.mainWindow].close();

      overwolf.games.launchers.getRunningLaunchersInfo(async info => { 
        if (!Lcu.isLcuRunningFromInfo(info)) { 
          await Updates.updateOnAppClose();
          overwolf.windows.close(windowNames.background);
        }
      });
    }
  }

  public async run() {
    const scoreWinState = (await this._windows[windowNames.mainWindow].getWindowState()).window_state_ex;
    Logger.log('run state: ' + JSON.stringify(scoreWinState));
    if (scoreWinState == 'closed' || scoreWinState == 'hidden') { //(but not if minimized)
      this._windows[windowNames.mainWindow].restore();
      await BackgroundController.waitForWindowToOpen(this._windows[windowNames.mainWindow]);
    }

    if (LocalStorage.getAutoFocusCs()) {
      this._windows[windowNames.mainWindow].setTopmost();
    }
  }

  public static async waitForWindowToOpen(w: OWWindow) {
    let i = 0;
    while (++i < 500 && (await w.getWindowState()).window_state_ex == 'closed') {
      await Timer.wait(100);
    }
  }

  private _inChampSelect = false; //Need this in case they manually close window, don't want it to pop up until next champ select
  private async handleInfoUpdateEvent(event: any) {
    if (event && event.feature == "game_flow" && event.info && event.info.game_flow && event.info.game_flow.phase) {
      const phaseCS = event.info.game_flow.phase == "ChampSelect";
      const queueOK = phaseCS && await Lcu.inChampionSelect();
      
      if (phaseCS && !this._inChampSelect && LocalStorage.getAutoOpenMode() != 2) {
        if (!queueOK) {
          Logger.log('Current champion select queue not supported, ignoring event:');
          Logger.log(JSON.stringify(event));
        } else {
          /* await */ this.run();
        }
      }

      this._inChampSelect = queueOK;
    } else {
      Logger.log('An ignored event received:');
      Logger.log(JSON.stringify(event));
    }
  }

}

const _instance = BackgroundController.instance();
if (LocalStorage.getAutoOpenMode() == 0) /* await */ _instance.run();
