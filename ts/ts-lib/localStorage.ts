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

  public static getAutoOpenMode() { return parseInt(LocalStorage.get('auto-open-mode') || '0'); }
  public static setAutoOpenMode(mode: number) { LocalStorage.set('auto-open-mode', mode.toString()); }

  public static getAutoFocusCs() { return (LocalStorage.get('auto-focus-cs') || 't') == 't'; }
  public static setAutoFocusCs(mode: boolean) { LocalStorage.set('auto-focus-cs', mode ? 't' : 'f'); }

  public static getSingleThreadedMode() { return (LocalStorage.get('single-threaded-mode') || 'f') == 't'; }
  public static setSingleThreadedMode(mode: boolean) { LocalStorage.set('single-threaded-mode', mode ? 't' : 'f'); }

  

}