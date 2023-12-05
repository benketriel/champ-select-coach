import { CscApi } from './cscApi';
import { CsData, CsInput } from './csManager';
import { CsTab } from './csTab';
import { Lcu } from './lcu';
import { Utils } from './utils';

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
      for (const k of keys) {
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
  private static getAccountByRiotIdCache = new Cache(100, 24 * 60);
  private static getSummonersByPuuidCache = new Cache(100, 24 * 60);
  private static getSummonersByIdCache = new Cache(100, 24 * 60);
  private static getAccountsByPuuidCache = new Cache(100, 24 * 60);
  private static getMatchesCache = new Cache(2000, 24 * 60); //2KB each

  private static getHistoriesCache = new Cache(100, 5);
  // private static getMasteriesCache = new Cache(100, 24 * 60);
  private static cscApiSoloQTierCache = new Cache(100, 24 * 60);
  private static cscApiFlexTierCache = new Cache(100, 24 * 60);
  // private static lcuTierCache = new Cache(100, 5);

  public static async getRiotIDsByRegionAndSummonerId(region: string, summonerIds: string[]) {
    const summonerInfos = await this.cacheAndFetch(region, summonerIds, true, this.getSummonersByIdCache, CscApi.getSummonersById); //API call (slow)
    const puuids = summonerIds.map((x) => (summonerInfos[x] || {}).puuid || null);
    const foundPuuids = puuids.filter((x) => x != null);

    let accounts = {};
    if (foundPuuids.length > 0) {
      accounts = await this.cacheAndFetch(region, foundPuuids, true, this.getAccountsByPuuidCache, CscApi.getAccountsByPuuid); //API call (slow)
    }

    const riotIDs = [];
    for (let i in summonerIds) {
      if (puuids[i] && accounts[puuids[i]] && accounts[puuids[i]].gameName && accounts[puuids[i]].tagLine) {
        const gameName = accounts[puuids[i]].gameName;
        const tagLine = accounts[puuids[i]].tagLine;
        let riotID = gameName + '#' + tagLine;
        if (riotID == '#') riotID = '';
        riotIDs.push(riotID);
      } else {
        riotIDs.push('');
      }
    }
    return riotIDs;
  }

  public static async getPuuidByRegionAndRiotID(region: string, riotID: string) {
    const accounts = await this.cacheAndFetch(region, [riotID], true, this.getAccountByRiotIdCache, CscApi.getAccountsByRiotId); //API call (slow)
    const puuid = (accounts[riotID] || {}).puuid || null;

    return puuid;
  }

  public static async getSummonerIdByRegionAndPuuid(region: string, puuid: string) {
    const summonerInfos = await this.cacheAndFetch(region, [puuid], true, this.getSummonersByPuuidCache, CscApi.getSummonersByPuuid); //API call (slow)
    const summonerId = (summonerInfos[puuid] || {}).id || null;

    return summonerId;
  }

  public static async getPersonalData(region: string, riotID: string, soloQueue: boolean) {
    const csData = new CsData();

    const accounts = await this.cacheAndFetch(region, [riotID], true, this.getAccountByRiotIdCache, CscApi.getAccountsByRiotId); //API call (slow)
    const puuid = (accounts[riotID] || {}).puuid || '';
    const summonerByPuuid = await this.cacheAndFetch(region, [puuid], true, this.getSummonersByPuuidCache, CscApi.getSummonersByPuuid); //API call (slow)

    csData.summonerInfo = {};
    if (summonerByPuuid && summonerByPuuid[puuid]) {
      csData.summonerInfo[riotID] = summonerByPuuid[puuid];
      csData.summonerInfo[riotID]['riotID'] = riotID;
    }
    const summonerIds = [(csData.summonerInfo[riotID] || {}).id || ''];

    //const masteriesTask = this.cacheAndFetch(region, summonerIds, false, this.getMasteriesCache, CscApi.getMasteries); //DB
    const tiersTask = this.cacheAndFetch(region, summonerIds, false, soloQueue ? this.cscApiSoloQTierCache : this.cscApiFlexTierCache, (region: string, sIds: string[]) => CscApi.getTiers(region, soloQueue, sIds)); //DB

    const historiesByPuuid = await this.cacheAndFetch(region, [puuid], true, this.getHistoriesCache, CscApi.getHistories); //API call (slow)
    const matchIds = <string[]>[...new Set(Utils.flattenArray(Object.keys(historiesByPuuid).map((x) => historiesByPuuid[x])))];

    csData.matches = await this.cacheAndFetch(region, matchIds, false, this.getMatchesCache, CscApi.getMatches); //API+DB (slow)
    //const masteriesBySummonerId = await masteriesTask;
    const tiersBySummonerId = await tiersTask;

    //Make the dictionaries by riotID instead
    csData.histories = {};
    csData.masteries = {};
    csData.tiers = {};

    csData.histories[riotID] = [];
    csData.masteries[riotID] = {};
    csData.tiers[riotID] = [];
    if (puuid != '' && csData.summonerInfo[riotID]) {
      const info = csData.summonerInfo[riotID];
      csData.histories[riotID] = historiesByPuuid[puuid];
      //csData.masteries[riotID] = masteriesBySummonerId[info.id];
      csData.tiers[riotID] = tiersBySummonerId[info.id];
    }

    //Get LCU tiers
    // const lcuTiers = await this.cacheAndFetch(region, [riotID], false, this.lcuTierCache, async (region: string, rIds: string[]) => await Lcu.getSummonersTierByRiotID(rIds));
    csData.lcuTiers = {};
    // for (let riotID in lcuTiers) {
    //   csData.lcuTiers[riotID] = CsDataFetcher.parseLCUTier(lcuTiers[riotID], soloQueue);
    // }

    return csData;
  }

  public static async getCscHistoryData(region: string, puuid: string) {
    const t0 = puuid == null ? () => {} : CscApi.getCscHistory(region, puuid);
    const t1 = CscApi.getCscHistogram();

    const personalHistory = ((await t0) || {}).result || [];
    const globalHistogram = ((await t1) || {}).result || [];

    return { personalHistory, globalHistogram };
  }

  public static async getCsData(patchInfo: any, csInput: CsInput) {
    const currCsData = new CsData();

    const allRiotIDs = Array.from(new Set(csInput.riotIDs.concat(csInput.chatRiotIDs)));

    const accounts = await this.cacheAndFetch(csInput.region, allRiotIDs, true, this.getAccountByRiotIdCache, CscApi.getAccountsByRiotId); //API call (slow)
    const puuids = allRiotIDs.map((x) => (accounts[x] || {}).puuid || '');
    const summonersByPuuid = await this.cacheAndFetch(csInput.region, puuids, true, this.getSummonersByPuuidCache, CscApi.getSummonersByPuuid); //API call (slow)

    currCsData.summonerInfo = {};
    if (accounts && summonersByPuuid) {
      for (let riotID of allRiotIDs) {
        if (!accounts[riotID] || !accounts[riotID].puuid) continue;
        const puuid = accounts[riotID].puuid;

        if (!summonersByPuuid[puuid]) continue;
        currCsData.summonerInfo[riotID] = summonersByPuuid[puuid];
        currCsData.summonerInfo[riotID]['riotID'] = riotID;
      }
    }
    const summonerIds = allRiotIDs.map((x) => (currCsData.summonerInfo[x] || {}).id || '');

    const isFlex = CsTab.isFlex(patchInfo, csInput.queueId);
    //const masteriesTask = this.cacheAndFetch(csInput.region, summonerIds, false, this.getMasteriesCache, CscApi.getMasteries); //DB
    const tiersTask = this.cacheAndFetch(csInput.region, summonerIds, false, isFlex ? this.cscApiFlexTierCache : this.cscApiSoloQTierCache, (region: string, sIds: string[]) => CscApi.getTiers(region, !isFlex, sIds)); //DB

    const historiesByPuuid = await this.cacheAndFetch(csInput.region, puuids, true, this.getHistoriesCache, CscApi.getHistories); //API call (slow)
    const matchIds = <string[]>[...new Set(Utils.flattenArray(Object.keys(historiesByPuuid).map((x) => historiesByPuuid[x])))];

    currCsData.matches = await this.cacheAndFetch(csInput.region, matchIds, false, this.getMatchesCache, CscApi.getMatches); //API+DB (slow)
    //const masteriesBySummonerId = await masteriesTask;
    const tiersBySummonerId = await tiersTask;

    //Make the dictionaries by riotID instead
    currCsData.histories = {};
    currCsData.masteries = {};
    currCsData.tiers = {};

    for (let riotID of allRiotIDs) {
      currCsData.histories[riotID] = [];
      currCsData.masteries[riotID] = {};
      currCsData.tiers[riotID] = [];
      if (currCsData.summonerInfo[riotID]) {
        const info = currCsData.summonerInfo[riotID];
        currCsData.histories[riotID] = historiesByPuuid[info.puuid];
        //currCsData.masteries[riotID] = masteriesBySummonerId[info.id];
        currCsData.tiers[riotID] = tiersBySummonerId[info.id];
      }
    }

    //Get LCU tiers
    // const lcuTiers = await this.cacheAndFetch(csInput.region, csInput.riotIDs, false, this.lcuTierCache, async (region: string, sIds: string[]) => await Lcu.getSummonersTierByRiotID(sIds));
    currCsData.lcuTiers = {};
    // for (let riotID in lcuTiers) {
    //   currCsData.lcuTiers[riotID] = CsDataFetcher.parseLCUTier(lcuTiers[riotID], !isFlex);
    // }

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
      if (['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'].includes(tier)) {
        if (['master', 'grandmaster', 'challenger'].includes(tier)) {
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
    const missing = new Set();
    const res = {};
    if (!region || region == '') return res;

    for (let k of keys) {
      if (k == null || k == '') continue;
      const x = await cache.getOrNull(region + k);
      if (x == null) missing.add(k);
      else res[k] = x;
    }
    let improved = true;
    let maxIters = 20;
    while (missing.size > 0 && improved && maxIters-- > 0) {
      improved = false;
      const obj = await fetch(region, Array.from(missing));

      if (!obj || !obj.result) break;

      const fetched = obj.result;
      for (let k in fetched) {
        let item = fetched[k];
        if (jsonParse) {
          item = JSON.parse(item);
        }
        res[k] = item;
        missing.delete(k);
        improved = true;
        await cache.insert(region + k, item);
      }
    }
    return res;
  }
}
