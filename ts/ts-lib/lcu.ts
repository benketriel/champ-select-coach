import { lcuClassId, lcuUrls } from "./consts";
import { ErrorReporting } from "./errorReporting";
import { Logger } from "./logger";
import { Timer } from "./timer";

export class Lcu {
  private static _featureRetries = 100000;
  //http://static.developer.riotgames.com/docs/lol/queues.json
  public static BLACKLISTED_QUEUES = ['1090', '1100', '1110', '1111'];
  public static WHITELISTED_QUEUES = ['-1', '400', '420', '430', '440', '700', '0'];

  public static MaxHistoryAgeDays = 90; //This variable is in APIStructs.cs as well
  public static MaxHistoryLen = 100; //This variable is in APIStructs.cs as well

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
    return {};
  }

  public static async getChampionSelectStatus(currStatus: any, all_info_alt: any): Promise<any> {
    try {
      let info = {};
      if (!all_info_alt || !all_info_alt.info || !all_info_alt.info.champ_select || !all_info_alt.info.champ_select.raw) {
        const all_info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
        if (!all_info || !all_info.res || !all_info.res.champ_select || !all_info.res.champ_select.raw || !all_info.res.summoner_info || !all_info.res.summoner_info.platform_id) return "InvalidInfo";
      
        info = JSON.parse(all_info.res.champ_select.raw);
      } else {
        info = JSON.parse(all_info_alt.info.champ_select.raw);
      }

      if (!info || !info["myTeam"]) return "InvalidInfo";
      if (info["myTeam"].length == 0) return "NotInChampionSelect";

      let cellInfoIds = {};
      let blueTeam = true;
      for (let x of info["myTeam"]) {
          let cellId = parseInt(x["cellId"]);
          blueTeam = cellId < 5;

          let sId = x["summonerId"].toString();

          let cId = x["championId"].toString();
          let name = ((x["summonerInfo"] || {})["displayName"] || "").toString();
          let puuid = ((x["summonerInfo"] || {})["puuid"] || "").toString();
          let position = x["assignedPosition"].toString();
          let hasSmite = (x["spell1Id"] || {}).toString() == "11" || (x["spell2Id"] || {}).toString() == "11";
          //if (cId == "0")
          //{
          //    cId = x["championPickIntent"].toString();
          //}

          cellInfoIds[cellId] = { champId: cId, name: name, puuid: puuid, position: position, hasSmite: hasSmite };
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
              } catch (ex) { }
          }
      }

      let myTeam = Object.keys(cellInfoIds).map(cellId => {
          let cid = cellInfoIds[cellId];
          let champId = cid.champId;
          let name = cid.name;
          let puuid = cid.puuid;
          let position = cid.position;
          let hasSmite = cid.hasSmite;
          let lockedIn = champId != "0";
          let picking = false;
          if (cellLastChamp[cellId]) {
              if (champId == "0") champId = cellLastChamp[cellId].champId;
              lockedIn = cellLastChamp[cellId].finished;
              picking = cellLastChamp[cellId].picking;
          }
          let champion = champId || "";
          return { name, puuid, champion, lockedIn, picking, position, hasSmite };
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
          const puuid = "";
          const position:any = "";
          const hasSmite = false;
          return { name, puuid, champion, lockedIn, picking, position, hasSmite };
      });

      const newStatus = {
          Timestamp: new Date(),
          QueueId: currStatus.QueueId,
          IsBlueTeam: blueTeam,
          Region: currStatus.Region,
          Summoners: (myTeam.map(x => x.name).concat(["", "", "", "", ""])).slice(0, 5).concat((opponentTeam.map(x => x.name).concat(["", "", "", "", ""])).slice(0, 5)),
          //For testing Summoners: (myTeam.map(x => x.name).concat(["", "", "", "", ""])).slice(0, 5).concat((myTeam.map(x => x.name).concat(["", "", "", "", ""])).slice(0, 5)),
          Picking: (myTeam.map(x => x.picking).concat([false, false, false, false, false])).slice(0, 5).concat((opponentTeam.map(x => x.picking).concat([false, false, false, false, false])).slice(0, 5)),
          Positions: (myTeam.map(x => x.position).concat([-1, -1, -1, -1, -1])).slice(0, 5).concat((opponentTeam.map(x => x.position).concat([-1, -1, -1, -1, -1])).slice(0, 5)),
          HasSmite: (myTeam.map(x => x.hasSmite).concat([false, false, false, false, false])).slice(0, 5).concat((opponentTeam.map(x => x.hasSmite).concat([false, false, false, false, false])).slice(0, 5)),
          ManualPositions: [],
          GuessedPositions: [],
          Puuids: (myTeam.map(x => x.puuid).concat(["", "", "", "", ""])).slice(0, 5).concat((opponentTeam.map(x => x.puuid).concat(["", "", "", "", ""])).slice(0, 5)),
          //For testing Puuids: (myTeam.map(x => x.puuid).concat(["", "", "", "", ""])).slice(0, 5).concat((myTeam.map(x => x.puuid).concat(["", "", "", "", ""])).slice(0, 5)),
          Champions: (myTeam.map(x => x.champion).concat(["", "", "", "", ""])).slice(0, 5).concat((opponentTeam.map(x => x.champion).concat(["", "", "", "", ""])).slice(0, 5)),
          SummonerInfo: [],
          SummonerHistory: [],
          LcuTierInfos: []
      };

      for (let i = 0; i < 10; ++i) {
        newStatus.Positions[i] = 
          newStatus.Positions[i] == "top" ? 0 :
          newStatus.Positions[i] == "utility" ? 4 :
          newStatus.Positions[i] == "bottom" ? 3 :
          newStatus.Positions[i] == "middle" ? 2 :
          newStatus.Positions[i] == "jungle" ? 1 : 
          -1;
      }


      //Should clear QueueId when leaving queue in case they have the same summoners but swap queue type (nearly impossible since you can't control team in ranked but you know..)
      if (newStatus.Region == '' || newStatus.QueueId == '' || JSON.stringify(currStatus.Summoners) != JSON.stringify(newStatus.Summoners)) {
        const all_info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
        if (!all_info || !all_info.res || !all_info.res.summoner_info || !all_info.res.summoner_info.platform_id || !all_info.res.lobby_info || !all_info.res.lobby_info.queueId) return "InvalidInfo";
        newStatus.Region = all_info.res.summoner_info.platform_id;
        if (!Lcu.WHITELISTED_QUEUES.includes(all_info.res.lobby_info.queueId)) return "InvalidInfo";
        newStatus.QueueId = all_info.res.lobby_info.queueId;
        Logger.log("QueueId:" + newStatus.QueueId);
      }

      return newStatus;
    } catch (ex) {
      ErrorReporting.report('getChampionSelectStatus', ex);
      return ex;
    }
  }

  public static async isLcuRunningRetrying(): Promise<boolean> {
    for (let i = 0; i < 5; ++i) {
      if (i > 0) await Timer.wait(1000);
      if (await Lcu.isLcuRunning()) return true;
    }
    return false;
  }

  public static async isLcuRunning(): Promise<boolean> {
    const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
    return !(!info || !info.res || !info.res.credentials);
  }

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
    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      if (!info || !info.res || !info.res.credentials) return 'LcuConnectionFailed';

      return await Promise.all(puuids.map(puuid => Lcu.getSummonerTierByPuuid(info.res.credentials, puuid)));
    } catch (ex) {
      ErrorReporting.report('getSummonersTierByPuuid', ex);
      return ex;
    }
  }

  public static async getSummonerTierByPuuid(creds: any, puuid: string) {
    try {
        if (!puuid) return null;
        let tierInfo = await Lcu.lcuRequest(creds, lcuUrls.RankedStatsQuery + puuid);
        return tierInfo;
    } catch (ex) {
      ErrorReporting.report('getSummonerTierByPuuid', ex);
      return ex;
    }
  }

  public static async getSummonerPuuidsByName(names: Array<string>) {
    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>(resolve => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      if (!info || !info.res || !info.res.credentials) return 'LcuConnectionFailed';

      return await Promise.all(names.map(name => Lcu.getSummonerPuuidByName(info.res.credentials, name)));
    } catch (ex) {
      ErrorReporting.report('getSummonerPuuidsByName', ex);
      return ex;
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
      ErrorReporting.report('getSummonerPuuidByName', ex);
      return ex;
    }
  }

}

