import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { LocalStorage } from "./localStorage"
import { Logger } from "./logger";

export const TranslatedText = {

  /*
    For anyone who wants to contribute read this first:
      All you need to do is add a row to every entry, with the language you are translating to.
      For full sentences feel free to paraphrase if it comes more natural.
      Try to maintain the translations of similar length to prevent issues of text overflowing in the UI.
      It's highly recommended to understand the context of each entry before translating.
      For example it's important to get right the names of the roles as they are in game (Top, Jungle, Mid, Bottom, Support).
      Add //comments or ask if things are uncertain, so we can build and maintain this together over time.

    Some further constraints exist but these can be done by someone other than the translator, since they do not depend on the 
    language knowledge, but rather on HTML:
      Do not translate two different items into the same text (can fix by just adding a space in the end of one of them)
      The text may be the same in different languages in the same item, for example 'Total' in spanish/english.
      Failing to translate one item, will make it default to English
      Some fields have formatting parts such as line breaks or other html tags. These should be kept in all translations.
      Line breaks in the format \n, tabs or multiple spaces do not matter (HTML), however when there are line breaks in the format <br>
      then it means these lines should not be much longer than this, and you also have to include <br> in your translations.
      For the translations you can omit characters like \n or multiple spaces in a row since these won't matter in HTML.

    All the entries after 'Extracted from HTML' were automatically extracted from the HTML via
    JSON.stringify([...new Set($('.translated-text').get().map($).map(x => x.html()))])
    This means that you may not change any character in the English versions of these entries (not even spaces), 
    unless you also make the same change in the original HTML.
  */

  top: {
    english: 'Top', //Example comment
    spanish: 'Superior',
    french: 'Haut',
  },
  jungle: {
    english: 'Jungle',
    spanish: 'Jungla',
    french: 'Jungle',
  },
  mid: {
    english: 'Mid',
    spanish: 'Central',
    french: 'Milieu',
  },
  bottom: {
    english: 'Bot',
    spanish: 'Inferior',
    french: 'Bas',
  },
  support: {
    english: 'Support',
    spanish: 'Soporte',
    french: 'Support',
  },

  pleaseFillInFields: {
    english: 'Please fill in the fields',
    spanish: 'Por favor rellene la información',
    french: 'Merci de completer les informations',
  },
  unableToConnect: {
    english: 'Unable to connect to server',
    spanish: 'No se pudo conectar con el servidor',
    french: 'Impossible de se connecter au serveur',
  },
  thankYouForFeedback: {
    english: 'Thank you for your feedback!',
    spanish: 'Gracias por su contribución!',
    french: 'Merci pour le retour!',
  },
  anErrorOccurred: {
    english: 'An unknown error occurred',
    spanish: 'Ocurrió un error inesperado',
    french: 'Une erreur inconnue est survenue',
  },

  editPlayer: {
    english: 'Edit Player',
    spanish: 'Editar Jugador',
    french: 'Modifier le joueur',
  },
  enterPlayerName: {
    english: 'Enter player name',
    spanish: 'Ingrese el nombre del jugador',
    french: 'Entrer le nom du joueur',
  },
  editChampion: {
    english: 'Edit Champion',
    spanish: 'Editar Campeón',
    french: 'Modifier le champion',
  },
  enterChampionName: {
    english: 'Enter champion name',
    spanish: 'Ingrese el nombre del campeón',
    french: 'Entrer le nom du champion',
  },

  error: {
    english: 'Error',
    spanish: 'Error',
    french: 'Erreur',
  },
  championNotFound: {
    english: 'Champion not found',
    spanish: 'No se encontró un campeón con ese nombre',
    french: 'Impossible de trouver le nom du champion',
  },
  editRegion: {
    english: 'Edit Region',
    spanish: 'Editar Región',
    french: 'Modifier la région',
  },
  enterRegionInitials: {
    english: 'Enter region initials',
    spanish: 'Ingrese las iniciales de la región',
    french: 'Entrer les initiales de la région',
  },
  regionNotFound: {
    english: 'Region not found<br>Available: BR, EUNE, EUW, JP, KR, LAN, LAS, NA, OCE, RU, TR',
    spanish: 'No se encontró ninguna region con esas iniciales<br>Existentes: BR, EUNE, EUW, JP, KR, LAN, LAS, NA, OCE, RU, TR',
    french: 'Impossible de trouver la région<br>Existantes: BR, EUNE, EUW, JP, KR, LAN, LAS, NA, OCE, RU, TR',
  },
  inputOneSummonerName: {
    english: 'Please input at least one summoner name',
    spanish: 'Por favor primero ingrese el nombre de un invocador',
    french: 'Merci d\'entrer au moins un nom d\'invocateur',
  },

  deleteHistory: {
    english: 'Delete history',
    spanish: 'Eliminar historia',
    french: 'Effacer l\'historique',
  },
  thisWillRemoveLobbyAreYouSure: {
    english: 'This will remove this champion select lobby from your history<br>Are you sure?',
    spanish: 'Estás seguro que deseas de eliminar esta partida de la historia?',
    french: 'Ceci va effacer cette selection de champion de votre historique<br>Comfirmer?',
  },
  
  disconnected: {
    english: 'Disconnected',
    spanish: 'Desconectado',
    french: 'Déconnecté',
  },
  lolDisconnected: {
    english: 'LoL disconnected',
    spanish: 'LoL desconectado',
    french: 'LoL déconnecté',
  },
  cscNotConnectingToLCU: {
    english: 'CSC wasn\'t able to connect to the League of Legends app. Try restarting <u>League of Legends</u>',
    spanish: 'CSC no pudo conectarse a la aplicación de League of Legends. Pruebe reiniciar <u>League of Legends</u>',
    french: 'CSC n\'a pas pu se connecter à l\'application League of Legends. Essayez de relancer <u>League of Legends</u>',
  },

  announcement: {
    english: 'Announcement',
    spanish: 'Anuncios',
    french: 'Annonces',
  },

  checkingForUpdates: {
    english: 'Checking for updates...',
    spanish: 'Buscando actualizaciones...',
    french: 'Vérification des mises à jour...',
  },
  appIsUpToDate: {
    english: 'The app is up to date',
    spanish: 'La aplicación está actualizada',
    french: 'L\'application est à jour',
  },
  checkForUpdates: {
    english: 'Check for updates',
    spanish: 'Buscar actualizaciones',
    french: 'Actualiser la version',
  },
  updateAvailable: {
    english: 'An update is available',
    spanish: 'Una actualización está disponible',
    french: 'Une mise à jour est disponnible',
  },
  downloadUpdate: {
    english: 'Download update',
    spanish: 'Descargar actualización',
    french: 'Télécharger la mise à jour',
  },
  updateNow: {
    english: 'Update now',
    spanish: 'Actualizar ahora',
    french: 'Actualiser maintenant',
  },

  update: {
    english: 'Update',
    spanish: 'Actualización',
    french: 'Mise à jour',
  },
  updateIsAvailable: {
    english: 'An update is available, consider updating via settings or restarting CSC',
    spanish: 'Una actualización está disponible, se recomienda actualizar en opciones o reiniciar CSC',
    french: 'Une mise à jour est disponnible, pensez à actualiser votre version via les paramètres ou en relancant CSC',
  },
  language: {
    english: 'Language',
    spanish: 'Idioma',
    french: 'Langue',
  },
  languageText: {
    english: 'Select your preferred language. <br><i>Note: Certain texts such as patch notes will remain in English.</i>',
    spanish: 'Escoja su idioma preferido. <br><i>Nota: Ciertos textos como noticias recientes no se han traducido.</i>',
    french: 'Selectionnez une langue de préférence. <br><i>Note: Certains textes comme les notes de patchs resterons en anglais.</i>',
  },

  enterRegion:  {
    english: 'ENTER REGION',
    spanish: 'INGRESE REGIÓN',
    french: 'ENTRER RÉGION',
  },
  

  /////////////////////
  //Extracted from HTML
  waitingForCS: {
    english: "Waiting for<br>champion select",
    spanish: 'Esperando la<br>próxima partida',
    french: 'En attente de la selection de champions',
  },
  clonesTheCurrent: {
    english: "Clones the current champion select<br>into an editable one",
    spanish: 'Copia la partida actual a<br>otra igual editable',
    french: 'Copier la selection de champions actuelle<br>dans une version modifiable',
  },
  WelcomeToCSC: {
    english: "\n          Welcome to Champion Select Coach (CSC)<br><br>\n          This app delivers advanced machine learning techniques applied to League of Legends data<br><br>\n          The provided results are trained, tested and validated on millions of ranked games to give you as trustworthy information as possible\n        ",
    spanish: '\n          Bienvenidos a Champion Select Coach (CSC)<br><br>\n          Esta aplicación aplica técnicas avanzadas de inteligencia artificial a datos de League of Legends<br><br>\n          Los datos presentados fueron aprendidos y probados usando millones de partidas clasificatorias para que sean lo más confiables posible\n        ',
    french: '\n          Bienvenue dans Champion Select Coach (CSC)<br><br>\n          Cet outil fait appel à des techniques d\'intelligence artificielle (IA) en se basant sur des données de parties de League of Legends<br><br>\n          Tous les resultats fournis sont le fruit de l\'entrainement, du test, et de la validation de l\'IA sur des millions de parties classés pour donner les resultats les plus crédibles possibles\n',
  },
  currentLobby: {
    english: "\n                CURRENT LOBBY\n              ",
    spanish: '\n                ESTA PARTIDA\n              ',
    french: '\n                PARTIE ACTUELLE\n              ',
  },
  currentLobbyText: {
    english: "\n                When connected to the League of Legends client, CSC will automatically sync with the champion select lobby for normal or ranked games.\n              ",
    spanish: '\n                Al estar conectado al cliente de League of Legends, CSC automáticamente se sincroniza con los datos de partidas normales o clasificatorias.\n              ',
    french: '\n                Lorsqu\'il est connecté au client League of Legends, CSC va automatiquement se synchroniser avec la selection de champion pour la file normale et classée',
  },
  lobbyHistory: {
    english: "\n                PAST LOBBIES\n              ",
    spanish: '\n                PARTIDAS PASADAS\n              ',
    french: '\n                HISTORIQUE DES PARTIES\n              ',
  },
  lobbyHistoryText: {
    english: "\n                You can browse past lobbies here.\n                Subscribed members can create new editable lobbies as well.\n              ",
    spanish: '\n                Aquí se pueden encontrar partidas pasadas.\n                Miembros suscritos pueden además crear partidas nuevas editables.\n              ',
    french: '\n                Vous pouvez voir vos parties précédentes ici.\n                Les abonnés peuvent créer des selections de champion modifiables.\n              ',
  },
  personalInfo: {
    english: "\n                PLAYER INFO\n              ",
    spanish: '\n                INFORMACIÓN DEL JUGADOR\n              ',
    french: '\n                INFOS DU JOUEUR\n              ',
  },
  personalInfoText: {
    english: "\n                When connected to the League of Legends client, you can open a page displaying personal machine learning scores and some performance statistics.\n                Subscribed members can also see the scores for other players.\n              ",
    spanish: '\n                Al estar conectado al cliente de League of Legends, podrá abrir una página mostrando puntuajes personales otorgadas por la inteligencia artificial y ciertas estadísticas de las partidas anteriores.\n                Miembros suscritos pueden además abrir esta información de otros jugadores.\n              ',
    french: '\n                Connecté au client League of Legends, vous pouvez ouvrir une page affichant les scores personels de l\'IA et des statistiques sur ses performances.\n                Les abonnés peuvent aussi voir les scores de l\'IA pour les autres joueurs.\n              ',
  },
  swapRole: {
    english: "Swap role",
    spanish: 'Intercambiar posición',
    french: 'Interchanger les rôles',
  },
  swapChampion: {
    english: "Swap champion",
    spanish: 'Intercambiar campeón',
    french: 'Interchanger les champions',
  },
  soloScoreInfo: {
    english: "Solo score<br>This score shows the predicted score difference from <br>5.0 which this player would have in this lobby, <br>if all other players are replaced with unknown.",
    spanish: 'Puntaje Solo<br>Este puntaje muestra la diferencia entre 5.0 <br>y el puntuaje que recibe este jugador sólo, si los <br>demás jugadores se remplazan con un jugador vacío',
    french: 'Score individuel<br>Ce score indique la difference avec un score de <br>5.0, pour le joueur en question, si l\'on masque l\'information <br>provenant des autres joueurs de la selection de champion.',
  },
  teamScoreInfo: {
    english: "Team score<br>This score shows the difference <br>where we to remove this player <br>and replace with an unknown player. <br>So the score represents the synergy <br>with the rest of the team",
    spanish: 'Puntaje sinergia<br>Este puntaje muestra la diferencia <br>en puntaje si este jugador se <br>remmplaza por un jugador vacío. <br>Por lo cual este puntaje representa la sinergia <br>este jugador tiene con el resto del equipo',
    french: 'Score d\'équipe<br>Ce score indique la difference avec un score de 5.0, si l\'on masque l\'information provenant du joueur en question. Ce score represente donc la synergie du reste de l\'équipe.',
  },
  recentGames: {
    english: "Recent Games",
    spanish: 'Partidas recientes',
    french: 'Parties récentes',
  },
  daysAgoPlayed: {
    english: "Days ago played",
    spanish: 'Hace cuantos días jugado',
    french: 'Dernière partie (en jours)',
  },
  winRate: {
    english: "Win Rate",
    spanish: 'Ganadas',
    french: 'Ratio de victoires',
  },
  percentOnMainRole: {
    english: "Percentage of games on main role",
    spanish: 'Porcentaje de partidas en posición primaria',
    french: 'Pourcentage de parties dans le rôle principal',
  },
  noRankedGamesFound: {
    english: "No ranked games found",
    spanish: 'No se encontraron <br>partidas clasificatorias',
    french: 'Aucune partie classée',
  },
  daysAgo: {
    english: "Days ago",
    spanish: 'Hace cuantos días',
    french: 'Dernière partie (en jours)',
  },
  prioScoreInfo: {
    english: "Prio score<br>Role XP difference at minute 3:00",
    spanish: 'Puntaje temprano<br>Diferencia en XP de esta posición al minuto 3:00',
    french: 'Score de priorité<br>Difference d\'XP prédite à 3 minutes',
  },
  percentOnSecondaryRole: {
    english: "Percentage of games on secondary role",
    spanish: 'Porcentaje de partidas en posición secundaria',
    french: 'Pourcentage de parties dans le rôle secondaire',
  },
  laneScoreInfo: {
    english: "Lane score<br>Role XP &amp; Gold difference at the end of laning phase",
    spanish: 'Puntaje línea<br>Diferencia en XP &amp; Oro al concluir la fase de línea',
    french: 'Score de lane<br>Difference en XP &amp; en golds prédite à la fin de la phase de lane',
  },
  recommendedBans: {
    english: "Recommended bans",
    spanish: 'Bloqueos recomendados',
    french: 'Bannissements recommandés',
  },
  perRole: {
    english: "Per role",
    spanish: 'Por posición',
    french: 'Par rôle',
  },
  partialScoreInfo: {
    english: "Score if only your team's players are known",
    spanish: 'Puntaje si solamente se saben los jugadores de tu equipo',
    french: 'Score si l\'information provient seulement des joueurs de votre équipe',
  },
  fullScoreInfo: {
    english: "Total score given by the AI to your team",
    spanish: 'Puntaje total de la inteligencia artificial',
    french: 'Score total donné par l\'IA pour votre équipe',
  },
  enemyPartialScoreInfo: {
    english: "Opponent score if only their team's players are known (higher means harder to win for your team)",
    spanish: 'Puntaje adversaria si solamente se saben sus jugadores',
    french: 'Score si l\'information provient uniquement des joueurs de l\'équipe adverse (score élevé suggere une partie difficile à gagner)',
  },
  baronsInfo: {
    english: "Predicted amount of barons taken",
    spanish: 'Número de barones predicho',
    french: 'Nombre prédit de barons tués',
  },
  dragonsInfo: {
    english: "Predicted amount of dragons taken",
    spanish: 'Número de dragones predicho',
    french: 'Nombre prédit de dragons tués',
  },
  heraldsInfo: {
    english: "Predicted amount of heralds taken",
    spanish: 'Número de heralds predicho',
    french: 'Nombre prédit de hérauts tués',
  },
  gameLengthInfo: {
    english: "Predicted game length",
    spanish: 'Duración predicha de la partida',
    french: 'Durée prédite de la partie',
  },
  firstBloodInfo: {
    english: "Predicted odds to take first blood",
    spanish: 'Probabilidad de obtener primera sangre',
    french: 'Chance de premier sang prédite',
  },
  damageInfo: {
    english: "Predicted damage distribution",
    spanish: 'Distribución del daño predicha',
    french: 'Distribution des dégats prédite',
  },
  turretDamageInfo: {
    english: "Predicted damage to turrets distribution",
    spanish: 'Distribución del daño a torretas predicha',
    french: 'Distribution des dégats aux structures prédite',
  },
  goldInfo: {
    english: "Predicted gold distribution",
    spanish: 'Distribución de oro predicha',
    french: 'Distribution des golds prédite',
  },
  killParticipationInfo: {
    english: "Predicted kill participation distribution",
    spanish: 'Distribución de la participación en matanzas predicha',
    french: 'Distribution de la participation aux tués prédite',
  },
  notInARankedGame: {
    english: "Not in a ranked game",
    spanish: 'No está en una partida clasificatoria',
    french: 'Pas dans une partie classée',
  },
  noRankedGamesFoundForSome: {
    english: "No ranked games found for some players",
    spanish: 'No se encontraron partidas clasificatorias para ciertos jugadores',
    french: 'Aucune partie classée n\'a été trouvée pour certains joueurs',
  },
  resultsLessAccurate: {
    english: "Results will be less accurate",
    spanish: 'Los resultados serán menos exactos',
    french: 'Les resultats seront moins précis',
  },
  side: {
    english: "Side",
    spanish: 'Lado',
    french: 'Coté',
  },
  blue: {
    english: "Blue",
    spanish: 'Azul',
    french: 'Bleu',
  },
  red: {
    english: "Red",
    spanish: 'Rojo',
    french: 'Rouge',
  },
  queue: {
    english: "Queue",
    spanish: 'Clasificatoria',
    french: 'File',
  },
  soloQ: {
    english: "SoloQ",
    spanish: 'Sólo',
    french: 'SoloQ',
  },
  flex: {
    english: "Flex",
    spanish: 'Flex',
    french: 'Flex',
  },
  region: {
    english: "Region",
    spanish: 'Región',
    french: 'Région',
  },
  predictionHistogram: {
    english: "Prediction Histogram",
    spanish: 'Histograma de Predicciones',
    french: 'Histogramme de prédictions',
  },
  cscScore: {
    english: "CSC Score",
    spanish: 'Puntaje CSC',
    french: 'Score CSC',
  },
  allGames: {
    english: "All games",
    spanish: 'Todas',
    french: 'Toutes les parties',
  },
  cscUsers: {
    english: "CSC users",
    spanish: 'Usuarios de CSC',
    french: 'Utilisateurs CSC',
  },
  playMoreGamesToUnlock: {
    english: "Play more ranked games to unlock this view",
    spanish: 'Ha de jugar más partidas clasificatorias para ver esta parte',
    french: 'Jouez plus de parties classées pour voir ceci',
  },
  soloScore: {
    english: "Solo score",
    spanish: 'Puntaje sólo',
    french: 'Score individuel',
  },
  damage: {
    english: "Damage",
    spanish: 'Daño',
    french: 'Dégats',
  },
  sorting: {
    english: "Sorting",
    spanish: 'Ordenar por',
    french: 'Trier par',
  },
  games: {
    english: "Games",
    spanish: 'Partidas',
    french: 'Parties',
  },
  csOpponentRole: {
    english: "VS Opponent Role",
    spanish: 'Contra posición adversaria',
    french: 'Contre l\'adversaire (même rôle)',
  },
  vsTeamBest: {
    english: "VS Team Best",
    spanish: 'Contra el mejor en el equipo',
    french: 'Contre le meilleur joueur de l\'équipe adverse',
  },
  averageSoloScores: {
    english: "Average Solo Scores",
    spanish: 'Promedios de Puntajes Sólo',
    french: 'Score individuel moyen',
  },
  averageSoloScoreAll: {
    english: "Average solo score of all games",
    spanish: 'Promedio del puntaje sólo de todas las partidas',
    french: 'Score individuel moyen sur toutes les parties',
  },
  total: {
    english: "Total",
    spanish: 'Total',
    french: 'Total',
  },
  averageSoloScore3Champs: {
    english: "Average solo score on 3 most played champions",
    spanish: 'Promedio del puntaje sólo usando los 3 campeónes más jugados',
    french: 'Score individuel moyen sur les 3 champions les plus joués',
  },
  averageSoloScoreMainRole: {
    english: "Average solo score on main role",
    spanish: 'Promedio del puntaje sólo en la posición primaria',
    french: 'Score individuel moyen dans le rôle principal',
  },
  averageSoloScoreSecondaryRole: {
    english: "Average solo score on secondary role",
    spanish: 'Promedio del puntaje sólo en la posición secundaria',
    french: 'Score individuel moyen dans le rôle secondaire',
  },
  cscHistory: {
    english: "CSC History",
    spanish: 'Historia CSC',
    french: 'Historique CSC',
  },
  totalGames: {
    english: "Total games",
    spanish: 'Partidas total',
    french: 'Parties totales',
  },
  accuracy: {
    english: "Accuracy",
    spanish: 'Precisión',
    french: 'Précision',
  },
  cscHistoryIsEmpty: {
    english: "CSC history is empty",
    spanish: 'La historia CSC está vacía',
    french: 'Historque CSC vide',
  },
  whichScoreToShow: {
    english: "Which score to show",
    spanish: 'Qué puntaje mostrar',
    french: 'Quel score montrer',
  },
  championSelect: {
    english: "Champion Select",
    spanish: 'Selección de campeones',
    french: 'Selection de champions',
  },
  inGame: {
    english: "In-Game",
    spanish: 'En la partida',
    french: 'En jeu',
  },

  //FAQ
  whatDoesTheScoreRepresent: {
    english: "What does the score represent?",
    spanish: '¿Qué simbolizan los puntajes?',
    french: 'Que representent les scores?',
  },
  whatDoesTheScoreRepresentAnswer: {
    english: "\n          Each 1.0 is 10% win rate, so a 5.6 score will be predicted to win at 56% chance.\n          For individual scores they are a difference either from 5.0 (ex. solo scores), or from the current score (ex. alternative champion picks), depending on the context.\n        ",
    spanish: 'Cada 1.0 son 10%, así que un 5.6 indica que la probabilidad para ganar es 56%. Puntajes individuales son diferencias comparando con 5.0 (ej. puntajes sólo), o comparando con el puntaje actual (ej. otros campeones)',
    french: 'Chaque 1.0 de score represente 10% de chance de gagner la partie. Par exemple, pour un score CSC de 5.6, vous avez en moyenne 56% de chance de gagner la partie.\n          Les autres scores sont calculés comme la différence par rapport à un score de 5.0 (ex : le scores individuel).\n        ',
  },

  doesItWorkOnNormals:{
    english: 'Does it work on normal games?',
    spanish: '¿Funciona en partidas normales?',
    french: 'CSC fonctionne-t-il en file normale ?',
  },
  doesItWorkOnNormalsAnswer: {
    english: "\n          The AI was only trained on (millions of) <span class=\"faq-highlight\">ranked</span> solo and flex games.\n          Scores for game modes other than solo/flex queue will be less accurate, and should be used with a grain of salt.\n        ",
    spanish: 'La inteligencia artificial aprendió mirando solamente (millones de) partidas <span class=\"faq-highlight\">clasificatorias</span> sólo/flex. Puntajes en otros modos son un poco menos exactos',
    french: 'L\'intelligence artificielle à été entrainée seulement sur des parties classées de <span class=\"faq-highlight\">ranked</span> soloQ et flex. Les scores calculés dans les autres modes de jeux seront donc moins précis.',
  },

  whyBadIndividual:{
    english: 'Why do I have a bad individual score when I have great winrate?',
    spanish: '¿Por qué tengo puntaje sólo negativo si tengo tan buena racha de victorias?',
    french: 'Pourquoi j\'ai un mauvais score individuel alors que j\'ai un très bon ratio de victoire ?',
  },
  whyBadIndividualAnswer: {
    english: "\n          The AI is aware of the winrate, but it also looks at many more things around your performance in game.\n          Maybe you have climbed to a new elo in which however you are playing is no longer good enough to continue climbing.\n          The opposite is also true where you some players may have bad winrates but high scores.\n        ",
    spanish: 'La inteligencia artificial ve que has ganado, pero también ve muchos más detalles acerca de cada partida. Quizás ha escalado a un rango más alto en el cual la inteligencia artificial predice que si no mejora no seguirá ganando de la misma manera. Lo contrario también puede ser, que ciertos jugadores que han perdido muchas partidas jugaron bien, pero tuvieron mala suerte.',
    french: '\n          L\'IA à connaisance de votre ratio de victoire, mais c\'est loin d\'etre la seule chose qu\'elle prends en compte ! \n          Peut-etre que vous êtes arrivé à un elo où ce que vous faites n\'est plus suffisant pour continuer de monter.\n          Le contraire est aussi vrai, il y a des joueurs qui ont un mauvais ratio de victoire, mais de très bons scores CSC.\n          ',
  },

  counteredChampions:{
    english: "How come it's recommending champions that would get countered?",
    spanish: '¿Cómo es que me recomienda jugar campeones que son débiles contra el campeón adversario?',
    french: 'Comment l\'IA recommande-t-elle les contres à certains champions ?',
  },
  counteredChampionsAnswer: {
    english: "\n          The AI is aware of counterpicks as well, but it also knows to put them in perspective of champion mastery.\n          More often than not, picking a champion on which the player has experience is preferred even when countered by the enemy champion (if the goal is to win the game).\n        ",
    spanish: 'La inteligencia artificial conoce bien las interacciones de los campeones, pero también sabe poner esta información en perpectiva a cuánto el jugador conoze cada campeón. Muchas veces es mejor jugar un campeón que el jugador conoce bien (si la meta es ganar la partida).',
    french: '\n          L\IA à conscience des contres aux divers champions, mais aussi de la maitrise des joueurs en parallèle.\n          Le plus souvent, verrouiller un champion que l\'on maitrise à l\'air plus important que le fait de se faire contrer par un autre champion (le but est de gagner la partie, pas forcement la lane).\n          ',
  },

  howReliableAreTheScores:{
    english: 'How reliable are the scores?',
    spanish: '¿Cuánto se puede uno fiar de los resultados?',
    french: 'Les scores CSC sont-ils fiables ?',
  },
  howReliableAreTheScoresAnswer: {
    english: "\n          The AI doesn't just predict who will win, but gives a win chance.\n          Over many games, this chance is extremely accurate, so for example exactly 60% of games where the AI said 6.0 were then actually won.\n          Likewise, when the AI isn't sure, it will say values closer to 5.0.\n          The overall accuracy of the AI is ~60.5% (pre-game scores), however the accuracy for a single score is the score itself. The accuracy of 5.3 is 53%.\n          It is normal that for fewer games the statistics can differ a lot in both directions, just like flipping a coin won't give you exactly 50% of each outcome.\n        ",
    spanish: 'La inteligencia artificial no sólo predice quien va a ganar, sino que da un porcentaje. Sobre muchas partidas, el porcentaje es extremadamente preciso, por ejemplo exáctamente 60% de las partidas en donde el puntaje fué 6.0 se ganaron. De igual manera, cuando la inteligencia artificial no está segura, el puntaje se acerca a 5.0. La precisión promedia total es de ~60.5% (puntajes antes del inicio de la partida), pero la precisión de cada puntaje es el puntaje mismo. Un puntaje de 5.3 tiene una precisión de 53%. Es normal que las estadísticas pueden variar mucho al mirar solamente unas pocas partidas, igual como cuando al lanzar una moneda unas veces no se reciben exáctamente 50% de cada resultado.',
    french: '\n          L\'IA ne predit pas qui va gagner avec certitude, mais plutôt un pourcentage de chance de gagner.\n          Sur un grand nombre de parties, les resultats sont très précis. Par exemple, sur toutes les parties notés 6.0, exactement 60% d\'entres elles ont été gagnées.\n          De la même façon, lorsque l\'IA n\'est pas certaine, les scores se situeront plutôt autour de 5.0.\n          La précision moyenne de l\'IA, avant de connaitre l\'identité des joueurs de l\'équipe adverse, est actuellement de 60.5%.',
  },

  whoAreDevs:{
    english: 'Who are the devs behind the AI?',
    spanish: '¿Quienes son los creadores de la aplicación?',
    french: 'Qui sont les developpeurs de CSC ?',
  },
  whoAreDevsAnswer: {
    english: "\n          This project is made by a single person with some help from others from time to time.\n          I am a master elo EUW/EUNE player, who also has worked with machine learning both in the industry and the academy for over 10 years.\n          This started as a tool for my own private use in 2018.\n          After realizing how useful it was, I decided to share it with the community since 2020.\n          I have been prioritizing the improvement of the AI above anything else, making small improvements over time.\n          Feel free to reach out to me on Discord or on LinkedIn!\n        ",
    spanish: 'Este proyecto fue creado por una persona con la ayuda de otros de vez en cuando. Yo soy un jugador de EUW/EUNE master, que ha trabajado con inteligencia artificial en la industría y academía por más de 10 años. Hice estas prediciones en 2018 para uso propio, pero al ver lo útiles que son, decidí compartirlas con la comunidad desde 2020. Siempre he priorizado mejorar la precisión más que cualquier otra cosa, mejorando poco a poco con el tiempo. Puede contactarme en Discord o LinkedIn, sería un gusto!',
    french: '\n          Ce projet est l\'oeuvre d\'une seule personne, avec parfois un peu d\'aide sur la base du volontariat.\n          Je suis un joueur master EUW/EUNE, qui a travaillé dans le machine learning à la fois dans l\'académique et dans l\'industrie depuis maintenant 10 ans.\n          J\'ai créé cet outil pour mon usage personnel en 2018.\n          Après avoir réalisé à quel point il pouvrait m\'etre utile, j\'ai décidé de le rendre public en 2020.\n          L\'amélioration de l\'IA à toujours été la priorité dans mon travail, en faisant des petits ajustements au cours du temps.\n          N\'hesitez pas à rejoindre mon Discord, ou à me suivre sur LinkedIn ! \n           ',
  },

  howDoesAIPatch:{
    english: 'How does the AI deal with patch changes in LoL?',
    spanish: '¿Cuan bien se adapta a cambios de LoL?',
    french: 'L\'IA s\'adapte-t-elle au changements de patchs sur LoL ?',
  },
  howDoesAIPatchAnswer: {
    english: "\n          The AI is constantly training on most, if not all, ranked games - soloQ &amp; flex, to keep up to date.\n          We have observed how when new champions are released, the AI can still give a roughly accurate score for champions it has never seen in the past, \n          and the overall accuracy doesn't really drop in a noticeable manner.\n          We keep updating the AI on a regular basis, to follow the small details of the patch changes.\n        ",
    spanish: 'La inteligencia artificial esta constantemente aprendiendo de casi todas las partidas clasificatorias - sólo/flex, para mantenerse al día. Hemos observado que aún cuando salen nuevos campeones, la inteligencia artificial es capaz de dar un puntaje aproximado, y la precisión no baja de manera notable. Seguiremos actualizando el modelo de manera cotidiana, para seguir los pequeños cambios cuando ocurren',
    french: '\n          L\'IA est entrainée sur toutes des parties classées soloQ &amp; flex qui se jouent tous les jours.\n          Même lorsque de nouveaux champions sortent, l\'IA arrive tout de même à donner un score, et sa precision ne baisse pas de manière significative. \n          Nous continuons de mettre à jour l\'IA de façon regulière, pour suivre au mieux les changements lors de sorties de patchs.\n          ',
  },

  addFeatureX:{
    english: 'Can you add feature X?',
    spanish: '¿Se puede añadir función X?',
    french: 'Pourrait-on ajouter une fonctionnalité ?',
  },
  addFeatureXAnswer: {
    english: "\n          Please write your ideas in the discord, maybe even someone has already lifted it.<br>\n          For features related to results, generally speaking, this app will be AI based all the way, never depending on anyone's understanding of the game.\n          We will not add outputs which are based on some rule of thumb on a statistic, since these can be flawed, are based on opinion, and vary over time.\n          This way we ensure integrity and accuracy of results, since we can test and measure it.\n        ",
    spanish: 'Por favor cuéntenos de sus ideas en discord, tal vez alguien más ya lo mencionó. Para funciones relacionadas a resultados, generalmente esta aplicación las basará solamnete en inteligencia artificial para nunca tener que depender del conocimiento humano el cual puede ser limitado, basado en opiniones, y cambiar con el tiempo. De esta manera aseguramos la integridad de los resultados, al poder probarlos y medirlos',
    french: '\n          Venez nous en parler sur Discord ! Mais peut-etre que quelqu\'un a eu l\'idée avant vous !<br>\n          Pour les fonctionnalités liées aux résultats, cette outil reposera toujours sur de l\'IA, et jamais sur l\'interpretation personnelle de quelqu\'un.\n          Nous n\'ajouterons pas non plus de résultats basés sur des tests statistiques, car ils peuvent être l\'objet de biais, et sont sujet à interpretation.\n          De cette manière, nous serons toujours sûrs de l\'intergrité et de la précision des résultats, car nous pourrons toujours les mesurer !',
  },

  translateToY:{
    english: 'Can you translate to language Y?',
    spanish: '¿Se puede traducir a idioma Y?',
    french: 'Pourrez-vous traduire CSC d\'autres langues ?',
  },
  translateToYAnswer: {
    english: "\n          If you can help us translate to a new language or if you find issues in the current translations, please let us know on the discord.\n          However, patch notes and dynamic notifications will be in English for the time being.\n        ",
    spanish: 'Si usted puede ayudar con una traducción o si encuentra errores en una traducción por favor infórmenos en discord. Lástimamente, las noticias no se traducen por ahora.',
    french: '\n          Si vous voulez nous aider à traduire CSC dans une nouvelle langue, ou si vous voyez des problèmes avec la traduction dans votre langue, Merci de nous en faire part sur le Discord !\n          Cela dit, les notes de patch ainsi que les mises à jour dynamiques resterons en anglais pour le moment.',
  },

  joinDiscord: {
    english: "Join our <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a> community where we discuss results and future features!",
    spanish: 'Únete a nuestra comunidad en <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a> en donde discutimos resultados y qué funciones añadir.',
    french: 'Rejoignez notre communauté <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a> où nous discutons des résultats et des futures fonctionnalités !',
  },

  //Settings
  settings: {
    english: "SETTINGS",
    spanish: 'OPCIONES',
    french: 'OPTIONS',
  },
  appVersion: {
    english: "App version:",
    spanish: 'Versión:',
    french: 'Version:',
  },
  betaInfo: {
    english: "\n          Check this if you want to help test the newest <br>\n          features before they are added for everyone",
    spanish: '\n          Seleccione si desea ayudar a probar las nuevas <br>\n          funciones antes de que sean publicadas a todos',
    french: '\n          Cochez ceci si vous voulez aider à tester les <br>\n          nouvelles versions avant les autres utilisateurs',
  },
  betaText: {
    english: "Enable experimental features",
    spanish: 'Incluir funciones experimentales',
    french: 'Inclure les fonctionnalités experimentales',
  },
  csLobby: {
    english: "Champion Select Lobby",
    spanish: 'Lobby de la partida',
    french: 'Lobby de la selection de champion',
  },
  autoOpenCSC: {
    english: "Automatically open CSC",
    spanish: 'Automáticamente abrir CSC',
    french: 'Ouvrir CSC automatiquement',
  },
  onLCUStart: {
    english: "When LoL starts",
    spanish: 'Al inicial LoL',
    french: 'Lorsque LoL démarre',
  },
  onCSLobby: {
    english: "In champion select lobby",
    spanish: 'En el lobby de la partida',
    french: 'En selection de champion',
  },
  never: {
    english: "Never",
    spanish: 'Nunca',
    french: 'Jamais',
  },
  toFrontOnCSInfo: {
    english: "\n          This will make the CSC window automatically <br>\n          pop to the front when entering champion select",
    spanish: 'Indica si desea que la ventana de CSC se ponga <br> al frente cuando se inicie un lobby nuevo',
    french: '\n          Ceci fera automatiquement passer CSC en premier <br>\n          plan lorsque vous entrerez dans une selection de champions',
  },
  toFrontOnCS: {
    english: "Focus CSC on champion select",
    spanish: 'Enfocar CSC cada nuevo lobby',
    french: 'Focaliser CSC sur la selection de champion',
  },
  singleThreadInfo: {
    english: "\n          Check this if you are experiencing <br>\n          CPU problems during champion select",
    spanish: 'Limita el uso del CPU a un core',
    french: '\n          Cochez ceci si vous avez des <br>\n          problèmes de CPU pendant la selection de champion',
  },
  singleThread: {
    english: "Single threaded mode",
    spanish: 'Prevenir paralelización CPU',
    french: 'Eviter le multi-threading du CPU',
  },
  changeLanguage: {
    english: "Change Language",
    spanish: 'Cambiar Idioma',
    french: 'Changer la langue',
  },
  getProVersion: {
    english: "Get Pro Version",
    spanish: 'Suscribir a CSC',
    french: 'Abonnez vous à la version pro',
  },
  overwolfSettings: {
    english: "Overwolf Settings",
    spanish: 'Opciones Overwolf',
    french: 'Paramètres Overwolf',
  },

  //Feedback
  feedback: {
    english: "FEEDBACK",
    spanish: 'CONTACTO',
    french: 'CONTACT',
  },
  feedbackJoinDiscord: {
    english: "\n        The best way to contact us is via the <a href=\"https://discord.gg/YGcWxhyXmn\">CSC discord</a>.\n        You can <a href=\"https://discord.gg/Fw9QFKstFk\">report issues</a>, <a href=\"https://discord.gg/fFFaVxCYCQ\">propose new features</a>, \n        discuss ideas or results with other users, check the ongoing status of development, and get in-depth info about the app\n      ",
    spanish: 'La mejor manera de contactarnos es en <a href=\"https://discord.gg/YGcWxhyXmn\">discord</a>. Podrá <a href=\"https://discord.gg/Fw9QFKstFk\">reportar problemas</a>, <a href=\"https://discord.gg/fFFaVxCYCQ\">proponer nuevas funciones</a>, discutir ideas o resultados con otros usuarios, leer acerca del estado del desarrollo, y recibir mejor entendimiento de la aplicación.',
    french: '\n        La façon la plus simple de nous contacter est via notre <a href=\"https://discord.gg/YGcWxhyXmn\">CSC discord</a>.\n        Vous pouvez <a href=\"https://discord.gg/Fw9QFKstFk\">signaler un problème</a>, <a href=\"https://discord.gg/fFFaVxCYCQ\">proposer une fonctionnalité</a>, \n        discuter d\'idées avec d\'autres utilisateurs, vous informer des phases de developpement, et obtenir des informations précises à propos de CSC.\n      ',
  },
  directFeedback: {
    english: "Direct feedback",
    spanish: 'Contacto directo',
    french: 'Contact direct',
  },
  name: {
    english: "Name",
    spanish: 'Nombre',
    french: 'Nom',
  },
  contact: {
    english: "Contact (optional)",
    spanish: 'Contacto (opcional)',
    french: 'Contact (optionnel)',
  },
  message: {
    english: "Message",
    spanish: 'Mensaje',
    french: 'Message',
  },
  noteSlowReplies: {
    english: "Note: Replies will be slower on this channel",
    spanish: 'Nota: Las respuestas tardarán más usando este canal',
    french: 'Note: Les réponses seront plus longues de cette façon',
  },
  canAlsoEmail: {
    english: "You can also email champselectcoach@gmail.com",
    spanish: 'También puede escribir un email a champselectcoach@gmail.com',
    french: 'Vous pouvez aussi contacter par mail champselectcoach@gmail.com',
  },

  //Patch history
  patchHistory: {
    english: "Patch History",
    spanish: 'Historia del desarrollo',
    french: 'Historique des patchs',
  },
  onlyLatest10Patches: {
    english: "Only the latest 10 patches are shown, the rest can be found in our <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a>. \n      There you can also read about the future planned work, or request features.",
    spanish: 'Lástimamente esta información no está traducida.<br>Solamente los últimos 10 cambios se muestran, el resto se encuentra en <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a>. Allá puede además leer acerca de las funciones planeadas para el futuro, o solicitar funciones.',
    french: 'Seulement les 10 derniers patchs sont visibles, le reste peut etre consulté sur notre <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a>. \n      Vous y trouverez aussi les prochains projets de developpement, et les ajouts de fonctionnalités.',
  },
  subscription: {
    english: "Subscription",
    spanish: 'Suscripción',
    french: 'Abonnement',
  },
  removeAds: {
    english: 'Remove ads - get pro version',
    spanish: '¡Suscríbete para quitar los anuncios!',
    french: 'Supprimer les pubs - passez à la version pro',
  },

  //Languages should be in their own language always
  english: {
    english: "English",
  },
  french: {
    english: "Français",
  },
  german: {
    english: "Deutsch",
  },
  polish: {
    english: "Polskie",
  },
  russian: {
    english: "Русский",
  },
  spanish: {
    english: "Español",
  },
  swedish: {
    english: "Svenska",
  },
  turkish: {
    english: "Türk",
  }

}

