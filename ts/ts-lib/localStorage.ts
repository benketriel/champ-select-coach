


export class LocalStorage {

    private static get(key: string) {
        return localStorage.getItem(key);
    }

    private static set(key: string, value: string) {
        localStorage.setItem(key, value);
    }
    
    public static getProgressBarStats() { return JSON.parse(LocalStorage.get('progress-bar-stats')) || {}; }
    public static setProgressBarStats(stats: any) { LocalStorage.set('progress-bar-stats', JSON.stringify(stats)); }


}