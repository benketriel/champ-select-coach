import { Aws } from "./aws";
import { CSCAI } from "./cscai";
import { CsData, CsInput } from "./csManager";
import { CsTab } from "./csTab";
import { Lcu } from "./lcu";
import { Utils } from "./utils";

export class Cache {
  public size: number;
  public timeoutMinutes: number;
  public items = {};
  public timestamp = {};

  constructor(size: number, timeoutMinutes: number) {
    this.size = size;
    this.timeoutMinutes = timeoutMinutes;
  }

  public async insert(key: string, item: any) {
    this.items[key] = item;
    this.timestamp[key] = Date.now();
    
    const keys = Object.keys(this.items);
    if (keys.length > this.size) {
      let minK = keys[0];
      for(const k of keys) {
        if (this.timestamp[k] < this.timestamp[minK]) {
          minK = k;
        }
      }
      delete this.items[minK];
      delete this.timestamp[minK];
    }

    return item;
  }

  public async getOrNull(key: string) {
    if (key in this.items) {
      const ts = this.timestamp[key];
      if (Date.now() - ts <= this.timeoutMinutes * 60 * 1000) {
        return this.items[key];
      }
    }
    return null;
  }

}


export class CsDataFetcher {
  
  private static summonerCache = new Cache(100, 24 * 60);
  private static matchCache = new Cache(2000, 24 * 60); //2KB each

  private static historyCache = new Cache(100, 5);
  private static masteryCache = new Cache(100, 24 * 60);
  private static awsSoloQTierCache = new Cache(100, 24 * 60);
  private static awsFlexTierCache = new Cache(100, 24 * 60);
  private static lcuTierCache = new Cache(100, 5);

  public static async getSummoner(region: string, name: string) {
    return null;
  }

  public static async getCsData(patchInfo:any, csInput: CsInput) {
    const currCsData = new CsData();
    
    //Group calls to make less calls to AWS?
    currCsData.summonerInfo = await this.cacheAndFetch(csInput.region, csInput.summonerNames, true, this.summonerCache, Aws.getSummoners);  //API call (slow)
    const puuids = csInput.summonerNames.map(x => (currCsData.summonerInfo[x] || {}).puuid || "");
    const summonerIds = csInput.summonerNames.map(x => (currCsData.summonerInfo[x] || {}).id || "");

    const isFlex = CsTab.isFlex(patchInfo, csInput.queueId);
    const masteriesTask = this.cacheAndFetch(csInput.region, summonerIds, false, this.masteryCache, Aws.getMasteries); //DB
    const tiersTask = this.cacheAndFetch(csInput.region, summonerIds, false, isFlex ? this.awsFlexTierCache : this.awsSoloQTierCache, 
      (region: string, sIds: string[]) => Aws.getTiers(region, !isFlex, sIds)); //DB
    
    const historiesByPuuid = await this.cacheAndFetch(csInput.region, puuids, true, this.historyCache, Aws.getHistories); //API call (slow)
    const matchIds = <string[]>[...new Set(Utils.flattenArray(Object.keys(historiesByPuuid).map(x => historiesByPuuid[x])))];

    currCsData.matches =  await this.cacheAndFetch(csInput.region, matchIds, false, this.matchCache, Aws.getMatches); //API+DB (slow)
    const masteriesBySummonerId =  await masteriesTask;
    const tiersBySummonerId =  await tiersTask;

    //Make the dictionaries by name instead
    currCsData.histories = {};
    currCsData.masteries = {};
    currCsData.tiers = {};
    
    for (let name of csInput.summonerNames) {
      if (name in currCsData.summonerInfo) {
        const info = currCsData.summonerInfo[name];
        currCsData.histories[name] = historiesByPuuid[info.puuid];
        currCsData.masteries[name] = masteriesBySummonerId[info.id];
        currCsData.tiers[name] = tiersBySummonerId[info.id];
      } else {
        currCsData.histories[name] = [];
        currCsData.masteries[name] = {};
        currCsData.tiers[name] = [];
      }
    }

    //Get LCU tiers
    const lcuTiers = await this.cacheAndFetch(csInput.region, csInput.summonerNames, false, this.lcuTierCache, (region: string, sIds: string[]) => Lcu.getSummonersTierByName(sIds));
    currCsData.lcuTiers = {};
    for (let name in lcuTiers) {
      currCsData.lcuTiers[name] = CsDataFetcher.parseLCUTier(patchInfo, lcuTiers[name], csInput.queueId);
    }

    return currCsData;
  }

  public static parseLCUTier(patchInfo:any, lcuTier: any, queueId: string) {
    let tier = '';
    let division = '';
    let lp = '';
    if (lcuTier) {
      const hasSoloTier = lcuTier.queueMap && lcuTier.queueMap.RANKED_SOLO_5x5 && lcuTier.queueMap.RANKED_SOLO_5x5.tier;
      const hasFlexTier = lcuTier.queueMap && lcuTier.queueMap.RANKED_FLEX_SR && lcuTier.queueMap.RANKED_FLEX_SR.tier;
      const isSoloGame = queueId in patchInfo.SoloQueueTypeIds;
  
      if (!isSoloGame && hasFlexTier) {
        tier = lcuTier.queueMap.RANKED_SOLO_5x5.tier.toLocaleLowerCase();
        division = lcuTier.queueMap.RANKED_SOLO_5x5.division;
        lp = lcuTier.queueMap.RANKED_SOLO_5x5.leaguePoints;
      } else if (isSoloGame && hasSoloTier) {
        tier = lcuTier.queueMap.RANKED_FLEX_SR.tier.toLocaleLowerCase();
        division = lcuTier.queueMap.RANKED_FLEX_SR.division;
        lp = lcuTier.queueMap.RANKED_FLEX_SR.leaguePoints;
      }
      if (lcuTier && lcuTier.highestRankedEntry && lcuTier.highestRankedEntry.tier && ["iron", "bronze", "silver", "gold", "platinum", "diamond", "master", "grandmaster", "challenger"].includes(tier)) {
        if (["master", "grandmaster", "challenger"].includes(tier)) {
          division = '';
        }
      } else {
        tier = '';
        division = '';
        lp = '';
      }
    }
    return { tier, division, lp };
  }

  private static async cacheAndFetch(region: string, keys: string[], jsonParse: boolean, cache: Cache, fetch: any) {
    const missing = [];
    const res = {};
    for (let k of keys) {
      if (k == null || k == '') continue;
      const x = await cache.getOrNull(region + k);
      if (x == null) missing.push(k);
      else res[k] = x;
    }
    if (missing.length > 0) {
      const obj = (await fetch(region, missing));
      if (obj && obj.result) {
        const fetched = obj.result;
        for (let k in fetched) {
          let item = fetched[k];
          if (jsonParse) {
            item = JSON.parse(item);
          }
          res[k] = item;
          await cache.insert(region + k, item);
        }
      }
    }
    return res;
  }


}