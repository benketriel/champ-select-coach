import { version } from './consts';
import { CscApi } from './cscApi';
import { Logger } from './logger';
import { Popup } from './popup';
import { TranslatedText } from './textLanguage';

//Cannot import these or it won't compile due to circular dependency:
//import { Lcu } from "./lcu";
//import { CsDataFetcher } from "./csDataFetcher";

export class ErrorReporting {
  private static countByType = {};
  private static MAX_OF_SAME_TYPE = 5; //Protection from infinite loops
  public static LazyLcu = null;
  public static LazyCsDataFetcher = null;

  public static report(type: string, data: any) {
    /* await */ ErrorReporting.reportAsync(type, data);
  }

  public static async reportAsync(type: string, data: any) {
    for (const key of Object.keys(data)) {
      if (data[key].message && data[key].stack && !data[key].messageStr && !data[key].stackStr) {
        data[key].messageStr = data[key].message.toString();
        data[key].stackStr = data[key].stack.toString();
      }
    }
    let json = JSON.stringify({ type, data, version });
    /* await */ Logger.warn('⚠⚠⚠ Unexpected Error ⚠⚠⚠');
    /* await */ Logger.warn(json);
    if (json.length > 1000000) json = json.substring(0, 1000000); //In case something goes real wrong

    if (!(type in this.countByType)) {
      this.countByType[type] = 0;
    }
    this.countByType[type]++;
    if (this.countByType[type] > this.MAX_OF_SAME_TYPE) return;

    let region = '<Unknown region>';
    let riotID = '<Unknown reporter riotID>';
    let puuid = '<Unknown reporter puuid>';
    if (this.LazyLcu) {
      try {
        const curr = await this.LazyLcu.getCurrentRiotIDAndRegion();
        if (curr && curr.riotID && curr.region) {
          region = curr.region;
          riotID = curr.riotID;

          if (this.LazyCsDataFetcher) {
            const accounts = await this.LazyCsDataFetcher.cacheAndFetch(region, [riotID], true, this.LazyCsDataFetcher.accountCache, CscApi.getAccountsByRiotId);
            puuid = (accounts[riotID] || {}).puuid || '';
          }
        }
      } catch {}
    }

    await CscApi.reportError(json, region, puuid);

    return;
  }

  public static async reportIfException(func: any, type: string, data: any) {
    let exception = null;
    for (let tryI = 0; tryI < 1; tryI++) {
      try {
        return await func();
      } catch (ex) {
        exception = ex;
      }
    }
    ErrorReporting.report(type, { data, exception });
    Popup.message(TranslatedText.fatalError.english, TranslatedText.fatalErrorMsg.english);
  }
}
