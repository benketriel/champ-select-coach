import { version } from "./consts";
import { CSCAI } from "./cscai";
import * as $ from "jquery";
import { ErrorReporting } from "./errorReporting";
import { Timer } from "./timer";
import { Logger } from "./logger";
import { Popup } from "./popup";
import { TranslatedText } from "./textLanguage";


export class CscApi {

  private static URL = 'http://174.138.111.148/gate';

  public static async getSummoners(region: string, summonerNames: string[]) {
    const msg = {Action:"RubyGetSummoners", Arguments:{region, summonerNames:summonerNames.join(',')}};
    const res = await CscApi.retrying({region, summonerNames, name:'getSummoners'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyGetMasteries", Arguments:{region, summonerIds:summonerIds.join(',')}};
    const res = await CscApi.retrying({region, summonerIds, name: 'getMasteries'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyGetTiers", Arguments:{region, soloQueue: soloQueue ? 'true' : 'false', summonerIds:summonerIds.join(',')}};
    const res = await CscApi.retrying({region, soloQueue, summonerIds, name: 'getTiers'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyGetHistories", Arguments:{region, puuids:puuids.join(',')}};
    const res = await CscApi.retrying({region, puuids, name: 'getHistories'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyGetRubyMatchesById", Arguments:{region, matchIds:matchIds.join(',')}};
    const res = await CscApi.retrying({region, matchIds, name: 'getMatches'}, 2, () => CscApi.get(msg), r => {
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
        invalidMatchIds: r && r.invalidMatchIds ? r.invalidMatchIds : [],
        skippedMatchIds: r && r.skippedMatchIds ? r.skippedMatchIds : [],
      });
      return true;
    });
    return res;
  }

  public static async getRunningGame(region: string, summonerId: string) {
    const msg = {Action:"RubyGetSpectator", Arguments:{region, summonerId}};
    const res = await CscApi.retrying({region, summonerId, name: 'getRunningGame'}, 1, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyUploadPrediction", Arguments:{region, puuid, version, data, partialPrediction, fullPrediction}};
    const res = await CscApi.retrying({region, puuid, data, partialPrediction, fullPrediction, name: 'uploadPrediction'}, 5, () => CscApi.get(msg), r => {
      if (r == "OK") Logger.log("Uploaded prediction");
      else ErrorReporting.report("uploadPrediction", {r});
      return r == "OK";
    });

    return res;
  }

  public static async getCscHistory(region: string, puuid: string) {
    const msg = {Action:"RubyGetCscHistory", Arguments:{ region, puuid }};
    const res = await CscApi.retrying({region, puuid, name: 'getCscHistory'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyGetHistogram", Arguments:{}};
    const res = await CscApi.retrying({name:'getCscHistogram'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyFeedback", Arguments:{ json }};
    const res = await CscApi.retrying({json, name: 'feedback'}, 1, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyGetDynamicSettings", Arguments:{ name }};
    const res = await CscApi.retrying({name, name_:'getSetting'}, 5, () => CscApi.get(msg), r => {
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
    const msg = {Action:"RubyReportError", Arguments:{ json, region, reporterSummonerId }};
    const res = await CscApi.retrying(null, 2, () => CscApi.get(msg), r => {
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
      ErrorReporting.report('CscApi.retrying', uploadIfError);
    }
    return null;
  }

  private static failedGetInARow = 0;
  private static shownDisconnected = false;
  public static async get(cscMessage: any) {
    const data = await CSCAI.zip(cscMessage);
    let r = await new Promise<any>(resolve => {
      
      $.ajax({
        url: CscApi.URL,
        type: 'POST',
        data: data,
        processData: false,
        success: function(res) { 
          CscApi.shownDisconnected = false;
          CscApi.failedGetInARow = 0;
          resolve(res); 
        },
        error: function(res) { 
          if (res.status == 0 && !CscApi.shownDisconnected) {
            CscApi.shownDisconnected = true;
            Popup.message(TranslatedText.error.english, TranslatedText.disconnected.english);
          }
          if (res.status != 0) {
            CscApi.failedGetInARow++;
            if (CscApi.failedGetInARow > 10) {
              CscApi.failedGetInARow = -100; //Cooldown
              ErrorReporting.report('CscApi request', JSON.stringify({res, data}));
            }
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

