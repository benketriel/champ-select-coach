import { CsData, CsInput } from "./csManager";
import { ErrorReporting } from "./errorReporting";

export class CSCAI {
  private static _pluginInstance: any = null;

  private static async instance() {
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

  public static async getPatchInfo() {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetPatchInfo(resolve))
    return json == null ? json : JSON.parse(json);
  }

  public static async getRolePredictions(csInput: CsInput) {
    const ai = await this.instance();
    const inputJSON = JSON.stringify(csInput);
    const json = await new Promise<any>(resolve => ai.GetRolePredictions(inputJSON, resolve));
    return json == null ? json : JSON.parse(json);
  }

  public static async prepareData(csInput: CsInput, csData: CsData) {
    const ai = await this.instance();
    const inputJSON = JSON.stringify(csInput);
    const dataJSON = JSON.stringify(csData);
    const json = await new Promise<any>(resolve => ai.PrepareData(inputJSON, dataJSON, resolve));
    return json == null ? json : JSON.parse(json);
  }

  public static async getBans() {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetBans(resolve));
    return json == null ? json : JSON.parse(json);
  }

  public static async getFullScore() {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetFullScore(resolve));
    return json == null ? json : JSON.parse(json);
  }
  
  public static async getPartialScore(blue: boolean) {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetPartialScore(blue, resolve));
    return json == null ? json : JSON.parse(json);
  }
  
  public static async getSoloScore(i: number) {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetSoloScore(i, resolve));
    return json == null ? json : JSON.parse(json);
  }
  
  public static async getMissingScore(i: number) {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetMissingScore(i, resolve));
    return json == null ? json : JSON.parse(json);
  }
  
  public static async getRecommendations(i: number, championIds: string[]) {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.GetRecommendations(i, championIds, resolve));
    return json == null ? json : JSON.parse(json);
  }
  
  public static async unzip(b64zip: string) {
    const ai = await this.instance();
    const json = await new Promise<any>(resolve => ai.Unzip(b64zip, resolve));
    return JSON.parse(json);
  }

}