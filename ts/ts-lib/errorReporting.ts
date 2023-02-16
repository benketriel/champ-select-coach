import { Aws } from "./aws";
import { Logger } from "./logger";
import { Popup } from "./popup";
import { TranslatedText } from "./textLanguage";

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
    let json = JSON.stringify({ type, data });
    /* await */ Logger.warn('⚠⚠⚠ Unexpected Error ⚠⚠⚠');
    /* await */ Logger.warn(json);
    if (json.length > 1000000) json = json.substring(0, 1000000); //In case something goes real wrong

    if (!(type in this.countByType)) {
      this.countByType[type] = 0;
    }
    this.countByType[type]++;
    if (this.countByType[type] > this.MAX_OF_SAME_TYPE) return;

    let region = 'KR';
    let name = '<Unknown reporter name>';
    let summonerId = '<Unknown reporter id>';
    if (this.LazyLcu && this.LazyCsDataFetcher) {
      try {
        const nameRegion = await this.LazyLcu.getCurrentNameAndRegion();
        if (nameRegion && nameRegion.name && nameRegion.region) {
          region = nameRegion.region;
          name = nameRegion.name;

          summonerId = await this.LazyCsDataFetcher.getSummonerIdByRegionAndName(region, name) || '';
        }
      } catch{}
    }

    await Aws.reportError(json, region, summonerId);

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
    ErrorReporting.report(type, {data, exception});
    Popup.message(TranslatedText.fatalError.english, TranslatedText.fatalErrorMsg.english);

  }

}