import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { LocalStorage } from "./localStorage"
import { Logger } from "./logger";

export const TranslatedText = {

  /*
    For anyone who wants to contribute read this first:
    All you need to do is add a row to every entry, with the language you are translating to.
    Do not translate two different items into the same text, the text may be the same in different 
    languages in the same item though, for example 'Total' in spanish/english.
    Some fields have formatting parts such as line breaks or other html tags. These should be kept in all translations.
    Line breaks in the format \n, tabs or multiple spaces do not matter (HTML), however when there are line breaks in the format <br>
    then it means these lines should not be much longer than this, and you also have to include <br> in your translations.
    For the translations you can omit characters like \n or multiple spaces in a row since these won't matter in HTML.
    Try to maintain the translations of similar length to prevent issues of text overflowing in the UI.
    For full sentences feel free to paraphrase if it comes more natural.
    It's highly recommended to understand the context of each entry before translating.
    Add //comments or ask if things are uncertain, so we can build and maintain this together over time.

    All the entries after 'Extracted from HTML' were automatically extracted from the HTML via
    JSON.stringify([...new Set($('.translated-text').get().map($).map(x => x.html()))])
    This means that you may not change any character in the English versions of these entries (not even spaces), 
    unless you also make the same change in the original HTML.

  */

  top: {
    english: 'Top', //Example comment
    spanish: 'Superior',
  },
  jungle: {
    english: 'Jungle',
    spanish: 'Jungla',
  },
  mid: {
    english: 'Mid',
    spanish: 'Central',
  },
  bottom: {
    english: 'Bot',
    spanish: 'Inferior',
  },
  support: {
    english: 'Support',
    spanish: 'Soporte',
  },

  pleaseFillInFields: {
    english: 'Please fill in the fields',
    spanish: 'Por favor rellene la información',
  },
  unableToConnect: {
    english: 'Unable to connect to server',
    spanish: 'No se pudo conectar con el servidor',
  },
  thankYouForFeedback: {
    english: 'Thank you for your feedback!',
    spanish: 'Gracias por su contribución!',
  },
  anErrorOccurred: {
    english: 'An unknown error occurred',
    spanish: 'Ocurrió un error inesperado',
  },

  editPlayer: {
    english: 'Edit Player',
    spanish: 'Editar Jugador',
  },
  enterPlayerName: {
    english: 'Enter player name',
    spanish: 'Ingrese el nombre del jugador',
  },
  editChampion: {
    english: 'Edit Champion',
    spanish: 'Editar Campeón',
  },
  enterChampionName: {
    english: 'Enter champion name',
    spanish: 'Ingrese el nombre del campeón',
  },

  error: {
    english: 'Error',
    spanish: 'Error',
  },
  championNotFound: {
    english: 'Champion not found',
    spanish: 'No se encontró un campeón con ese nombre',
  },
  editRegion: {
    english: 'Edit Region',
    spanish: 'Editar Región',
  },
  enterRegionInitials: {
    english: 'Enter region initials',
    spanish: 'Ingrese las iniciales de la región',
  },
  regionNotFound: {
    english: 'Region not found<br>Available: ',
    spanish: 'No se encontró ninguna region con esas iniciales<br>Existentes: ',
  },

  deleteHistory: {
    english: 'Delete history',
    spanish: 'Eliminar historia',
  },
  thisWillRemoveLobbyAreYouSure: {
    english: 'This will remove this champion select lobby from your history<br>Are you sure?',
    spanish: 'Estás seguro que deseas de eliminar esta partida de la historia?',
  },
  
  lolDisconnected: {
    english: 'LoL disconnected',
    spanish: 'LoL desconectado',
  },
  cscNotConnectingToLCU: {
    english: 'CSC wasn\'t able to connect to the League of Legends app. Try restarting <u>League of Legends</u>',
    spanish: 'CSC no pudo conectarse a la aplicación de League of Legends. Pruebe reiniciar <u>League of Legends</u>',
  },

  announcement: {
    english: 'Announcement',
    spanish: 'Anuncios',
  },

  checkingForUpdates: {
    english: 'Checking for updates...',
    spanish: 'Buscando actualizaciones...',
  },
  appIsUpToDate: {
    english: 'The app is up to date',
    spanish: 'La aplicación está actualizada',
  },
  checkForUpdates: {
    english: 'Check for updates',
    spanish: 'Buscar actualizaciones',
  },
  updateAvailable: {
    english: 'An update is available',
    spanish: 'Una actualización está disponible',
  },
  downloadUpdate: {
    english: 'Download update',
    spanish: 'Descargar actualización',
  },
  updateNow: {
    english: 'Update now',
    spanish: 'Actualizar ahora',
  },

  update: {
    english: 'Update',
    spanish: 'Actualización',
  },
  updateIsAvailable: {
    english: 'An update is available, consider updating via settings or restarting CSC',
    spanish: 'Una actualización está disponible, se recomienda actualizar en opciones o reiniciar CSC',
  },
  language: {
    english: 'Language',
    spanish: 'Idioma',
  },
  languageText: {
    english: 'Select your preferred language. <br><i>Note: Certain texts such as patch notes will remain in English.</i>',
    spanish: 'Escoja su idioma preferido. <br><i>Nota: Ciertos textos como noticias recientes no se han traducido.</i>',
  },
  

  /////////////////////
  //Extracted from HTML
  waitingForCS: {
    english: "Waiting for<br>champion select",
    spanish: 'Esperando la<br>próxima partida',
  },
  clonesTheCurrent: {
    english: "Clones the current champion select<br>into an editable one",
    spanish: 'Copia la partida actual a<br>una otra igual editable',
  },
  WelcomeToCSC: {
    english: "\n          Welcome to Champion Select Coach (CSC)<br><br>\n          This app delivers advanced machine learning techniques applied to League of Legends data<br><br>\n          All the provided results are trained, tested and validated on millions of ranked games to give you as trustworthy information as possible\n        ",
    spanish: '\n          Bienvenidos a Champion Select Coach (CSC)<br><br>\n          Esta aplicación aplica técnicas avanzadas de inteligencia artificial a datos de League of Legends<br><br>\n          Todos los datos presentados fueron aprendidos y probados usando miliones de partidas clasificadas para que sean lo más confiables posible\n        ',
  },
  currentLobby: {
    english: "\n                CURRENT LOBBY\n              ",
    spanish: '\n                ESTA PARTIDA\n              ',
  },
  currentLobbyText: {
    english: "\n                When connected to the League of Legends client, CSC will automatically sync with the champion select lobby for normal or ranked games.\n              ",
    spanish: '\n                Al estar conectado al cliente de League of Legends, CSC automáticamente se sincroniza con los datos de partidas normales o clasificadas.\n              ',
  },
  lobbyHistory: {
    english: "\n                PAST LOBBIES\n              ",
    spanish: '\n                PARTIDAS PASADAS\n              ',
  },
  lobbyHistoryText: {
    english: "\n                You can browse past lobbies here.\n                Subscribed members can create new editable lobbies as well.\n              ",
    spanish: '\n                Aquí se pueden encontrar partidas pasadas.\n                Miembros suscritos pueden además crear partidas nuevas editables.\n              ',
  },
  personalInfo: {
    english: "\n                PLAYER INFO\n              ",
    spanish: '\n                INFORMACIÓN DEL JUGADOR\n              ',
  },
  personalInfoText: {
    english: "\n                When connected to the League of Legends client, you can open a page displaying personal machine learning scores and some performance statistics.\n                Subscribed members can also see the scores for other players.\n              ",
    spanish: '\n                Al estar conectado al cliente de League of Legends, podrá abrir una página mostrando puntuajes personales otorgadas por la inteligencia artificial y ciertas estadísticas de las partidas anteriores.\n                Miembros suscritos pueden además abrir esta información de otros jugadores.\n              ',
  },
  swapRole: {
    english: "Swap role",
    spanish: 'Intercambiar posición',
  },
  swapChampion: {
    english: "Swap champion",
    spanish: 'Intercambiar campeón',
  },
  soloScoreInfo: {
    english: "Solo score<br>This score shows the predicted score difference from <br>5.0 which this player would have in this lobby, <br>if all other players are replaced with unknown.",
    spanish: 'Puntaje Solo<br>Este puntaje muestra la diferencia entre 5.0 <br>y el puntuaje que recibe este jugador sólo, si los <br>demás jugadores se remplazan con un jugador vacío',
  },
  teamScoreInfo: {
    english: "Team score<br>This score shows the difference <br>where we to remove this player <br>and replace with an unknown player. <br>So the score represents the synergy <br>with the rest of the team",
    spanish: 'Puntaje sinergia<br>Este puntaje muestra la diferencia <br>en puntaje si este jugador se <br>remmplaza por un jugador vacío. <br>Por lo cual este puntaje representa la sinergia <br>este jugador tiene con el resto del equipo',
  },
  recentGames: {
    english: "Recent Games",
    spanish: 'Partidas recientes',
  },
  daysAgoPlayed: {
    english: "Days ago played",
    spanish: 'Hace cuantos días jugado',
  },
  winRate: {
    english: "Win Rate",
    spanish: 'Ganadas',
  },
  percentOnMainRole: {
    english: "Percentage of games on main role",
    spanish: 'Porcentaje de partidas en posición primaria',
  },
  noRankedGamesFound: {
    english: "No ranked games found",
    spanish: 'No se encontraron <br>partidas clasificatorias',
  },
  daysAgo: {
    english: "Days ago",
    spanish: 'Hace cuantos días',
  },
  prioScoreInfo: {
    english: "Prio score<br>Role XP difference at minute 3:00",
    spanish: 'Puntaje temprano<br>Diferencia en XP de esta posición al minuto 3:00',
  },
  percentOnSecondaryRole: {
    english: "Percentage of games on secondary role",
    spanish: 'Porcentaje de partidas en posición secundaria',
  },
  laneScoreInfo: {
    english: "Lane score<br>Role XP &amp; Gold difference at the end of laning phase",
    spanish: 'Puntaje línea<br>Diferencia en XP &amp; Oro al concluir la fase de línea',
  },
  recommendedBans: {
    english: "Recommended bans",
    spanish: 'Bloqueos recomendados',
  },
  perRole: {
    english: "Per role",
    spanish: 'Por posición',
  },
  partialScoreInfo: {
    english: "Score if only your team's players are known",
    spanish: 'Puntaje si solamente se saben los jugadores de tu equipo',
  },
  fullScoreInfo: {
    english: "Total score given by the AI to your team",
    spanish: 'Puntaje total de la inteligencia artificial',
  },
  enemyPartialScoreInfo: {
    english: "Opponent score if only their team's players are known (higher means harder to win for your team)",
    spanish: 'Puntaje adversaria si solamente se saben sus jugadores',
  },
  baronsInfo: {
    english: "Predicted amount of barons taken",
    spanish: 'Número de barones predicho',
  },
  dragonsInfo: {
    english: "Predicted amount of dragons taken",
    spanish: 'Número de dragones predicho',
  },
  heraldsInfo: {
    english: "Predicted amount of heralds taken",
    spanish: 'Número de heralds predicho',
  },
  gameLengthInfo: {
    english: "Predicted game length",
    spanish: 'Duración predicha de la partida',
  },
  firstBloodInfo: {
    english: "Predicted odds to take first blood",
    spanish: 'Probabilidad de obtener primera sangre',
  },
  damageInfo: {
    english: "Predicted damage distribution",
    spanish: 'Distribución del daño predicha',
  },
  turretDamageInfo: {
    english: "Predicted damage to turrets distribution",
    spanish: 'Distribución del daño a torretas predicha',
  },
  goldInfo: {
    english: "Predicted gold distribution",
    spanish: 'Distribución de oro predicha',
  },
  killParticipationInfo: {
    english: "Predicted kill participation distribution",
    spanish: 'Distribución de la participación en matanzas predicha',
  },
  notInARankedGame: {
    english: "Not in a ranked game",
    spanish: 'No está en una partida clasificatoria',
  },
  noRankedGamesFoundForSome: {
    english: "No ranked games found for some players",
    spanish: 'No se encontraron partidas clasificatorias para ciertos jugadores',
  },
  resultsLessAccurate: {
    english: "Results will be less accurate",
    spanish: 'Los resultados serán menos exactos',
  },
  side: {
    english: "Side",
    spanish: 'Lado',
  },
  blue: {
    english: "Blue",
    spanish: 'Azul',
  },
  red: {
    english: "Red",
    spanish: 'Rojo',
  },
  queue: {
    english: "Queue",
    spanish: 'Clasificatoria',
  },
  soloQ: {
    english: "SoloQ",
    spanish: 'Sólo',
  },
  flex: {
    english: "Flex",
    spanish: 'Flex',
  },
  region: {
    english: "Region",
    spanish: 'Región',
  },
  predictionHistogram: {
    english: "Prediction Histogram",
    spanish: 'Histograma de Predicciones',
  },
  cscScore: {
    english: "CSC Score",
    spanish: 'Puntaje CSC',
  },
  allGames: {
    english: "All games",
    spanish: 'Todas',
  },
  cscUsers: {
    english: "CSC users",
    spanish: 'Usuarios de CSC',
  },
  playMoreGamesToUnlock: {
    english: "Play more ranked games to unlock this view",
    spanish: 'Ha de jugar más partidas clasificatorias para ver esta parte',
  },
  soloScore: {
    english: "Solo score",
    spanish: 'Puntaje sólo',
  },
  damage: {
    english: "Damage",
    spanish: 'Daño',
  },
  sorting: {
    english: "Sorting",
    spanish: 'Ordenar por',
  },
  games: {
    english: "Games",
    spanish: 'Partidas',
  },
  csOpponentRole: {
    english: "VS Opponent Role",
    spanish: 'Contra posición adversaria',
  },
  vsTeamBest: {
    english: "VS Team Best",
    spanish: 'Contra el mejor en el equipo',
  },
  averageSoloScores: {
    english: "Average Solo Scores",
    spanish: 'Promedios de Puntajes Sólo',
  },
  averageSoloScoreAll: {
    english: "Average solo score of all games",
    spanish: 'Promedio del puntaje sólo de todas las partidas',
  },
  total: {
    english: "Total",
    spanish: 'Total',
  },
  averageSoloScore3Champs: {
    english: "Average solo score on 3 most played champions",
    spanish: 'Promedio del puntaje sólo usando los 3 campeónes más jugados',
  },
  averageSoloScoreMainRole: {
    english: "Average solo score on main role",
    spanish: 'Promedio del puntaje sólo en la posición primaria',
  },
  averageSoloScoreSecondaryRole: {
    english: "Average solo score on secondary role",
    spanish: 'Promedio del puntaje sólo en la posición secundaria',
  },
  cscHistory: {
    english: "CSC History",
    spanish: 'Historia CSC',
  },
  totalGames: {
    english: "Total games",
    spanish: 'Partidas total',
  },
  accuracy: {
    english: "Accuracy",
    spanish: 'Precisión',
  },
  cscHistoryIsEmpty: {
    english: "CSC history is empty",
    spanish: 'La historia CSC está vacía',
  },
  whichScoreToShow: {
    english: "Which score to show",
    spanish: 'Qué puntaje mostrar',
  },
  championSelect: {
    english: "Champion Select",
    spanish: 'Selección de campeones',
  },
  inGame: {
    english: "In-Game",
    spanish: 'En la partida',
  },

  //FAQ
  whatDoesTheScoreRepresent: {
    english: "What does the score represent?",
    spanish: '¿Qué simbolizan los puntajes?',
  },
  whatDoesTheScoreRepresentAnswer: {
    english: "\n          Each 1.0 is 10% win rate, so a 5.6 score will be predicted to win at 56% chance.\n          For individual scores they are a difference either from 5.0 (ex. solo scores), or from the current score (ex. alternative champion picks), depending on the context.\n        ",
    spanish: 'Cada 1.0 son 10%, así que un 5.6 indica que la probabilidad para ganar es 56%. Puntajes individuales son diferencias comparando con 5.0 (ej. puntajes sólo), o comparando con el puntaje actual (ej. otros campeones)',
  },

  doesItWorkOnNormals:{
    english: 'Does it work on normal games?',
    spanish: '¿Funciona en partidas normales?',
  },
  doesItWorkOnNormalsAnswer: {
    english: "\n          The AI was only trained on (millions of) <span class=\"faq-highlight\">ranked</span> solo and flex games.\n          Scores for game modes other than solo/flex queue will be less accurate, and should be used with a grain of salt.\n        ",
    spanish: 'La inteligencia artificial aprendió mirando solamente (miliones de) partidas <span class=\"faq-highlight\">clasificatorias</span> sólo/flex. Puntajes en otros modos son menos exactos, y se deben de tomar con precaución',
  },

  whyBadIndividual:{
    english: 'Why do I have a bad individual score when I have great winrate?',
    spanish: '¿Por qué tengo puntaje sólo negativo si tengo tan buena racha de victorias?',
  },
  whyBadIndividualAnswer: {
    english: "\n          The AI is aware of the winrate, but it also looks at many more things around your performance in game.\n          Maybe you have climbed to a new elo in which however you are playing is no longer good enough to continue climbing.\n          The opposite is also true where you some players may have bad winrates but high scores.\n        ",
    spanish: 'La inteligencia artificial ve que has ganado, pero también ve muchos más detalles acerca de cada partida. Quizás ha escalado a un rango más alto en el cual la inteligencia artificial predice que si no mejora no seguirá ganando de la misma manera. Lo contrario también puede ser, que ciertos jugadores que han perdido muchas partidas jugaron bien, pero tuvieron mala suerte.',
  },

  counteredChampions:{
    english: "How come it's recommending champions that would get countered?",
    spanish: '¿Cómo es que me recomienda jugar campeones que son débiles contra el campeón adversario?',
  },
  counteredChampionsAnswer: {
    english: "\n          The AI is aware of counterpicks as well, but it also knows to put them in perspective of champion mastery.\n          More often than not, picking a champion on which the player has experience is preferred even when countered by the enemy champion (if the goal is to win the game).\n        ",
    spanish: 'La inteligencia artificial conoce bien las interacciones de los campeones, pero también sabe poner esta información en perpectiva a cuánto el jugador conoze cada campeón. Muchas veces es mejor jugar un campeón que el jugador conoce bien (si la meta es ganar la partida).',
  },

  howReliableAreTheScores:{
    english: 'How reliable are the scores?',
    spanish: '¿Cuánto se puede uno fiar de los resultados?',
  },
  howReliableAreTheScoresAnswer: {
    english: "\n          The AI doesn't just predict who will win, but gives a win chance.\n          Over many games, this chance is extremely accurate, so for example exactly 60% of games where the AI said 6.0 were then actually won.\n          Likewise, when the AI isn't sure, it will say values closer to 5.0.\n          The overall accuracy of the AI is ~60.5% (pre-game scores), however the accuracy for a single score is the score itself. The accuracy of 5.3 is 53%.\n          It is normal that for fewer games the statistics can differ a lot in both directions, just like flipping a coin won't give you exactly 50% of each outcome.\n        ",
    spanish: 'La inteligencia artificial no sólo predice quien va a ganar, sino que da un porcentaje. Sobre muchas partidas, el porcentaje es extremadamente preciso, por ejemplo exáctamente 60% de las partidas en donde el puntaje fué 6.0 se ganaron. De igual manera, cuando la inteligencia artificial no está segura, el puntaje se acerca a 5.0. La precisión promedia total es de ~60.5% (puntajes antes del inicio de la partida), pero la precisión de cada puntaje es el puntaje mismo. Un puntaje de 5.3 tiene una precisión de 53%. Es normal que las estadísticas pueden variar mucho al mirar solamente unas pocas partidas, igual como cuando al lanzar una moneda unas veces no se reciben exáctamente 50% de cada resultado.',
  },

  whoAreDevs:{
    english: 'Who are the devs behind the AI?',
    spanish: '¿Quienes son los creadores de la aplicación?',
  },
  whoAreDevsAnswer: {
    english: "\n          This project is made by a single person with some help from others from time to time.\n          I am a master elo EUW/EUNE player, who also has worked with machine learning both in the industry and the academy for over 10 years.\n          This started as a tool for my own private use in 2018.\n          After realizing how useful it was, I decided to share it with the community since 2020.\n          I have been prioritizing the improvement of the AI above anything else, making small improvements over time.\n          Feel free to reach out to me on Discord or on LinkedIn!\n        ",
    spanish: 'Este proyecto fue creado por una persona con la ayuda de otros de vez en cuando. Yo soy un jugador de EUW/EUNE master, que ha trabajado con inteligencia artificial en la industría y academía por más de 10 años. Hice estas prediciones en 2018 para uso propio, pero al ver lo útiles que son, decidí compartirlas con la comunidad desde 2020. Siempre he priorizado mejorar la precisión más que cualquier otra cosa, mejorando poco a poco con el tiempo. Puede contactarme en Discord o LinkedIn, sería un gusto!',
  },

  howDoesAIPatch:{
    english: 'How does the AI deal with patch changes in LoL?',
    spanish: '¿Cuan bien se adapta a cambios de LoL?',
  },
  howDoesAIPatchAnswer: {
    english: "\n          The AI is constantly training on most, if not all, ranked games - soloQ &amp; flex, to keep up to date.\n          We have observed how when new champions are released, the AI can still give a roughly accurate score for champions it has never seen in the past, \n          and the overall accuracy doesn't really drop in a noticeable manner.\n          We keep updating the AI on a regular basis, to follow the small details of the patch changes.\n        ",
    spanish: 'La inteligencia artificial esta constantemente aprendiendo de casi todas las partidas clasificadas - sólo/flex, para mantenerse al día. Hemos observado que aún cuando salen nuevos campeones, la inteligencia artificial es capaz de dar un puntaje aproximado, y la precisión no baja de manera notable. Seguiremos actualizando el modelo de manera cotidiana, para seguir los pequeños cambias cuando ocurren',
  },

  addFeatureX:{
    english: 'Can you add feature X?',
    spanish: '¿Pueden añadir función X?',
  },
  addFeatureXAnswer: {
    english: "\n          Please write your ideas in the discord, maybe even someone has already lifted it.<br>\n          For features related to results, generally speaking, this app will be AI based all the way, never depending on anyone's understanding of the game.\n          We will not add outputs which are based on some rule of thumb on a statistic, since these can be flawed, are based on opinion, and vary over time.\n          This way we ensure integrity and accuracy of results, since we can test and measure it.\n        ",
    spanish: 'Por favor cuéntenos de sus ideas en discord, tal vez alguien más ya lo mencionó. Para funciones relacionadas a resultados, generalmente esta aplicación las basará solamnete en inteligencia artificial para nunca tener que depender del conocimiento humano el cual puede ser limitado, basado en opiniones, y cambiar con el tiempo. De esta manera aseguramos la integridad de los resultados, al poder probarlos y medirlos',
  },

  translateToY:{
    english: 'Can you translate to language Y?',
    spanish: '¿Puede traducir a idioma Y?',
  },
  translateToYAnswer: {
    english: "\n          If you can help us translate to a new language or if you find issues in the current translations, please let us know on the discord.\n          However, patch notes and dynamic notifications will be in English for the time being.\n        ",
    spanish: 'Si usted puede ayudar con una traducción o si encuentra errores en una traducción por favor infórmenos en discord. Lástimamente, las noticias no se traducen por ahora.',
  },

  joinDiscord: {
    english: "Join our <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a> community where we discuss results and future features!",
    spanish: 'Únete a nuestra comunidad en <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a> en donde discutimos resultados y qué funciones añadir.',
  },

  //Settings
  settings: {
    english: "SETTINGS",
    spanish: 'OPCIONES',
  },
  appVersion: {
    english: "App version:",
    spanish: 'Versión:',
  },
  betaInfo: {
    english: "\n          Check this if you want to help test the newest <br>\n          features before they are added for everyone",
    spanish: '\n          Seleccione si desea ayudar a probar las nuevas <br>\n          funciones antes de que sean publicadas a todos',
  },
  betaText: {
    english: "Enable experimental features",
    spanish: 'Incluir funciones experimentales',
  },
  csLobby: {
    english: "Champion Select Lobby",
    spanish: 'Lobby de la partida',
  },
  autoOpenCSC: {
    english: "Automatically open CSC",
    spanish: 'Automáticamente abrir CSC',
  },
  onLCUStart: {
    english: "When LoL starts",
    spanish: 'Al inicial LoL',
  },
  onCSLobby: {
    english: "In champion select lobby",
    spanish: 'En el lobby de la partida',
  },
  never: {
    english: "Never",
    spanish: 'Nunca',
  },
  toFrontOnCSInfo: {
    english: "\n          This will make the CSC window automatically <br>\n          pop to the front when entering champion select",
    spanish: 'Indica si desea que la ventana de CSC se ponga <br> al frente cuando se inicie un lobby nuevo',
  },
  toFrontOnCS: {
    english: "Focus CSC on champion select",
    spanish: 'Enfocar CSC cada nuevo lobby',
  },
  singleThreadInfo: {
    english: "\n          Check this if you are experiencing <br>\n          CPU problems during champion select",
    spanish: 'Limita el uso del CPU a un core',
  },
  singleThread: {
    english: "Single threaded mode",
    spanish: 'Prevenir paralelización CPU',
  },
  changeLanguage: {
    english: "Change Language",
    spanish: 'Cambiar Idioma',
  },
  getProVersion: {
    english: "Get Pro Version",
    spanish: 'Suscribir a CSC',
  },
  overwolfSettings: {
    english: "Overwolf Settings",
    spanish: 'Opciones Overwolf',
  },

  //Feedback
  feedback: {
    english: "FEEDBACK",
    spanish: 'CONTACTO',
  },
  feedbackJoinDiscord: {
    english: "\n        The best way to contact us is via the <a href=\"https://discord.gg/YGcWxhyXmn\">CSC discord</a>.\n        You can <a href=\"https://discord.gg/Fw9QFKstFk\">report issues</a>, <a href=\"https://discord.gg/fFFaVxCYCQ\">propose new features</a>, \n        discuss ideas or results with other users, check the ongoing status of development, and get in-depth info about the app\n      ",
    spanish: 'La mejor manera de contactarnos es en <a href=\"https://discord.gg/YGcWxhyXmn\">discord</a>. Podrá <a href=\"https://discord.gg/Fw9QFKstFk\">reportar problemas</a>, <a href=\"https://discord.gg/fFFaVxCYCQ\">proponer nuevas funciones</a>, discutir ideas o resultados con otros usuarios, leer acerca del estado del desarrollo, y recibir mejor entendimiento de la aplicación.',
  },
  directFeedback: {
    english: "Direct feedback",
    spanish: 'Contacto directo',
  },
  name: {
    english: "Name",
    spanish: 'Nombre',
  },
  contact: {
    english: "Contact (optional)",
    spanish: 'Contacto (opcional)',
  },
  message: {
    english: "Message",
    spanish: 'Mensaje',
  },
  noteSlowReplies: {
    english: "Note: Replies will be slower on this channel",
    spanish: 'Nota: Las respuestas tardarán más usando este canal',
  },
  canAlsoEmail: {
    english: "You can also email champselectcoach@gmail.com",
    spanish: 'También puede escribir un email a champselectcoach@gmail.com',
  },

  //Patch history
  patchHistory: {
    english: "Patch History",
    spanish: 'Historia del desarrollo',
  },
  onlyLatest10Patches: {
    english: "Only the latest 10 patches are shown, the rest can be found in our <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a>. \n      There you can also read about the future planned work, or request features.",
    spanish: 'Lástimamente esta información no está traducida.<br>Solamente los últimos 10 cambios se muestran, el resto se encuentra en <a href=\"https://discord.gg/YGcWxhyXmn\">Discord</a>. Allá puede además leer acerca de las funciones planeadas para el futuro, o solicitar funciones.',
  },
  subscription: {
    english: "Subscription",
    spanish: 'Suscripción',
  },
  removeAds: {
    english: 'Remove ads - get pro version',
    spanish: 'Suscríbete para quitar los anuncios!',
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