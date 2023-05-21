
export class PatchNotes {

  public static get() {
    return [
      ['v0.0.1', '2021/03/10', 'Initial', ['Initial version']],
      ['v0.0.2', '2021/03/10', 'Minor fixes', ['Minor UI improvements']],
      ['v0.0.3', '2021/03/10', 'Minor fixes', ['Minor UI improvements, app now correctly closes when no longer in use']],
      ['v0.0.4', '2021/03/31', 'Bugfixes', ['The app no longer stops detecting champion select, and is correctly displayed in the Overwolf settings']],
      ['v0.0.5', '2021/04/08', 'Optimizations', [
        'RAM usage optimizations - RAM usage was decreased by ~4x', 
        'Champion select responsiveness - before it would update once each second, now it\'s instant', 
        'Better window management - The main window automatically closes when the score window is opened'
      ]],
      ['v0.1.0', '2021/04/20', 'API + Merged individual scores + Champion Recommendations', [
        'Rework of data source. More detailed data is now fetched. It takes a few seconds longer to fetch data at start of Champion Select (8-16 seconds total), but now there are more features which the AI can use to improve its accuracy',
        'Merged individual scores into a single score, and added 3 in-depth individual scores:', 'Solo - score for Summoner + Champion unrelated to this champion select', 
        'Matchup - score for Summoner + Champion in the context of this team and matchup', 
        'Champion - score due to this specific Champion pick for this Summoner',
        'Added Champion recommendations',
        'Added lane/role icons',
        'Various small UI enhancements, logging and exception handling '
      ]],
      ['v0.1.1', '2021/04/27', 'Revert to v0.0.5', [
        'Reverted all changes to v0.0.5 because the prediction accuracy of v0.1.0 was lower due to a bug, as a temporary fix until the AI is fixed',
        'Added Gwen champion sprites'
      ]],
      ['v0.1.2', '2021/05/18', 'Fixed v0.1.0', [
        'Fixed the v0.1.0 issue so those changes are live',
        'Added "Summoner" score details',
        'Added wiki links - experimental (disabled by default)',
        'CSC will only appear for normal games, ranked, flex, or custom games and not for other game modes (ARAM, event..)',
        'The auto follow LoL client feature now moves the window slower to prevent losing control'
      ]],
      ['v0.1.3', '2021/05/18', 'Bugfix', ['Fixed bug where sometimes it would not give any results at all until app restart']],
      ['v0.1.4', '2021/05/19', 'Better logging and hang prevention', [
        'Improved logging to facilitate debugging', 
        'Added timeout and retries to LoL client queries'
      ]],
      ['v0.1.5', '2021/05/23', 'LCU failing fallback to API', [
        'Model update, significant imrovement of individual scores',
        'Champion statistics changes',
        'Look at max 30 latest games for a champion',
        'Added \'last played days ago\'',
        'Bug fix - the AD/AP/TRUE ratio computation was wrong',
        'Bug fix - it would not always take the latest N games',
        'Fixed issue where the League client wasn\'t returning data'
      ]],
      ['v0.1.6', '2021/05/23', 'Rollback to 0.1.4 ', []],
      ['v0.1.7', '2021/05/23', 'Bugfix', ['Fixed bug which came with v0.1.5 yielding very low scores (lane info was missing)']],
      ['v0.1.8', '2021/06/02', 'Logging', ['Improved logging, tracking of predictions']],
      ['v0.1.9', '2021/06/07', 'Minor fixes', ['Model update, minor UI changes for clarity, no longer using LCU for match history as these could have caused results to be erroneous']],
      ['v0.1.10', '2021/06/11', 'Improved the data fetching process', [
        'Allow more retries to fetch missing data for better predictions at the potential cost of longer loading times',
        'No longer asks for the latest tier from LCU but relies only on what\'s in the database just like the AI is used to',
        'Some changes to timeouts, data error handling, and logging'
      ]],
      ['v0.1.11', '2021/06/14', 'Model update', ['Model update after future tier fix']],
      ['v0.1.12', '2021/06/16', 'Beta version', [
        'Allow changing to Beta version (Experimental features)',
        'Allow manual version updates',
        'Warn if not on latest version',
        'Minor UI + logging improvements',
        'Minor bugfixes (tier wasn\'t showing on lane icon) '
      ]],
      ['v0.1.13', '2021/07/01', 'Exporting prediction logs', [
        'Added link to download prediction logs to a file',
        'Bugfix KDA was flipped (assists and kills were swapped)',
        'AI routine update'
      ]],
      ['v0.1.14', '2021/07/14', 'Mundo sprite update, bugfix', [
        'Fixed so it no longer crashes when tier data is corrupted, and instead ignores that tier',
        'Updated Dr.Mundo sprite',
        'AI routine update'
      ]],
      ['v0.1.15', '2021/07/23', 'Akshan', ['Added Akshan sprite']],
      
      ['v0.2.1', '2021/08/27', 'Enemy scores, ready for V5', ['The features of v0.2.3 but with minor bugs']],
      ['v0.2.2', '2021/08/27', 'Enemy scores, ready for V5', ['The features of v0.2.3 but with minor bugs']],
      ['v0.2.3', '2021/08/27', 'Enemy scores, ready for V5', [
        'Added lane predictor AI which fills in the lane when it\'s missing',
        'Allow manually assigning lanes',
        'Individual scores rework - see FAQ',
        'New AI model, improved individual scores, the lanes are now built into the model',
        'Now computes champion recommendations for champions with at least 2 games instead of 5',
        'Compute score for enemy team when their summoner names are known (when the game starts)',
        'UI changes for clarity',
        'Still uses the match v4 API but converts to v5 (lossy) to be ready for v5 release'
      ]],
      ['v0.2.4', '2021/09/12', 'Bugfix', ['Fixed a bug where the stats would be wrong for games after 8/27 and this would give incorrect scores']],
      ['v0.2.5', '2021/09/20', 'AI on API v5', [
        'The AI now looks at all the fields from Riot API V5',
        'Added Vex champion sprites '
      ]],
      ['v0.2.6', '2021/10/14', 'Champion recommendations filtered by lane', ['Both the recommendations and the champ-specific stats are now filtered for only games which this summoner played on the currently picked role']],
      ['v0.2.7', '2021/11/01', 'Bugfixes and AI update', [
        'Fixed the cs/min visual bug',
        'No longer takes tft rank into account',
        'Now show stats for champions even if played just one game - If too many different champions are played, the most commonly played ones are used instead',
        'If someone hovers a champ which is his 6th+ best champ, it will show it as the 5th instead of it being hidden',
        'AI update'
      ]],
      ['v0.2.8', '2022/01/23', 'Zeri update', [
        'Added Zeri sprite',
        'AI update'
      ]],
      ['v0.2.9', '2022/02/06', 'AI update', [
        'Has now trained on Zeri matches',
        'More continuous updates to follow early season meta'
      ]],
      ['v0.2.10', '2022/02/20', 'Renata update', [
        'Added Renata sprites',
        'AI update',
        'Small bugfix where it would miss the smite spell on some matches and in normal games would have a harder time guessing the lane since it looked like nobody had smite '
      ]],
      ['v0.2.11', '2022/04/02', 'Routine update', [
        'Added Kassadin sprites',
        'AI update'
      ]],
      ['v0.2.12', '2022/05/15', 'Routine update', [
        'AI adapted to the new observed behavior where ~8.0 was many times matched with ~8.0 in enemy team, so it was in fact a ~5.0 instead',
        'AI update'
      ]],
      ['v0.2.13', '2022/06/12', 'Bel\'Veth', [
        'Bel\'Veth sprites',
        'AI update'
      ]],
      ['v0.2.14', '2022/06/21', 'Routine update', ['AI update']],
      ['v0.2.15', '2022/07/18', 'Nilah', ['Nilah sprites']],

      ['v0.3.0', '2022/09/30', '3rd AI Rework - General changes', [
        'UI Completely rewritten and is now open-source!',
        'The AI structure was changed, as well as the framework.',
        'The AI now trains on data from the timeline Riot API, which means it sees also statistics during the game. This increased the accuracy to ~60.5%',
        'The AI now predicts many more outputs, most of which aren\'t displayed in the UI, we will figure out which ones are relevant in the coming updates, your feedback is appreciated!',
        'A history of champion select lobbies can be seen and browsed in a menu.',
        'The app no longer auto follows the LoL window because this was causing issues for some people, also the app is much larger now so it wouldn\'t always fit anyway.',
        'Support for multiple languages was added, and a translation to Spanish was added. Patch notes and dynamic notifications are not translated. Please reach out if you wish to help translate into your language.',
        'Various backend improvements and optimizations.',
      ]],
      ['v0.3.1', '2022/09/30', '3rd AI Rework - Champion Select', [
        'The following new predictions are visible in the UI: XP advantage at minute 3:00, XP+gold advantage at lane end, game length, objective control, chance to take first blood, damage to champions distribution, damage to turrets distribution, gold distribution and kill participation distribution.',
        'The individual scores have been simplified into only two scores: the solo and the team score, check their tooltips for more info!',
        'Match history is shown under each player, showing if it was a victory or loss, the role, the champion, and if hovering also the KDA and how long ago it was. Subtle lines are drawn in between games where at least 3 hours passed in between them.',
        'The percentage of times the player plays his main and secondary roles is visible.',
        'The players are now rearranged according to their roles on both teams.',
        'The sign of the enemy scores is now reversed, but not the colors. So positive scores now always mean good performance, and green color always means good for your team\'s winrate.',
        'The statistics for each champion performance has been removed from champion select and moved to a personal page.',
      ]],
      ['v0.3.2', '2022/09/30', '3rd AI Rework - Personal view', [
        'A new personal page was made which shows statistics of the performance on the main roles and champions, as well as the AI solo score for variants of these positions.',
        'The personal page also shows the full history of CSC games played, along with statistics of performance. Clicking on these games in the history will load them to be visible again as they appeared during champion select.',
        'The personal page also shows a histogram of AI scores VS outcome of the game, for your games, all CSC users, and the AI\'s veredict on all the new games it has encountered.',
      ]],
      ['v0.3.3', '2022/11/06', 'K\'Sante', ['K\'Sante sprites']],
      
      ['v0.3.4', '2023/02/13', '3rd AI Rework - Cleanup and stability', [
        'Multiple bugs fixed',
        'Added tutorial',
        'UX improvements',
        'Improved error handling'
      ]],

      ['v0.3.5', '2023/02/13', 'French and bugfixes', [
        'French is now available as a language in settings - Big thanks to <b>Midnight</b> for his help with translation!',
        'Bug fixes',
        'Improved error handling'
      ]],

      ['v0.3.6', '2023/02/24', 'Migration of CSC servers', [
        'The database and CSC server was migrated'
      ]],

      ['v0.3.7', '2023/02/27', 'Champion Select optimistic AI bug fixed', [
        'The positive bias experienced during champion select was fixed',
        'The AI now receives more information to make a more accurate prediction'
      ]],

      ['v0.3.8', '2023/03/19', 'Subs and editable lobbies', [
        'Subscriptions are available so you can support the app, remove ads and unlock a few more features (some more features in the future may also be subscription-only).',
        'Subscription only: Ads removed.',
        'Subscription only: Any champion select can be cloned into edit mode, where the champions, player names, region and side can be freely edited, simulating lobbies. This can be used for example in clash to decide beforehand what to play or ban, check what CSC would say for your friend\'s game, or to go back into an old game and check how various changes would affect the scores.',
        'Added workaround for when the running game Riot API is down to get currently running game',
        'Minor UX fixes and optimizations',
      ]],

      ['v0.3.9', '2023/03/22', 'Milio', ['Milio Sprites']],
      
      ['v0.3.10', '2023/04/07', 'Southeast Asian Regions', ['Added support for regions: Philippines, Singapore, Thailand, Taiwan and Vietnam']],

      ['v0.3.11', '2023/05/21', 'Bugfix', ['Fixed minor bug regarding ads']],

        // 'Subscription only: A minimap with the champions is shown instead of the ads.',
        //'Multiple 3rd party tools can be configured to open when clicking the champions.',
      ];
  }

}

