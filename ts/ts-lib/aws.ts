import { version } from "./consts";
import { CSCAI } from "./cscai";
import * as $ from "jquery";
import { ErrorReporting } from "./errorReporting";

export class Aws {
  
  private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGate';
  // private static URL = 'https://i0usojya1l.execute-api.us-east-2.amazonaws.com/cscGateTest';

  public static async getMatches(region: string, matchIds: string[]) {
    return await Aws.get(JSON.stringify({Action:"RubyGetRubyMatchesById", Arguments:{region, matchIds:matchIds.join(',')}}));
  }

  public static async get(data: string) {
    let r = await new Promise<any>(resolve => {
      $.ajax({
        url: Aws.URL, 
        type: 'POST',
        data: data,
        dataType: "text",
        success: function(res)
        {
          resolve(res);
        },
        error: function(res)
        {
          ErrorReporting.report('AWS request', JSON.stringify({res, data}));
          resolve(null);
        }
      });
    });
    if (r != null) {
      const model = await CSCAI.instance();
      r = await new Promise<any>(resolve => model.Unzip(r, resolve));
      r = JSON.parse(r);
    }
    return r;
  }
  
  

}

