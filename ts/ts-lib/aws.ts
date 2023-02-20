import { version } from "./consts";
import { CSCAI } from "./cscai";
import * as $ from "jquery";
import { ErrorReporting } from "./errorReporting";
import { Timer } from "./timer";
import { Logger } from "./logger";

export class Aws {
  
  // private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGate';
  // private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGateTest';
  private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGateRuby';


  public static async getSummoners(region: string, summonerNames: string[]) {
    const msg = JSON.stringify({Action:"RubyGetSummoners", Arguments:{region, summonerNames:summonerNames.join(',')}});
    const res = await Aws.retrying({region, summonerNames, name:'getSummoners'}, 5, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getSummoners',
        millisTaken: r.millis,
        queriedAmount: summonerNames.length,
        returnedAmount: Object.keys(r.result).length,
        missing: summonerNames.filter(x => r.result[x] === undefined),
      });
      return true;
    });
    return res;
  }

  public static async getMasteries(region: string, summonerIds: string[]) {
    const msg = JSON.stringify({Action:"RubyGetMasteries", Arguments:{region, summonerIds:summonerIds.join(',')}});
    const res = await Aws.retrying({region, summonerIds, name: 'getMasteries'}, 5, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getMasteries',
        millisTaken: r.millis,
        queriedAmount: summonerIds.length,
        returnedAmount: Object.keys(r.result).length,
        missing: summonerIds.filter(x => r.result[x] === undefined),
      });
      return true;
    });
    return res;
  }

  public static async getTiers(region: string, soloQueue: boolean, summonerIds: string[]) {
    const msg = JSON.stringify({Action:"RubyGetTiers", Arguments:{region, soloQueue: soloQueue ? 'true' : 'false', summonerIds:summonerIds.join(',')}});
    const res = await Aws.retrying({region, soloQueue, summonerIds, name: 'getTiers'}, 5, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getTiers',
        millisTaken: r.millis,
        queriedAmount: summonerIds.length,
        returnedAmount: Object.keys(r.result).length,
        missing: summonerIds.filter(x => r.result[x] === undefined),
      });
      return true;
    });
    return res;
  }

  public static async getHistories(region: string, puuids: string[]) {
    const msg = JSON.stringify({Action:"RubyGetHistories", Arguments:{region, puuids:puuids.join(',')}});
    const res = await Aws.retrying({region, puuids, name: 'getHistories'}, 5, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getHistories',
        millisTaken: r.millis,
        queriedAmount: puuids.length,
        returnedAmount: Object.keys(r.result).length,
        missing: puuids.filter(x => r.result[x] === undefined),
      });
      return true;
    });
    return res;
  }

  public static async getMatches(region: string, matchIds: string[]) {
    const msg = JSON.stringify({Action:"RubyGetRubyMatchesById", Arguments:{region, matchIds:matchIds.join(',')}});
    const res = await Aws.retrying({region, matchIds, name: 'getMatches'}, 2, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getMatches',
        queriedAmount: matchIds.length,
        returnedAmount: Object.keys(r.result).length,
        missing: matchIds.filter(x => r.result[x] === undefined),
        apiReadMillis: r.apiReadMillis,
        dbReadMillis: r.dbReadMillis,
        dbWriteMillis: r.dbWriteMillis,
        fromApi: r.fromApi,
        fromDb: r.fromDb,
        millis: r.millis,
        parseMillis: r.parseMillis,
        totalMissing: r.totalMissing,
      });
      return true;
    });
    return res;
  }

  public static async getRunningGame(region: string, summonerId: string) {
    const msg = JSON.stringify({Action:"RubyGetSpectator", Arguments:{region, summonerId}});
    const res = await Aws.retrying({region, summonerId, name: 'getRunningGame'}, 1, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getRunningGame',
        millisTaken: r.millis,
        queried: summonerId,
      });
      return true;
    });
    return res;
  }

  public static async uploadPrediction(region: string, puuid: string, data: string, partialPrediction: string, fullPrediction: string) {
    const msg = JSON.stringify({Action:"RubyUploadPrediction", Arguments:{region, puuid, version, data, partialPrediction, fullPrediction}});
    const res = await Aws.retrying({region, puuid, data, partialPrediction, fullPrediction, name: 'uploadPrediction'}, 5, () => Aws.get(msg), r => {
      if (r == "OK") Logger.log("Uploaded prediction");
      else ErrorReporting.report("uploadPrediction", {r});
      return r == "OK";
    });

    return res;
  }

  public static async getCscHistory(region: string, puuid: string) {
    const msg = JSON.stringify({Action:"RubyGetCscHistory", Arguments:{ region, puuid }});
    const res = await Aws.retrying({region, puuid, name: 'getCscHistory'}, 5, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getCscHistory',
        millisTaken: r.millis,
        queried: puuid,
      });
      return true;
    });
    return res;
  }

  public static async getCscHistogram() {
    const msg = JSON.stringify({Action:"RubyGetHistogram", Arguments:{}});
    const res = await Aws.retrying({name:'getCscHistogram'}, 5, () => Aws.get(msg), r => {
      if (!r || !r.result) return false;
      Logger.log({
        name: 'getCscHistogram',
        millisTaken: r.millis,
      });
      return true;
    });
    return res;
  }

  public static async feedback(json: string) {
    const msg = JSON.stringify({Action:"RubyFeedback", Arguments:{ json }});
    const res = await Aws.retrying({json, name: 'feedback'}, 1, () => Aws.get(msg), r => {
      if (!r || r != 'OK') return false;
      Logger.log({
        name: 'feedback',
        result: r,
        json,
      });
      return true;
    });
    return res;
  }

  public static async getSetting(name: string) {
    const msg = JSON.stringify({Action:"RubyGetDynamicSettings", Arguments:{ name }});
    const res = await Aws.retrying({name, name_:'getSetting'}, 5, () => Aws.get(msg), r => {
      if (!r) return false;
      Logger.log({
        name: 'getSetting',
        result: r,
        settingName: name,
      });
      return true;
    }, 30000);
    return res;
  }

  public static async reportError(json: string, region: string, reporterSummonerId: string) {
    const msg = JSON.stringify({Action:"RubyReportError", Arguments:{ json, region, reporterSummonerId }});
    const res = await Aws.retrying(null, 2, () => Aws.get(msg), r => {
      if (!r || r != 'OK') return false;
      Logger.log({
        name: 'reportError',
        json,
        region,
        reporterSummonerId,
      });
      return true;
    });
    return res;
  }

  public static async retrying(uploadIfError: any, tries: number, generate, validate, waitMs: number = 3000) {
    while (tries-- > 0) {
      const res = await generate();
      if (await validate(res)){
        // Logger.debug(res);
        return res;
      }
      await Timer.wait(waitMs);
    }
    if (uploadIfError) { //Prevent infinite loop when failed to upload
      ErrorReporting.report('Aws.retrying', uploadIfError);
    }
    return null;
  }

  private static failedGetInARow = 0;
  public static async get(data: string) {
    let r = await new Promise<any>(resolve => {
      $.ajax({
        url: Aws.URL, 
        type: 'POST',
        data: data,
        dataType: "text",
        success: function(res) { 
          Aws.failedGetInARow = 0;
          resolve(res); 
        },
        error: function(res) { 
          Aws.failedGetInARow++;
          if (Aws.failedGetInARow > 10) {
            Aws.failedGetInARow = -100; //Cooldown
            ErrorReporting.report('AWS request', JSON.stringify({res, data}));
          }
          resolve(null);
        }
      });
    });
    if (r != null) {
      r = await CSCAI.unzip(r);
    }
    return r;
  }
  
  

}

