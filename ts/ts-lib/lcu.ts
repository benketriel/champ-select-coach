import { lcuClassId, lcuUrls } from "./consts";
import { CsInput } from "./csManager";
import { ErrorReporting } from "./errorReporting";
import { Logger } from "./logger";
import { Timer } from "./timer";

export class Lcu {
  private static _featureRetries = 100000;
  //http://static.developer.riotgames.com/docs/lol/queues.json
  public static BLACKLISTED_QUEUES = ['1090', '1100', '1110', '1111'];
  public static WHITELISTED_QUEUES = [
    '-1', 
    '400', 
    '420', //Ranked solo
    '430', 
    '440', 
    '700', 
    '0',
    //'450', //ARAM
  ];

  private static LCU_TIMEOUT_MILLIS = 12000;

  public static async lcuRequest(cred: any, query: string): Promise<any> {
    const url = `https://127.0.0.1:${cred.port}/${query}`;
    const resO : any = await Promise.race([
      new Promise<overwolf.web.SendHttpRequestResult>(resolve => overwolf.web.sendHttpRequest(url, overwolf.web.enums.HttpRequestMethods.GET, [{ key: 'Authorization', value: `Basic ${cred.token}` }], null, result => resolve(result))),
      Timer.wait(Lcu.LCU_TIMEOUT_MILLIS)
    ]);

    if (null == resO || null == resO.data || resO.data.length == 0) {
      Logger.log('LCU Query timeout:');
      Logger.log(query);
      return null;
    }
    const res = JSON.parse(resO.data);

    return res;
  }

  public static async setRequiredFeatures(features): Promise<boolean> {
    let tries:number = 0, result;

    while (tries < this._featureRetries) {
      result = await new Promise(resolve => overwolf.games.launchers.events.setRequiredFeatures(lcuClassId, features, resolve));

      if (result.status === 'success') {
        Logger.log('setRequiredFeatures(): success: '+ JSON.stringify(result, null, 2));
        return (result.supportedFeatures.length > 0);
      }

      await Timer.wait(3000);
      tries++;
      if (tries % 10 == 0) {
        ErrorReporting.report('setRequiredFeatures', 'setRequiredFeatures(): still not finished after ' + tries + ' tries: ' + JSON.stringify(result, null, 2));
      }
    }

    ErrorReporting.report('setRequiredFeatures', 'setRequiredFeatures(): failure after '+ tries +' tries: '+ JSON.stringify(result, null, 2));
    return false;
  }

