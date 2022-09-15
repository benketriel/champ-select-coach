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

  public static async getPuuidByRegionAndName(region: string, name: string) {
    const summonerInfos = await this.cacheAndFetch(region, [name], true, this.summonerCache, Aws.getSummoners);  //API call (slow)
    const puuid = (summonerInfos[name] || {}).puuid || null;

    return puuid;
  }

  public static async getSummonerIdByRegionAndName(region: string, name: string) {
    const summonerInfos = await this.cacheAndFetch(region, [name], true, this.summonerCache, Aws.getSummoners);  //API call (slow)
    const summonerId = (summonerInfos[name] || {}).id || null;

    return summonerId;
  }

  public static async getPersonalData(region: string, name: string, soloQueue: boolean) {
    const csData = new CsData();

    //Group calls to make less calls to AWS?
    csData.summonerInfo = await this.cacheAndFetch(region, [name], true, this.summonerCache, Aws.getSummoners);  //API call (slow)
    const puuids = [(csData.summonerInfo[name] || {}).puuid || ""];
    const summonerIds = [(csData.summonerInfo[name] || {}).id || ""];

    const masteriesTask = this.cacheAndFetch(region, summonerIds, false, this.masteryCache, Aws.getMasteries); //DB
    const tiersTask = this.cacheAndFetch(region, summonerIds, false, soloQueue ? this.awsSoloQTierCache : this.awsFlexTierCache, 
      (region: string, sIds: string[]) => Aws.getTiers(region, soloQueue, sIds)); //DB
    
    const historiesByPuuid = await this.cacheAndFetch(region, puuids, true, this.historyCache, Aws.getHistories); //API call (slow)
    const matchIds = <string[]>[...new Set(Utils.flattenArray(Object.keys(historiesByPuuid).map(x => historiesByPuuid[x])))];

    csData.matches =  await this.cacheAndFetch(region, matchIds, false, this.matchCache, Aws.getMatches); //API+DB (slow)
    const masteriesBySummonerId =  await masteriesTask;
    const tiersBySummonerId =  await tiersTask;

    //Make the dictionaries by name instead
    csData.histories = {};
    csData.masteries = {};
    csData.tiers = {};
    
    if (name in csData.summonerInfo) {
      const info = csData.summonerInfo[name];
      csData.histories[name] = historiesByPuuid[info.puuid];
      csData.masteries[name] = masteriesBySummonerId[info.id];
      csData.tiers[name] = tiersBySummonerId[info.id];
    } else {
      csData.histories[name] = [];
      csData.masteries[name] = {};
      csData.tiers[name] = [];
    }

    //Get LCU tiers
    const lcuTiers = await this.cacheAndFetch(region, [name], false, this.lcuTierCache, (region: string, sIds: string[]) => Lcu.getSummonersTierByName(sIds));
    csData.lcuTiers = {};
    for (let name in lcuTiers) {
      csData.lcuTiers[name] = CsDataFetcher.parseLCUTier(lcuTiers[name], soloQueue);
    }

    return csData;
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
      currCsData.lcuTiers[name] = CsDataFetcher.parseLCUTier(lcuTiers[name], !isFlex);
    }

    return currCsData;
  }

  public static parseLCUTier(lcuTier: any, soloQueue: boolean) {
    let tier = '';
    let division = '';
    let lp = '';
    if (lcuTier) {
      const hasSoloTier = lcuTier.queueMap && lcuTier.queueMap.RANKED_SOLO_5x5 && lcuTier.queueMap.RANKED_SOLO_5x5.tier;
      const hasFlexTier = lcuTier.queueMap && lcuTier.queueMap.RANKED_FLEX_SR && lcuTier.queueMap.RANKED_FLEX_SR.tier;
  
      if (soloQueue && hasSoloTier) {
        tier = lcuTier.queueMap.RANKED_SOLO_5x5.tier.toLocaleLowerCase();
        division = lcuTier.queueMap.RANKED_SOLO_5x5.division;
        lp = lcuTier.queueMap.RANKED_SOLO_5x5.leaguePoints;
      } else if (!soloQueue && hasFlexTier) {
        tier = lcuTier.queueMap.RANKED_FLEX_SR.tier.toLocaleLowerCase();
        division = lcuTier.queueMap.RANKED_FLEX_SR.division;
        lp = lcuTier.queueMap.RANKED_FLEX_SR.leaguePoints;
      }
      if (["iron", "bronze", "silver", "gold", "platinum", "diamond", "master", "grandmaster", "challenger"].includes(tier)) {
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