export class Translator {

  private static reversedCache: any = null;
  private static reversed() {
    if (Translator.reversedCache == null) {
      const languages = [...new Set(Object.values(TranslatedText).map(x => Object.keys(x)).reduce((acc, val) => acc.concat(val), []))];

      const r = {};
      for (const lang of languages) {
        for (const x of Object.keys(TranslatedText)) {
          if (TranslatedText[x][lang] && TranslatedText[x][lang].length > 0) {
            r[TranslatedText[x][lang]] = TranslatedText[x];
          }
        }
      }

      Translator.reversedCache = r;
    }
    return Translator.reversedCache;
  }

  public static updateTranslation(e: HTMLElement) {
    const je = $(e);
    const currHTML = je.html();
    if (currHTML.length == 0) return;

    const defaultLanguage = 'english';
    const currLang = LocalStorage.getLanguage();
    const r = Translator.reversed();
    if (r[currHTML]) {
      
      let newHTML = r[currHTML][currLang];
      if (!newHTML || newHTML.length == 0) {
        newHTML = r[currHTML][defaultLanguage];
      }
      if (newHTML == null) {
        Logger.warn('Bug when translating: ' + currHTML);
      } else if (currHTML != newHTML) { //There is an event each time the html is changed so important not to signal this if there is no change to prevent infinite loop
        je.html(newHTML);
      }
    } else {
      Logger.warn('No translation found for: ' + currHTML);
    }
  }

  public static updateAllTranslations() {
    for (const e of $('.translated-text').get()) Translator.updateTranslation(e);
  }



}