  public static async inChampionSelect(): Promise<boolean> {
    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      return info && info.success && info.res && info.res.game_flow && info.res.game_flow.phase == "ChampSelect"
      && info.res.lobby_info && info.res.lobby_info.queueId && Lcu.WHITELISTED_QUEUES.includes(info.res.lobby_info.queueId);
    } catch (ex) {
      ErrorReporting.report('inChampionSelect', ex);
      return false;
    }
  }

  public static async getCurrentNameAndRegion(): Promise<any> {
    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      
      if (info && info.success && info.res && info.res.summoner_info && info.res.summoner_info.display_name && info.res.summoner_info.platform_id) {
        return { name: info.res.summoner_info.display_name, region: info.res.summoner_info.platform_id };
      }
      Logger.log(info);
    } catch (ex) {
      ErrorReporting.report('getCurrentNameAndRegion', ex);
    }
    return null;
  }

  public static async getCsInput(prevCsInput: CsInput, all_info_alt: any): Promise<CsInput> {
    let info = {};
    try {
      if (all_info_alt && all_info_alt.info && all_info_alt.info.champ_select && all_info_alt.info.champ_select.raw) {
        info = JSON.parse(all_info_alt.info.champ_select.raw);
      } else {
        const all_info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
        if (!all_info || !all_info.res || !all_info.res.champ_select || !all_info.res.champ_select.raw || !all_info.res.summoner_info || !all_info.res.summoner_info.platform_id) { Logger.log("InvalidInfo"); return null; }
      
        info = JSON.parse(all_info.res.champ_select.raw);
      }

      Logger.debug(info);

      if (!info || !info["myTeam"]) { Logger.log("InvalidInfo"); return null; }
      if (info["myTeam"].length == 0) { Logger.log("NotInChampionSelect"); return null; }

      let cellInfoIds = {};
      let blueSide = true;
      for (let x of info["myTeam"]) {
          let cellId = parseInt(x["cellId"]);
          blueSide = cellId < 5;

          // let sId = x["summonerId"].toString();

          let cId = x["championId"].toString();
          let name = ((x["summonerInfo"] || {})["displayName"] || "").toString();
          // let puuid = ((x["summonerInfo"] || {})["puuid"] || "").toString();
          let position = x["assignedPosition"].toString();
          let spells = [x["spell1Id"] || -1, x["spell2Id"] || -1];
          if (spells[0] > 255) spells[0] = -1;
          if (spells[1] > 255) spells[1] = -1;
          //if (cId == "0")
          //{
          //    cId = x["championPickIntent"].toString();
          //}

          cellInfoIds[cellId] = { champId: cId, name: name, position: position, spells: spells };
      }
      let opponentCellChampionIds = {};
      for (let x of info["theirTeam"]) {
          let cellId = parseInt(x["cellId"]);

          let cId = x["championId"].toString();
          //if (cId == "0")
          //{
          //    cId = x["championPickIntent"].toString();
          //    if (cId != "0") { }
          //}
          opponentCellChampionIds[cellId] = cId;
      }

      //let draft = JSON.parse(info["hasSimultaneousBans"]) && !JSON.parse(info["hasSimultaneousPicks"]) && !JSON.parse(info["isCustomGame"]);

      let cellLastChamp = {};
      for (let x of info["actions"]) {
          for (let y of x) {
              try {
                  let type = y["type"].toString();
                  if (type != "pick") continue;

                  //let ally = JSON.parse(y["isAllyAction"]);
                  let inProgress = JSON.parse(y["isInProgress"]);
                  let completed = JSON.parse(y["completed"]);
                  let championId = y["championId"].toString();
                  let cellId = parseInt(y["actorCellId"]);
                  //if (championId != "0") {
                      cellLastChamp[cellId] = { champId: championId, finished: completed && !inProgress, picking: inProgress && !completed };
                  //}
              } catch (ex) {
                ErrorReporting.report('getCsInput', {ex, info, msg: 'while parsing actions'});
              }
          }
      }

      let myTeam = Object.keys(cellInfoIds).map(cellId => {
          let cid = cellInfoIds[cellId];
          let champId = cid.champId;
          let name = cid.name;
          let position = cid.position;
          let spells = cid.spells;
          let lockedIn = champId != "0";
          let picking = false;
          if (cellLastChamp[cellId]) {
              if (champId == "0") champId = cellLastChamp[cellId].champId;
              lockedIn = cellLastChamp[cellId].finished;
              picking = cellLastChamp[cellId].picking;
          }
          let champion = champId || "";
          return { name, champion, lockedIn, picking, position, spells };
      });

      let opponentTeam = Object.keys(opponentCellChampionIds).map(cellId => {
          let champId = opponentCellChampionIds[cellId];
          let lockedIn = champId != "0";
          let picking = false;
          if (cellLastChamp[cellId]) {
              if (champId == "0") champId = cellLastChamp[cellId].champId;
              lockedIn = cellLastChamp[cellId].finished;
              picking = cellLastChamp[cellId].picking;
          }
          let champion = champId || "";

          //This info is hidden from LCU
          const name = "";
          const position: any = "";
          const spells = [-1, -1];
          return { name, champion, lockedIn, picking, position, spells };
      });

      const blueTeam = blueSide ? myTeam : opponentTeam;
      const redTeam = blueSide ? opponentTeam : myTeam;

      const newCsInput = new CsInput();
      newCsInput.ownerName = prevCsInput == null ? '' : prevCsInput.ownerName;
      newCsInput.queueId = prevCsInput == null ? '' : prevCsInput.queueId;
      newCsInput.region = prevCsInput == null ? '' : prevCsInput.region;
      newCsInput.summonerNames = (blueTeam.map(x => x.name).concat(["", "", "", "", ""])).slice(0, 5).concat((redTeam.map(x => x.name).concat(["", "", "", "", ""])).slice(0, 5));

      newCsInput.championIds = (blueTeam.map(x => x.champion).concat(["", "", "", "", ""])).slice(0, 5).concat((redTeam.map(x => x.champion).concat(["", "", "", "", ""])).slice(0, 5));
      newCsInput.picking = (blueTeam.map(x => x.picking).concat([false, false, false, false, false])).slice(0, 5).concat((redTeam.map(x => x.picking).concat([false, false, false, false, false])).slice(0, 5));
      newCsInput.assignedRoles = (blueTeam.map(x => x.position).concat([-1, -1, -1, -1, -1])).slice(0, 5).concat((redTeam.map(x => x.position).concat([-1, -1, -1, -1, -1])).slice(0, 5));
      newCsInput.summonerSpells = (blueTeam.map(x => x.spells).concat([[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1]])).slice(0, 5).concat((redTeam.map(x => x.spells).concat([[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1]])).slice(0, 5));
      
      for (let i = 0; i < 10; ++i) {
        newCsInput.assignedRoles[i] = 
          newCsInput.assignedRoles[i] == "top" ? 0 :
          newCsInput.assignedRoles[i] == "utility" ? 4 :
          newCsInput.assignedRoles[i] == "bottom" ? 3 :
          newCsInput.assignedRoles[i] == "middle" ? 2 :
          newCsInput.assignedRoles[i] == "jungle" ? 1 : 
          -1;
      }

      if (newCsInput.region == '' || newCsInput.queueId == '' || newCsInput.ownerName == '' || CsInput.triggersNewCs(prevCsInput, newCsInput) || CsInput.anyChangeInSummoners(prevCsInput, newCsInput)) {
        const all_info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
        if (!all_info || !all_info.res || !all_info.res.summoner_info || !all_info.res.summoner_info.platform_id || !all_info.res.summoner_info.display_name || 
          !all_info.res.lobby_info || !all_info.res.lobby_info.queueId || !Lcu.WHITELISTED_QUEUES.includes(all_info.res.lobby_info.queueId)) { 
          Logger.log("InvalidInfo");
          return null;
        }
        Logger.log("New meta info: " + JSON.stringify({ 
          'newCsInput.region': newCsInput.region, 
          'all_info.res.summoner_info.platform_id': all_info.res.summoner_info.platform_id,
          'newCsInput.queueId': newCsInput.queueId,
          'all_info.res.lobby_info.queueId': all_info.res.lobby_info.queueId,
          'newCsInput.ownerName': newCsInput.ownerName,
          'all_info.res.summoner_info.display_name': all_info.res.summoner_info.display_name,
        }));

        newCsInput.region = all_info.res.summoner_info.platform_id;
        newCsInput.queueId = all_info.res.lobby_info.queueId;
        newCsInput.ownerName = all_info.res.summoner_info.display_name;
        Logger.log("QueueId:" + newCsInput.queueId);
      } else {
        newCsInput.roleSwaps = prevCsInput.roleSwaps;
        newCsInput.championSwaps = prevCsInput.championSwaps;
      }

      if (!Lcu.WHITELISTED_QUEUES.includes(newCsInput.queueId)) {
        Logger.log("Not whitelisted queue");
        return null;
      }

      return newCsInput;
    } catch (ex) {
      ErrorReporting.report('getCsInput', {ex, info});
      return null;
    }
  }

  // public static async isLcuRunning(): Promise<boolean> {
  //   const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
  //   return !(!info || !info.res || !info.res.credentials);
  // }

  public static isLcuRunningFromInfo(launcherInfo) {
    if (!launcherInfo || !launcherInfo.launchers) {
      return false;
    }
    for (let l of launcherInfo.launchers) {
      if (Math.floor(l.id / 10) == 10902) {
        return true;
      }
    }
    return false;
  }

  public static async getSummonersTierByPuuid(puuids: Array<string>) {
    if (!puuids) return null;

    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      if (!info || !info.res || !info.res.credentials) return 'LcuConnectionFailed';

      return await Promise.all(puuids.map(async puuid => await Lcu.getSummonerTierByPuuid(info.res.credentials, puuid)));
    } catch (ex) {
      ErrorReporting.report('getSummonersTierByPuuid', {ex, puuids});
      return puuids.map(() => null);
    }
  }

  public static async getSummonerTierByPuuid(creds: any, puuid: string) {
    try {
        if (!puuid) return null;
        let tierInfo = await Lcu.lcuRequest(creds, lcuUrls.RankedStatsQuery + puuid);
        return tierInfo;
    } catch (ex) {
      ErrorReporting.report('getSummonerTierByPuuid', {ex, puuid});
      return null;
    }
  }

  public static async getSummonerPuuidsByName(names: Array<string>) {
    if (!names) return null;

    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      if (!info || !info.res || !info.res.credentials) return 'LcuConnectionFailed';

      return await Promise.all(names.map(async name => await Lcu.getSummonerPuuidByName(info.res.credentials, name)));
    } catch (ex) {
      ErrorReporting.report('getSummonerPuuidsByName', {ex, names});
      return names.map(() => null);;
    }
  }

  public static async getSummonerPuuidByName(creds: any, summonerName: string) {
    try {
        if (!summonerName) return null;

        let info = await Lcu.lcuRequest(creds, lcuUrls.SummonerInfoByNameQuery + '?name=' + summonerName);
        if (null == info || !info.puuid) return null;
        let puuid = info.puuid;

        return puuid;
    } catch (ex) {
      ErrorReporting.report('getSummonerPuuidByName', {ex, summonerName});
      return null;
    }
  }

  public static async getSummonersTierByName(summonerNames: Array<string>) {
    const lcuPuuids = <string[]>await Lcu.getSummonerPuuidsByName(summonerNames);
    const lcuTiers = await Lcu.getSummonersTierByPuuid(lcuPuuids);
    const result = {};
    for (let i = 0; i < summonerNames.length; ++i) {
      if (summonerNames[i] && lcuTiers[i]) {
        result[summonerNames[i]] = lcuTiers[i];
      }
    }
    return { result };
  }

}

