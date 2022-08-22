import { version } from "./consts";
import { CSCAI } from "./cscai";
import * as $ from "jquery";
import { ErrorReporting } from "./errorReporting";
import { Timer } from "./timer";
import { Logger } from "./logger";

export class Aws {
  
  // private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGate';
  private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGateTest';


  public static async getSummoners(region: string, summonerNames: string[]) {
    const msg = JSON.stringify({Action:"RubyGetSummoners", Arguments:{region, summonerNames:summonerNames.join(',')}});
    const res = await Aws.retrying(10, () => Aws.get(msg), r => r != null);
    return res;
  }

  public static async getMasteries(region: string, summonerIds: string[]) {
    const msg = JSON.stringify({Action:"RubyGetMasteries", Arguments:{region, summonerIds:summonerIds.join(',')}});
    const res = await Aws.retrying(10, () => Aws.get(msg), r => r != null);
    return res;
  }

  public static async getTiers(region: string, queueId: string, summonerIds: string[]) {
    const msg = JSON.stringify({Action:"RubyGetTiers", Arguments:{region, queueId, summonerIds:summonerIds.join(',')}});
    const res = await Aws.retrying(10, () => Aws.get(msg), r => r != null);
    return res;
  }

  public static async getHistories(region: string, puuids: string[]) {
    const msg = JSON.stringify({Action:"RubyGetHistories", Arguments:{region, puuids:puuids.join(',')}});
    const res = await Aws.retrying(10, () => Aws.get(msg), r => r != null);
    return res;
  }

  public static async getMatches(region: string, matchIds: string[]) {
    const msg = JSON.stringify({Action:"RubyGetRubyMatchesById", Arguments:{region, matchIds:matchIds.join(',')}});
    const res = await Aws.retrying(10, () => Aws.get(msg), r => r != null);
    return res;
  }

  public static async getRunningGame(region: string, summonerId: string) {
    const msg = JSON.stringify({Action:"RubyGetSpectator", Arguments:{region, summonerId}});
    const res = await Aws.retrying(1, () => Aws.get(msg), r => r != null);
    return res;
  }

  public static async uploadPrediction(region: string, puuid: string, data: string, partialPrediction: string, fullPrediction: string) {
    const msg = JSON.stringify({Action:"RubyUploadPrediction", Arguments:{region, puuid, version, data, partialPrediction, fullPrediction}});
    const res = await Aws.retrying(5, () => Aws.get(msg), r => {
      if (r == "OK") Logger.log("Uploaded prediction");
      else ErrorReporting.report("uploadPrediction", JSON.stringify(res));
      return r == "OK";
    });

    return res;
  }

  private static async retrying(tries: number, generate, validate, waitMs: number = 100) {
    while (tries-- > 0) {
      const res = await generate();
      if (await validate(res)) return res;
      await Timer.wait(waitMs);
    }
    return null;
  }

  public static async get(data: string) {
    let r = await new Promise<any>(resolve => {
      $.ajax({
        url: Aws.URL, 
        type: 'POST',
        data: data,
        dataType: "text",
        success: function(res) { resolve(res); },
        error: function(res) { 
          ErrorReporting.report('AWS request', JSON.stringify({res, data}));
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

