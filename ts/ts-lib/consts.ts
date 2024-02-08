const version = 'v0.3.19';
const lcuClassId = 10902;
const lolClassId = 5426;

const interestingFeatures = {
  //LCU
  game_flow: 'game_flow',
  summoner_info: 'summoner_info',
  champ_select: 'champ_select',
  lcu_info: 'lcu_info',
  lobby_info: 'lobby_info',
  end_game: 'end_game',
  game_info: 'game_info',

  //LoL
  teams: 'teams',
};

const windowNames = {
  mainWindow: 'mainWindow',
  background: 'background',
};

const lcuUrls = {
  //see https://www.mingweisamuel.com/lcu-schema/tool/
  //see https://lcu.kebs.dev/
  //ChampSelectQuery: 'lol-champ-select/v1/session',
  //RegionQuery: 'lol-platform-config/v1/namespaces/LoginDataPacket/platformId',

  //MatchHistoryQueryV1: 'lol-match-history/v1/matchlist', //own matches with only info about own performance
  //MatchHistoryQueryV2: 'lol-match-history/v2/matchlist', //?begIndex=0&endIndex=1000  //same as above with paging
  //FriendMatchesQuery: 'lol-match-history/v1/friend-matchlists/', //{accountId} //same as above on other accountId
  //CareerMatchesQuery: 'lol-career-stats/v1/summoner-games/', //{puuid} //same as above? on other puuid

  //SummonerInfoByIdQuery: 'lol-summoner/v1/summoners/', //{id} //get name, accountId and puuid
  SummonerInfoByNameQuery: 'lol-summoner/v1/summoners', //?name=... //get name, accountId and puuid
  RankedStatsQuery: 'lol-ranked/v1/ranked-stats/', //{puuid} //get tiers
  //MatchInfoQuery: 'lol-match-history/v1/games/', //{gameId} //get game details

  ChatParticipants: 'chat/v5/participants/champ-select', //Get names of people in CS
};

export { version, lcuClassId, lolClassId, interestingFeatures, windowNames, lcuUrls };
