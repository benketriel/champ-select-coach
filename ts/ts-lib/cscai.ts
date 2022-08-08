import { ErrorReporting } from "./errorReporting";

export class CSCAI {
  private static _pluginInstance: any = null;

  public static async instance() {
    if (this._pluginInstance == null) {
      await new Promise(resolve => CSCAI._initialize(resolve));
    }
    return this._pluginInstance;
  }  

  private static _initialize(callback) {
    var proxy = null;

    try {
      proxy = overwolf.extensions.current.getExtraObject;
    } catch(e) {
      ErrorReporting.report('overwolf.extensions.current.getExtraObject', "overwolf.extensions.current.getExtraObject doesn't exist!");
      return callback(false);
    }

    proxy('CSCAI', function(result) {
      if (result.status != "success") {
        ErrorReporting.report('CSAI.dll', "failed to create " + 'CSCAI' + " object: " + JSON.stringify(result));
        return callback(false);
      }

      CSCAI._pluginInstance = result.object;

      return callback(true);
    });
  }

  public newTask(matchSample: any, variantInfo: any, computeBans: boolean, playedChampions: any[]) {
    //sample has all the info
    //variant says if it's blue, red, or both
    //if computing bans, check the odds for each champ to be in a lane, then if above threshold check that variant for bans
    //playedChampions tells what recommendations to try
    //the rest happens in C#, and results are returned on subsequent calls to getNextResult(taskId)
    //return taskId
  }

  public cancelTask(taskId: string) {
    //TODO
  }

  public getNextTaskResult(taskId: string) {
    //TODO
  }

  
}