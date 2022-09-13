import { CSCAI } from "./cscai";



export class LocalStorage {

  private static get(key: string) {
    return localStorage.getItem(key);
  }

  private static set(key: string, value: string) {
    localStorage.setItem(key, value);
  }
    
  public static getProgressBarStats() { return JSON.parse(LocalStorage.get('progress-bar-stats')) || {}; }
  public static setProgressBarStats(stats: any) { LocalStorage.set('progress-bar-stats', JSON.stringify(stats)); }

  public static async getCsHistory() { 
    const zipped = LocalStorage.get('cs-history');
    if (!zipped) return [];
    const h = JSON.parse(await CSCAI.unzip(zipped));
    if (!h || !Array.isArray(h)) return [];
    return h;
  }
  public static async setCsHistory(history: any[]) { 
    LocalStorage.set('cs-history', await CSCAI.zip(JSON.stringify(history)));
  }


}