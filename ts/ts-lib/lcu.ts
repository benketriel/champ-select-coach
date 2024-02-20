import { lcuClassId, lolClassId, lcuUrls } from './consts';
import { CSCAI } from './cscai';
import { CsInput } from './csManager';
import { ErrorReporting } from './errorReporting';
import { Logger } from './logger';
import { Timer } from './timer';

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
  private static LastAskedForChat = 0;
  private static LCU_CHAT_TIMEOUT_MILLIS = 10000;
  private static RiotCredsInProgress = false;
  private static RiotPort = '';
  private static RiotToken = '';
  private static RiotVersion = '';
  private static DbgTrace = '';
  private static PreferredChatPath = lcuUrls.ChatParticipantsNew;

  public static async lcuRequest(cred: any, query: string): Promise<any> {
    const url = `https://127.0.0.1:${cred.port}/${query}`;
    const resO: any = await Promise.race([
      new Promise<overwolf.web.SendHttpRequestResult>((resolve) => overwolf.web.sendHttpRequest(url, overwolf.web.enums.HttpRequestMethods.GET, [{ key: 'Authorization', value: `Basic ${cred.token}` }], null, (result) => resolve(result))),
      Timer.wait(Lcu.LCU_TIMEOUT_MILLIS),
    ]);

    if (null == resO || null == resO.data || resO.data.length == 0) {
      Logger.log('LCU Query timeout:');
      Logger.log(query);
      return null;
    }
    const res = JSON.parse(resO.data);

    return res;
  }

  public static async setRequiredFeatures(lcu: boolean, features: string[]): Promise<boolean> {
    let tries: number = 0,
      result;

    while (tries < this._featureRetries) {
      if (lcu) {
        result = await new Promise((resolve) => overwolf.games.launchers.events.setRequiredFeatures(lcuClassId, features, resolve));
      } else {
        result = await new Promise((resolve) => overwolf.games.events.setRequiredFeatures(features, resolve));
      }

      if (result.status === 'success') {
        Logger.log('setRequiredLCUFeatures(): success: ' + JSON.stringify(result, null, 2));
        return result.supportedFeatures.length > 0;
      }

      await Timer.wait(3000);
      tries++;
      // if (tries % 10 == 0) {
      //   This happens a lot because if the game is not running, it will not be able to set the features, should not flood the error logs with this
      //   ErrorReporting.report('setRequiredLCUFeatures', 'setRequiredLCUFeatures(): still not finished after ' + tries + ' tries: ' + JSON.stringify(result, null, 2));
      // }
    }

    // ErrorReporting.report('setRequiredLCUFeatures', 'setRequiredLCUFeatures(): failure after '+ tries +' tries: '+ JSON.stringify(result, null, 2));
    return false;
  }

  public static async inChampionSelect(): Promise<boolean> {
    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>((resolve) => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
      return info && info.success && info.res && info.res.game_flow && info.res.game_flow.phase == 'ChampSelect' && info.res.lobby_info && info.res.lobby_info.queueId && Lcu.WHITELISTED_QUEUES.includes(info.res.lobby_info.queueId);
    } catch (ex) {
      ErrorReporting.report('inChampionSelect', ex);
      return false;
    }
  }

  public static async getCurrentRiotIDAndRegion(): Promise<any> {
    try {
      const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>((resolve) => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));

      if (info && info.success && info.res && info.res.summoner_info && info.res.summoner_info.platform_id && info.res.summoner_info.player_info) {
        const player_info = JSON.parse(info.res.summoner_info.player_info);
        if (player_info && player_info.gameName && player_info.tagLine) {
          let riotID = player_info.gameName + '#' + player_info.tagLine;
          if (riotID == '#') riotID = '';
          return { riotID: riotID, region: info.res.summoner_info.platform_id };
        }
      }
      Logger.log(info);
    } catch (ex) {
      ErrorReporting.report('getCurrentRiotIDAndRegion', ex);
    }
    return null;
  }

  public static async getCsInput(prevCsInput: CsInput, all_info_alt: any, csInProgress: boolean): Promise<CsInput> {
    let info = {};
    try {
      if (all_info_alt && all_info_alt.info && all_info_alt.info.champ_select && all_info_alt.info.champ_select.raw) {
        info = JSON.parse(all_info_alt.info.champ_select.raw);
      } else {
        const all_info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>((resolve) => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
        if (!all_info || !all_info.res || !all_info.res.champ_select || !all_info.res.champ_select.raw || !all_info.res.summoner_info || !all_info.res.summoner_info.platform_id) {
          Logger.log('InvalidInfo');
          return null;
        }

        info = JSON.parse(all_info.res.champ_select.raw);
      }

      if (!info || !info['myTeam']) {
        Logger.log('InvalidInfo');
        return null;
      }
      if (info['myTeam'].length == 0) {
        Logger.log('NotInChampionSelect');
        return null;
      }

      let cellInfoIds = {};
      let blueSide = true;
      for (let x of info['myTeam']) {
        let cellId = parseInt(x['cellId']);
        blueSide = cellId < 5;

        // let sId = x["summonerId"].toString();

        let cId = x['championId'].toString();
        let gameName = ((x['summonerInfo'] || {})['gameName'] || '').toString();
        let tagLine = ((x['summonerInfo'] || {})['tagLine'] || '').toString();
        let riotID = gameName + '#' + tagLine;
        if (riotID == '#') riotID = '';

        // let puuid = ((x["summonerInfo"] || {})["puuid"] || "").toString(); //Reminder: This uses another encoding of puuids, so it's only usable in LCU things
        let position = x['assignedPosition'].toString();
        let spells = [x['spell1Id'] || -1, x['spell2Id'] || -1];
        if (spells[0] > 255) spells[0] = -1;
        if (spells[1] > 255) spells[1] = -1;
        //if (cId == "0")
        //{
        //    cId = x["championPickIntent"].toString();
        //}
        let visible = (x['nameVisibilityType'] || '') != 'HIDDEN';

        cellInfoIds[cellId] = { champId: cId, riotID: riotID, position: position, spells: spells, visible: visible };
      }
      let opponentCellChampionIds = {};
      for (let x of info['theirTeam']) {
        let cellId = parseInt(x['cellId']);

        let cId = x['championId'].toString();
        //if (cId == "0")
        //{
        //    cId = x["championPickIntent"].toString();
        //    if (cId != "0") { }
        //}
        opponentCellChampionIds[cellId] = cId;
      }

      //let draft = JSON.parse(info["hasSimultaneousBans"]) && !JSON.parse(info["hasSimultaneousPicks"]) && !JSON.parse(info["isCustomGame"]);

      let cellLastChamp = {};
      for (let x of info['actions']) {
        for (let y of x) {
          try {
            let type = y['type'].toString();
            if (type != 'pick') continue;

            //let ally = JSON.parse(y["isAllyAction"]);
            let inProgress = JSON.parse(y['isInProgress']);
            let completed = JSON.parse(y['completed']);
            let championId = y['championId'].toString();
            let cellId = parseInt(y['actorCellId']);
            //if (championId != "0") {
            cellLastChamp[cellId] = { champId: championId, finished: completed && !inProgress, picking: inProgress && !completed };
            //}
          } catch (ex) {
            ErrorReporting.report('getCsInput', { ex, info, msg: 'while parsing actions' });
          }
        }
      }

      let myTeam = Object.keys(cellInfoIds).map((cellId) => {
        const cid = cellInfoIds[cellId];
        let champId = cid.champId;
        const riotID = cid.riotID;
        const position = cid.position;
        const spells = cid.spells;
        const hidden = !cid.visible;
        let lockedIn = champId != '0';
        let picking = false;
        if (cellLastChamp[cellId]) {
          if (champId == '0') champId = cellLastChamp[cellId].champId;
          lockedIn = cellLastChamp[cellId].finished;
          picking = cellLastChamp[cellId].picking;
        }
        const champion = champId || '';
        return { riotID: riotID, champion, lockedIn, picking, position, spells, hidden };
      });

      let opponentTeam = Object.keys(opponentCellChampionIds).map((cellId) => {
        let champId = opponentCellChampionIds[cellId];
        let lockedIn = champId != '0';
        let picking = false;
        if (cellLastChamp[cellId]) {
          if (champId == '0') champId = cellLastChamp[cellId].champId;
          lockedIn = cellLastChamp[cellId].finished;
          picking = cellLastChamp[cellId].picking;
        }
        let champion = champId || '';

        //This info is hidden from LCU
        const riotID = '';
        const position: any = '';
        const spells = [-1, -1];
        const hidden = true;
        return { riotID, champion, lockedIn, picking, position, spells, hidden };
      });

      const blueTeam = blueSide ? myTeam : opponentTeam;
      const redTeam = blueSide ? opponentTeam : myTeam;

      const newCsInput = new CsInput();
      newCsInput.ownerRiotID = prevCsInput == null ? '' : prevCsInput.ownerRiotID;
      newCsInput.queueId = prevCsInput == null ? '' : prevCsInput.queueId;
      newCsInput.region = prevCsInput == null ? '' : prevCsInput.region;
      newCsInput.riotIDs = blueTeam
        .map((x) => x.riotID)
        .concat(['', '', '', '', ''])
        .slice(0, 5)
        .concat(
          redTeam
            .map((x) => x.riotID)
            .concat(['', '', '', '', ''])
            .slice(0, 5)
        );
      newCsInput.hiddenSummoners = blueTeam
        .map((x) => x.hidden)
        .concat([false, false, false, false, false])
        .slice(0, 5)
        .concat(
          redTeam
            .map((x) => x.hidden)
            .concat([false, false, false, false, false])
            .slice(0, 5)
        );

      newCsInput.championIds = blueTeam
        .map((x) => x.champion)
        .concat(['', '', '', '', ''])
        .slice(0, 5)
        .concat(
          redTeam
            .map((x) => x.champion)
            .concat(['', '', '', '', ''])
            .slice(0, 5)
        );
      newCsInput.picking = blueTeam
        .map((x) => x.picking)
        .concat([false, false, false, false, false])
        .slice(0, 5)
        .concat(
          redTeam
            .map((x) => x.picking)
            .concat([false, false, false, false, false])
            .slice(0, 5)
        );
      newCsInput.assignedRoles = blueTeam
        .map((x) => x.position)
        .concat([-1, -1, -1, -1, -1])
        .slice(0, 5)
        .concat(
          redTeam
            .map((x) => x.position)
            .concat([-1, -1, -1, -1, -1])
            .slice(0, 5)
        );
      newCsInput.summonerSpells = blueTeam
        .map((x) => x.spells)
        .concat([
          [-1, -1],
          [-1, -1],
          [-1, -1],
          [-1, -1],
          [-1, -1],
        ])
        .slice(0, 5)
        .concat(
          redTeam
            .map((x) => x.spells)
            .concat([
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
            ])
            .slice(0, 5)
        );

      for (let i = 0; i < 10; ++i) {
        newCsInput.assignedRoles[i] =
          newCsInput.assignedRoles[i] == 'top' ? 0 : newCsInput.assignedRoles[i] == 'utility' ? 4 : newCsInput.assignedRoles[i] == 'bottom' ? 3 : newCsInput.assignedRoles[i] == 'middle' ? 2 : newCsInput.assignedRoles[i] == 'jungle' ? 1 : -1;
      }

      let findChatRiotIDs = !csInProgress || new Date().getTime() - this.LastAskedForChat > Lcu.LCU_CHAT_TIMEOUT_MILLIS;

      if (newCsInput.region == '' || newCsInput.queueId == '' || newCsInput.ownerRiotID == '' || CsInput.triggersNewCs(prevCsInput, newCsInput) || CsInput.anyChangeInSummoners(prevCsInput, newCsInput)) {
        const all_info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>((resolve) => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
        if (
          !all_info ||
          !all_info.res ||
          !all_info.res.summoner_info ||
          !all_info.res.summoner_info.platform_id ||
          !all_info.res.summoner_info.player_info ||
          !all_info.res.lobby_info ||
          !all_info.res.lobby_info.queueId ||
          !Lcu.WHITELISTED_QUEUES.includes(all_info.res.lobby_info.queueId)
        ) {
          Logger.log('InvalidInfo');
          return null;
        }
        const player_info = JSON.parse(all_info.res.summoner_info.player_info);
        if (!player_info || !player_info.gameName || !player_info.tagLine) {
          Logger.log('InvalidPlayerInfo');
          return null;
        }
        let riotID = player_info.gameName + '#' + player_info.tagLine;
        if (riotID == '#') riotID = '';

        Logger.log(
          'New meta info: ' +
            JSON.stringify({
              'newCsInput.region': newCsInput.region,
              'all_info.res.summoner_info.platform_id': all_info.res.summoner_info.platform_id,
              'newCsInput.queueId': newCsInput.queueId,
              'all_info.res.lobby_info.queueId': all_info.res.lobby_info.queueId,
              'newCsInput.ownerRiotID': newCsInput.ownerRiotID,
              riotID: riotID,
            })
        );

        newCsInput.region = all_info.res.summoner_info.platform_id;
        newCsInput.queueId = all_info.res.lobby_info.queueId;
        newCsInput.ownerRiotID = riotID;

        Logger.log('QueueId:' + newCsInput.queueId);
        findChatRiotIDs = true;
      } else {
        newCsInput.roleSwaps = prevCsInput.roleSwaps;
        newCsInput.championSwaps = prevCsInput.championSwaps;
        newCsInput.chatRiotIDs = prevCsInput.chatRiotIDs;
      }

      if (!Lcu.WHITELISTED_QUEUES.includes(newCsInput.queueId)) {
        Logger.log('Not whitelisted queue');
        return null;
      }

      if (findChatRiotIDs) {
        this.LastAskedForChat = new Date().getTime();
        newCsInput.chatRiotIDs = await Lcu.getRiotIDsFromChat();
      }

      return newCsInput;
    } catch (ex) {
      ErrorReporting.report('getCsInput', { ex, info });
      return null;
    }
  }

  public static async getLiveGameInfo() {
    const all_info: overwolf.games.events.GetInfoResult = await new Promise<overwolf.games.events.GetInfoResult>((resolve) => overwolf.games.events.getInfo(resolve));
    //Logger.debug(all_info);
    return all_info;
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

  public static isLolRunningFromInfo(lolInfo) {
    if (!lolInfo || !lolInfo.classId) {
      return false;
    }
    return lolInfo.classId == 5426;
  }

  // public static async getSummonersTierByPuuid(puuids: Array<string>) {
  //   if (!puuids) return null;

  //   try {
  //     const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>((resolve) => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
  //     if (!info || !info.res || !info.res.credentials) {
  //       Logger.warn('getSummonersTierByPuuid:LcuConnectionFailed');
  //       return null;
  //     }

  //     return await Promise.all(puuids.map(async (puuid) => await Lcu.getSummonerTierByPuuid(info.res.credentials, puuid)));
  //   } catch (ex) {
  //     ErrorReporting.report('getSummonersTierByPuuid', { ex, puuids });
  //     return puuids.map(() => null);
  //   }
  // }

  // public static async getSummonerTierByPuuid(creds: any, puuid: string) {
  //   try {
  //     if (!puuid) return null;
  //     let tierInfo = await Lcu.lcuRequest(creds, lcuUrls.RankedStatsQuery + puuid);
  //     return tierInfo;
  //   } catch (ex) {
  //     ErrorReporting.report('getSummonerTierByPuuid', { ex, puuid });
  //     return null;
  //   }
  // }

  // public static async getSummonerPuuidsByRiotID(riotIDs: Array<string>) {
  //   if (!riotIDs) return null;

  //   try {
  //     const info: overwolf.games.launchers.events.GetInfoResult = await new Promise<overwolf.games.launchers.events.GetInfoResult>((resolve) => overwolf.games.launchers.events.getInfo(lcuClassId, resolve));
  //     if (!info || !info.res || !info.res.credentials) {
  //       Logger.warn('getSummonerPuuidsByRiotID:LcuConnectionFailed');
  //       return null;
  //     }

  //     return await Promise.all(riotIDs.map(async (riotID) => await Lcu.getSummonerPuuidByRiotID(info.res.credentials, riotID)));
  //   } catch (ex) {
  //     ErrorReporting.report('getSummonerPuuidsByRiotID', { ex, riotIDs: riotIDs });
  //     return riotIDs.map(() => null);
  //   }
  // }

  // public static async getSummonerPuuidByRiotID(creds: any, riotID: string) {
  //   try {
  //     if (!riotID) return null;

  //     let info = await Lcu.lcuRequest(creds, lcuUrls.SummonerInfoByRiotIDQuery + '?riotID=' + riotID);
  //     if (null == info || !info.puuid) return null;
  //     let puuid = info.puuid;

  //     return puuid;
  //   } catch (ex) {
  //     ErrorReporting.report('getSummonerPuuidByRiotID', { ex, riotID: riotID });
  //     return null;
  //   }
  // }

  // public static async getSummonersTierByRiotID(riotIDs: Array<string>) {
  //   const result = {};
  //   if (!riotIDs) return { result };

  //   const lcuPuuids = <string[]>await Lcu.getSummonerPuuidsByRiotID(riotIDs);
  //   const lcuTiers = await Lcu.getSummonersTierByPuuid(lcuPuuids);
  //   for (let i = 0; i < riotIDs.length; ++i) {
  //     if (riotIDs[i] && lcuTiers && lcuTiers[i]) {
  //       result[riotIDs[i]] = lcuTiers[i];
  //     }
  //   }
  //   return { result };
  // }

  public static async getRiotIDsFromChat() {
    //return []; //To disable
    try {
      let maxWait = 10;
      while ((this.RiotPort == '' || this.RiotToken == '') && this.RiotCredsInProgress && maxWait-- > 0) {
        await Timer.wait(1000); //Prevent spam on that function
      }

      if (this.RiotPort == '' || this.RiotToken == '') {
        let creds = null;
        try {
          this.RiotCredsInProgress = true;
          creds = await CSCAI.getRiotConnectionCreds();
        } finally {
          this.RiotCredsInProgress = false;
        }

        this.RiotToken = creds[0];
        this.RiotPort = creds[1];
        this.DbgTrace = creds[2];
        if (this.RiotPort == '' || this.RiotToken == '') {
          Logger.log('Failed to connect to RiotClientServices');
          ErrorReporting.report('getRiotIDsFromChat', { dbgTrace: this.DbgTrace });
          return [];
        }
      }
      let res = await Lcu.riotRequest(Lcu.PreferredChatPath);

      if (!res || !res.participants) {
        let creds = null;
        try {
          this.RiotCredsInProgress = true;
          creds = await CSCAI.getRiotConnectionCreds();
        } finally {
          this.RiotCredsInProgress = false;
        }
        this.RiotToken = creds[0];
        this.RiotPort = creds[1];
        this.DbgTrace = creds[2];
        if (this.RiotPort == '' || this.RiotToken == '') {
          Logger.log('Failed to connect to RiotClientServices');
          ErrorReporting.report('getRiotIDsFromChat', { dbgTrace: this.DbgTrace });
          return [];
        }
        res = await Lcu.riotRequest(Lcu.PreferredChatPath);
      }
      //Logger.log(JSON.stringify(res));
      if (res && res.participants && res.participants.length == 0) {
        Lcu.PreferredChatPath = Lcu.PreferredChatPath == lcuUrls.ChatParticipantsNew ? lcuUrls.ChatParticipantsOld : lcuUrls.ChatParticipantsNew;
        //res = await Lcu.riotRequest(Lcu.PreferredChatPath); //Get it on the next one, we are already retrying quite often anyway...
      }

      if (res && res.participants) {
        let riotIDs = res.participants
          .map((p) => (p.game_name || '') + '#' + (p.game_tag || ''))
          .map((p) => (p == '#' ? '' : p))
          .filter((x) => x != null && x.length > 0 && x.indexOf('!') == -1);
        riotIDs = [...new Set(riotIDs)];
        riotIDs.sort(); //If the order changes here we don't want it to make an updated lobby from it
        Logger.debug(riotIDs);
        Logger.log('Successfully found ' + riotIDs.length + ' riotIDs in current lobby');
        return riotIDs;
      } else {
        ErrorReporting.report('getRiotIDsFromChat', { res, dbgTrace: this.DbgTrace });
      }
      return [];
    } catch (ex) {
      ErrorReporting.report('getRiotIDsFromChat', { ex, dbgTrace: this.DbgTrace });
      return [];
    }
  }

  private static async riotRequest(query: string): Promise<any> {
    const url = `https://127.0.0.1:${this.RiotPort}/${query}`;

    const resO: any = await Promise.race([
      new Promise<overwolf.web.SendHttpRequestResult>((resolve) =>
        overwolf.web.sendHttpRequest(
          url,
          overwolf.web.enums.HttpRequestMethods.GET,
          [
            { key: 'Connection', value: 'keep-alive' },
            { key: 'Authorization', value: `Basic ${this.RiotToken}` },
            { key: 'Accept', value: 'application/json' },
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '127.0.0.1' },
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Origin', value: 'https://127.0.0.1:' + this.RiotPort },
            { key: 'Sec-Fetch-Dest', value: 'empty' },
            { key: 'Sec-Fetch-Mode', value: 'cors' },
            { key: 'Sec-Fetch-Site', value: 'same-origin' },
            { key: 'Sec-Fetch-User', value: '?F' },
            //{ key: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) RiotClient/' + this.RiotVersion + ' (CEF 74) Safari/537.36' },
            { key: 'sec-ch-ua', value: 'Chromium' },
            { key: 'Referer', value: 'https://127.0.0.1:' + this.RiotPort + '/index.html' },
            { key: 'Accept-Encoding', value: 'gzip, deflate, br' },
            { key: 'Accept-Language', value: 'en-US,en;q=0.9' },
          ],
          null,
          (result) => resolve(result)
        )
      ),
      Timer.wait(Lcu.LCU_TIMEOUT_MILLIS),
    ]);

    if (null == resO || null == resO.data || resO.data.length == 0) {
      Logger.log('RiotLCU Query timeout:');
      Logger.log(query);
      return null;
    }
    const res = JSON.parse(resO.data);

    return res;
  }
}
