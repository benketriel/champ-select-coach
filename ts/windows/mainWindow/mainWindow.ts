import { version, windowNames } from "../../ts-lib/consts";
import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { Timer } from "../../ts-lib/timer";
import { OWWindow } from "../../ts-lib/ow-window";
import { CsTab } from "../../ts-lib/csTab";
import { PersonalTab } from "../../ts-lib/personalTab";
import { Logger } from "../../ts-lib/logger";
import { CSCAI } from "../../ts-lib/cscai";
import { Popup } from "../../ts-lib/popup";
import { Subscriptions } from "../../ts-lib/subscriptions";
import { PatchNotes } from "../../ts-lib/patchNotes";
import { Lcu } from "../../ts-lib/lcu";
import { Aws } from "../../ts-lib/aws";
import { DynamicSettings } from "../../ts-lib/dynamicSettings";
import { TranslatedText, Translator } from "../../ts-lib/textLanguage";
import { Beta } from "../../ts-lib/beta";
import { LocalStorage } from "../../ts-lib/localStorage";


declare var _owAdConstructor: any;
// declare var _owAd: any;
// declare var _owAdReady: any;

export class MainWindow {
  private static _instance: MainWindow;
  private window: OWWindow;

  private csTab: CsTab;
  private personalTab: PersonalTab;
  private selectedView: string = '';
  private dynamicSettings: DynamicSettings;
  private static lastStatusPopup: string = null;

  public patchInfo: any;
  private ongoingFeedback: boolean = false;

  public static MAX_MENU_HISTORY_SIZE: number = 13;

  public static instance() {
    return this._instance = this._instance || new MainWindow();
  }

  public run() {}

  constructor() {
    Logger.log("MainWindow begin");

    this.window = new OWWindow(windowNames.mainWindow);

    //Track window state to pause/resume ads
    overwolf.windows.onStateChanged.removeListener(x => MainWindow.handleStateChanged(x));
    overwolf.windows.onStateChanged.addListener(x => MainWindow.handleStateChanged(x));

    this.initWindow();
  }

  public async initWindow() {
    this.patchInfo = await CSCAI.getPatchInfo();
    await this.loadHTML();
    await this.setCallbacks();
    this.csTab = new CsTab(this.patchInfo);
    this.personalTab = new PersonalTab(this.patchInfo);
    this.dynamicSettings = new DynamicSettings(MainWindow.setStatus);
    MainWindow.waitForAdsLibToLoadThenInitAdObj();
    MainWindow.versionButtonClick();

    Popup.prompt('Subscription', 'Do you want to temporarily enable the subscribed-only mode?', () => Subscriptions.TODO = true, () => {});
  }


  private static lastAdRefresh: number = 0;
  private static owAdObj: any = null;
  private static owAdObjReady: boolean = false;
  private static async waitForAdsLibToLoadThenInitAdObj() {
    while(!_owAdConstructor) await Timer.wait(1000);

    MainWindow.owAdObj = new _owAdConstructor(document.getElementById("owad"), {size: {width: 400, height: 300}});
    MainWindow.owAdObj.addEventListener('ow_internal_rendered', () => {
      // It is now safe to call any API you want ( e.g. MainWindow.owAdObj.refreshAd() or MainWindow.owAdObj.removeAd() )
      MainWindow.owAdObjReady = true;
      MainWindow.activity();
    });
  }

  public static async handleStateChanged(state: any) {
    if (state && state.window_name == windowNames.mainWindow) {
      if (!MainWindow.owAdObjReady){
        await Timer.wait(1000);
        let maxTries = 20;
        while(!MainWindow.owAdObjReady && --maxTries > 0){
          await Timer.wait(1000);
        }
        if (maxTries == 0) return;
      }

      if (await Subscriptions.isSubscribed()) {
        MainWindow.owAdObj.removeAd(); //No ads for subscribed
        return;
      }
      if (state.window_state === "minimized") {
        MainWindow.owAdObj.removeAd();
      }
      else if(state.window_previous_state === "minimized" && state.window_state === "normal"){
        if (!await Subscriptions.isSubscribed()) {
          MainWindow.lastAdRefresh = new Date().getTime();
          MainWindow.owAdObj.refreshAd();
        }
      }
    }
  }

  private static lastActivity: number = 0;
  public static async activity() {
    if (new Date().getTime() - MainWindow.lastActivity < 1000) {
      return; //Prevent spamming of this function
    }
    MainWindow.lastActivity = new Date().getTime();
    if (await Subscriptions.isSubscribed()) {
      MainWindow.owAdObj.removeAd();
      $('.side-menu-add-manual-cs').show();
      $('.owad-container-footer').hide();
    } else {
      $('.side-menu-add-manual-cs').hide();
      $('.owad-container-footer').show();
    }

    if (new Date().getTime() - MainWindow.lastAdRefresh > 1000 * 60 * 10) {
      await Timer.wait(1000);
      if (new Date().getTime() - MainWindow.lastAdRefresh > 1000 * 60 * 10) {
        //Refresh AD if user comes back from being idle, but after 1 second of this happening
        if (MainWindow.owAdObjReady && !await Subscriptions.isSubscribed()) {
          MainWindow.lastAdRefresh = new Date().getTime();
          MainWindow.owAdObj.refreshAd();
        }
      }
    }

  }

  public repositionOverflowingPopup(elmn: any) {
    const bodyHeight = $('body').height();
    const bodyWidth = $('body').width();
    for (let tt of $(elmn).find('.tooltiptext')) {
      const currPos = $(tt).offset();
      const currTrans = $(tt).css('transform');
      let currTx = 0;
      let currTy = 0;
      if (currTrans && currTrans != 'none') {
        const arr = $(tt).css('transform').split('(')[1].split(')')[0].split(', ').map(x => parseFloat(x));
        currTx = arr[4];
        currTy = arr[5];
      }

      const offsetX = $(tt).outerWidth() + currPos.left - currTx - (bodyWidth - 2);
      const offsetY = $(tt).outerHeight() + currPos.top - currTy - (bodyHeight - 2);
      const newTx = Math.min(0, -Math.round(offsetX));
      const newTy = Math.min(0, -Math.round(offsetY));

      if (currTx != newTx || currTy != newTy) {
        $(tt).css('transform', 'translate(' + newTx + 'px, ' + newTy + 'px)');
      }
    }
  }

  private async loadHTML() {
    // Note, load everything but hide it, this is more efficient than having to reload every time

    //Side menu
    $('.side-menu').append(await (await fetch('sideMenu.html')).text());
    for (let i = 0; i < MainWindow.MAX_MENU_HISTORY_SIZE; ++i) {
      $('#side-menu-old-cs-list').append(await (await fetch('sideMenuOption.html')).text());
    }

    //Popups
    $('.faq-tab').append(await (await fetch('faqTab.html')).text());
    $('.settings-tab').append(await (await fetch('settingsTab.html')).text());
    $('.feedback-tab').append(await (await fetch('feedbackTab.html')).text());
    $('.news-tab').append(await (await fetch('newsTab.html')).text());

    const patchNotesHtml = $('.slide-overlay-news .accordeon-row').prop('outerHTML');
    const patchNotesContent = PatchNotes.get();
    for (let i = 0; i < Math.min(9, patchNotesContent.length - 1); ++i) {
      $('.slide-overlay-news .slide-overlay-content').prepend(patchNotesHtml);
    }
    const patchNotesIdElems = $('.patch-notes-version-id').get();
    const patchNotesTitleElems = $('.patch-notes-short-title').get();
    const patchNotesDateElems = $('.patch-notes-date').get();
    const patchNotesDescElems = $('.slide-overlay-news .accordeon-row li').get();
    for (let i = 0; i < Math.min(10, patchNotesContent.length); ++i) {
      const p = patchNotesContent[patchNotesContent.length - 1 - i];
      $(patchNotesIdElems[i]).html(<string>p[0]);
      $(patchNotesTitleElems[i]).html(<string>p[2]);
      $(patchNotesDateElems[i]).html(<string>p[1]);
      for (let x of p[3]) {
        $(patchNotesDescElems[i]).append('• ' + x + '<br>');
      }
    }

    $('.submitFeedback').on('click', async () => {
      if (this.ongoingFeedback) return;
      this.ongoingFeedback = true;
      try {
        await this.submitFeedback();
      } finally {
        this.ongoingFeedback = false;
      }
    });

    //Personal
    $('.personal-tab').append(await (await fetch('personalTab.html')).text());
    for (let i = 0; i < 4; ++i) {
      $('.personal-champions-list').append(await (await fetch('personalTabChampionItem.html')).text());
    }

    for (let i = 0; i < 10; ++i) {
      $('.personal-history-list').append(await (await fetch('personalTabHistoryItem.html')).text());
    }

    //Cs
    $('.cs-tab').append(await (await fetch('csTab.html')).text());
    for (let i = 0; i < 5; ++i) {
      $('.cs-table').append(await (await fetch('csTabRow.html')).text());
    }
    for (let i = 0; i < CsTab.NUM_RECOMMENDATIONS; ++i) {
      const places = $('.cs-table-recommended-champions-cell .cs-table-cell').get();
      for (let j = 0; j < places.length; ++j) {
        if (j % 2 == 0) {
          $(places[j]).prepend(await (await fetch('csTabRecommendationItem.html')).text());
        } else {
          $(places[j]).append(await (await fetch('csTabRecommendationItem.html')).text());
        }
      }
    }
    for (let i = 0; i < CsTab.NUM_HISTORY; ++i) {
      $('.cs-table-history-cell .cs-table-cell').append(await (await fetch('csTabHistoryItem.html')).text());
    }

  }

  private async setCallbacks() {
    //Call this function once, else add .off() calls before each .on()

    //Menu navigation
    $('.side-menu-current-cs').on('click', MainWindow.selectCurrentCS);
    for (let i = 0; i < 10; ++i) {
      $($('.side-menu-old-cs')[i]).on('click', () => MainWindow.selectHistoryCS(i));
      $($('.deleteHistoryItem')[i]).on('click', event => { 
        Popup.prompt(
          TranslatedText.deleteHistory.english,
          TranslatedText.thisWillRemoveLobbyAreYouSure.english,
          () => MainWindow.deleteHistoryCS(i), 
          () => null);
        event.stopPropagation(); 
      });
    }
    $('.side-menu-add-manual-cs').on('click', () => MainWindow.selectHistoryCS(null));
    $('.s-lcu-status').on('click', MainWindow.selectPersonal);

    //Small Windows
    $('.faqButton').on('click', async () => { 
      $('.slide-overlay').stop();
      $('.slide-overlay').animate({ left: '100%' });
      $('.slide-overlay-faq').stop();
      $('.slide-overlay-faq').animate({ left: 0 });
    });
    $('.settingsButton').on('click', async () => { 
      $('.slide-overlay').stop();
      $('.slide-overlay').animate({ left: '100%' });
      $('.slide-overlay-settings').stop();
      $('.slide-overlay-settings').animate({ left: 0 });
    });
    $('.feedbackButton').on('click', async () => { 
      $('.slide-overlay').stop();
      $('.slide-overlay').animate({ left: '100%' });
      $('.slide-overlay-feedback').stop();
      $('.slide-overlay-feedback').animate({ left: 0 });
    });
    $('.newsButton').on('click', async () => { 
      $('.slide-overlay').stop();
      $('.slide-overlay').animate({ left: '100%' });
      $('.slide-overlay-news').stop();
      $('.slide-overlay-news').animate({ left: 0 });
    });
    $('.slide-overlay-close').on('click', () => { 
      $('.slide-overlay').animate({ left: '100%' });
    });
    $('.accordeon-title').on('click', e => { 
      if ($(e.currentTarget).siblings('.accordeon-content').is(':visible')) {
        $(e.currentTarget).siblings('.accordeon-content').slideUp();
      } else {
        $('.accordeon-content').slideUp();
        $(e.currentTarget).siblings('.accordeon-content').slideDown();
      }
    });
    $('.accordeon-content').hide();
    

    $('.settings-button-version').on('click', () => MainWindow.versionButtonClick());
    $('.settings-beta-version').prop('checked', await Beta.isBetaVersion());
    $('.settings-beta-version').on('change', (e: any) => MainWindow.betaChange(e.currentTarget.checked));

    const autoOpenMode = LocalStorage.getAutoOpenMode();
    $('.settings-auto-open-lcu').prop('checked', autoOpenMode != 1 && autoOpenMode != 2);
    $('.settings-auto-open-lcu').on('change', () => MainWindow.setAutoOpenMode(0));
    $('.settings-auto-open-cs').prop('checked', autoOpenMode == 1);
    $('.settings-auto-open-cs').on('change', () => MainWindow.setAutoOpenMode(1));
    $('.settings-auto-open-never').prop('checked', autoOpenMode == 2);
    $('.settings-auto-open-never').on('change', () => MainWindow.setAutoOpenMode(2));

    $('.settings-auto-focus-cs').prop('checked', LocalStorage.getAutoFocusCs());
    $('.settings-auto-focus-cs').on('change', (e: any) => LocalStorage.setAutoFocusCs(e.currentTarget.checked));

    $('.settings-single-thread-mode').prop('checked', LocalStorage.getSingleThreadedMode());
    $('.settings-single-thread-mode').on('change', (e: any) => LocalStorage.setSingleThreadedMode(e.currentTarget.checked));

    $('.settings-button-language img').attr('src', '/img/flags/' + LocalStorage.getLanguage() + '.png');
    $('.settings-button-language').on('click', () => MainWindow.changeLanguage());

    $('.settings-button-overwolf-settings').on('click', () => { window.location.href = 'overwolf://settings/hotkeys'; });

    $('.settings-button-subscribe').on('click', () => MainWindow.subscribe());
    $('.owad-container-footer').on('click', () => MainWindow.subscribe());
    
    //Popup
    $('.popupCloseButton').on('click', () => { Popup.close(); });
    $('.popup-button-yes').on('click', () => { Popup.yes(); });
    $('.popup-button-no').on('click', () => { Popup.no(); });

    $('.popup-input-text-input').on('input', () => { Popup.textChange(); });
    $('.popup-input-text-input').on('keypress', event => { if (event.key === "Enter") { Popup.yes(); event.preventDefault(); } });
    
    $('.popup-flag').on('click', event => { Popup.flagClick(event); });

    const that = this;

    //Global
    $('.drags-window').each((index, elem) => { this.setDrag(elem); });
    $('.closeButton').on('click', async () => { overwolf.windows.sendMessage(windowNames.background, 'close', '', () => {}); });
    $('.minimizeButton').on('click', () => { this.window.minimize(); });
    $('.rateApp').on('click', () => { overwolf.utils.openStore({ page:overwolf.utils.enums.eStorePage.ReviewsPage, uid:"ljkaeojllenacnoipfcdpdllhcfndmohikaiphgi"}); });

    $('body').on('keyup', e => { if (e.key === "Escape") {
      MainWindow.activity();
      Popup.close();
      $('.slide-overlay').animate({ left: '100%' });
    } });
    $('body').on('mousedown', () => MainWindow.activity());
    $('.tooltip').on('mouseenter', e => that.repositionOverflowingPopup(e.currentTarget));

    $('.translated-text').on('DOMSubtreeModified', (e: any) => { Translator.updateTranslation(e.currentTarget); });
    Translator.updateAllTranslations();

    if (!LocalStorage.languageHasBeenSet()) MainWindow.changeLanguage();
  }

  //Make callbacks static since the 'this' is confusing to pass to a callback, use MainWindow.instance() instead
  public static selectCurrentCS() {
    const main = MainWindow.instance();
    if (!main.csTab.hasBeenInCS) return;
    if (main.selectedView == 'lcu') return;
    MainWindow.clearAll();

    main.selectedView = 'lcu';
    main.csTab.swapToLcu();
    main.csTab.show();

    $('.side-menu-current-cs').addClass('side-menu-selected-effect');
  }

  public static async selectHistoryCS(i: number) {
    const main = MainWindow.instance();
    if (null == i) {
      main.csTab.addManualCs();
      i = 0;
    } else if (main.selectedView == 'hist' + i) return;

    {
      //Hack for better percieved responsiveness, the swapToManual takes some noticeable time and we want feedback from the menu before that time
      $($('.side-menu-old-cs')[i]).addClass('side-menu-selected-effect');
      await Timer.wait(1);
    }

    MainWindow.clearAll();
    main.selectedView = 'hist' + i;
    main.csTab.swapToManual(i);
    main.csTab.show();
    $($('.side-menu-old-cs')[i]).addClass('side-menu-selected-effect');
  }

  public static deleteHistoryCS(i: number) {
    const main = MainWindow.instance();

    main.csTab.deleteCSHistory(i);

    if (main.selectedView.startsWith('hist')) {
      let currI = parseInt(main.selectedView.substring('hist'.length));
      if (currI > i) currI--;
      else if (currI == i) currI = Math.min(currI, main.csTab.getCSHistoryLength() - 1);
      main.selectedView = '';
      if (currI >= 0) MainWindow.selectHistoryCS(currI);
      else MainWindow.selectHome();
    }
  }

  public static selectPersonal() {
    const main = MainWindow.instance();
    if (main.selectedView == 'personal') return;
    if (!main.personalTab.readyToBeDisplayed()) {
      Popup.message(TranslatedText.lolDisconnected.english, TranslatedText.cscNotConnectingToLCU.english);
      return;
    }
    MainWindow.clearAll();

    main.selectedView = 'personal';
    main.personalTab.show();
    $('.s-lcu-status').addClass('s-lcu-status-selected');
  }

  public static selectStatic(csView: any) {
    const main = MainWindow.instance();
    MainWindow.clearAll();
    main.selectedView = 'static';

    main.csTab.show();
    main.csTab.swapToStatic(csView);
  }

  public static selectHome() {
    MainWindow.clearAll();
    $('.home-tab').show();
  }

  public static clearAll() {
    const main = MainWindow.instance();
    main.personalTab.hide();
    main.csTab.hide();
    main.selectedView = '';

    $('.home-tab').hide();
    $('.slide-overlay').animate({ left: '100%' });
    $('.side-menu-current-cs').removeClass('side-menu-selected-effect');
    $('.side-menu-selected-effect').removeClass('side-menu-selected-effect');
    $('.s-lcu-status').removeClass('s-lcu-status-selected');
  }

  public async submitFeedback() {
    try {
      const name = (<string>$('#feedback-name').val()).trim();
      const contact = (<string>$('#feedback-contact').val()).trim();
      const msg = (<string>$('#feedback-message').val()).trim();
      $('#feedback-name').attr("disabled", "disabled");
      $('#feedback-contact').attr("disabled", "disabled");
      $('#feedback-message').attr("disabled", "disabled");
  
      if (name.length == 0 || msg.length == 0) {
        $('.feedback-error').html(TranslatedText.pleaseFillInFields.english);
        $('.feedback-error').hide();
        $('.feedback-error').fadeIn();
        return;
      }
      const data = {
        name,
        contact,
        msg,
        summoner: '',
        region: '',
      };
      try {
        const nameRegion = await Lcu.getCurrentNameAndRegion();
        if (nameRegion && nameRegion.name && nameRegion.region) {
          data.summoner = nameRegion.name;
          data.region = nameRegion.region;
        }
      }catch{}

      if (!(await Aws.feedback(JSON.stringify(data)))) {
        $('.feedback-error').html(TranslatedText.unableToConnect.english);
        $('.feedback-error').hide();
        $('.feedback-error').fadeIn();
        return;
      }

      $('.submitFeedback').hide();
      $('.feedback-success').html(TranslatedText.thankYouForFeedback.english);
      $('.feedback-success').hide();
      $('.feedback-success').fadeIn();
      $('.feedback-error').html('');
    }catch (ex) {
      $('.feedback-error').html(TranslatedText.anErrorOccurred.english);
      $('.feedback-error').hide();
      $('.feedback-error').fadeIn();
      Logger.log(ex);
    } finally {
      $('#feedback-name').removeAttr("disabled");
      $('#feedback-contact').removeAttr("disabled");
      $('#feedback-message').removeAttr("disabled");
    }


  }

  public static async setStatus(statusJSON: string) {
    const status = JSON.parse(statusJSON) || {};
    if (status.announcement && status.announcement.length > 0) {
      $('.announcement-scrolling-text-slider').html(status.announcement.split('<br/>').join('').split('<br>').join(''));
      $('.announcement-scrolling-text-tooltip').html(status.announcement);
      $('.announcement-scrolling-text').show();

      if (MainWindow.lastStatusPopup != status.announcement) {
        MainWindow.lastStatusPopup = status.announcement;
        // Popup.message(TranslatedText.announcement.english, status.announcement);
      }

    } else {
      $('.announcement-scrolling-text').hide();
    }

    if (MainWindow.currUpdateState != null && MainWindow.currUpdateState != 'UpToDate' && 
      status.supportedVersions && status.supportedVersions.length > 0 && !status.supportedVersions.includes(version)) {
        MainWindow.versionButtonClick(); //Force update if not supported and not up to date
    }
  }

  private static currUpdateState: string = null;
  private static async versionButtonClick() {
    $('.settings-button-version').hide(); //Also prevents multiple concurrent clicks
    $('.settings-version-loading-spinner').show();
    $('.settings-beta-version').attr("disabled", "disabled"); //Also prevents multiple concurrent clicks

    if (MainWindow.currUpdateState == null || MainWindow.currUpdateState == 'UpToDate') {
      $('.settings-version-text').html(TranslatedText.checkingForUpdates.english);

      await Timer.wait(500);
      let res = await new Promise<overwolf.extensions.CheckForUpdateResult>(resolve => overwolf.extensions.checkForExtensionUpdate(resolve));
      while (!res || !res.success || !res.state) {
        await Timer.wait(1000);
        res = await new Promise<overwolf.extensions.CheckForUpdateResult>(resolve => overwolf.extensions.checkForExtensionUpdate(resolve));
      }
      if (MainWindow.currUpdateState == null && res.state != 'UpToDate') {
        Popup.message(TranslatedText.update.english, TranslatedText.updateIsAvailable.english);
      }
      MainWindow.currUpdateState = res.state;
    } else if (MainWindow.currUpdateState == 'UpdateAvailable') {
      const updateRes = <any>await new Promise(resolve => overwolf.extensions.updateExtension(resolve));
      Logger.log("App was manually updated with return message: " + JSON.stringify(updateRes));
      if (updateRes && updateRes.success && updateRes.state == 'PendingRestart') {
        MainWindow.currUpdateState = 'PendingRestart';
      } else {
        Popup.message(TranslatedText.error.english, TranslatedText.anErrorOccurred.english);
      }
    } else if (MainWindow.currUpdateState == 'PendingRestart') {
      overwolf.extensions.relaunch();
    }

    if (MainWindow.currUpdateState == 'UpToDate') {
      $('.settings-version-text').html(TranslatedText.appIsUpToDate.english);
      $('.settings-button-version').html(TranslatedText.checkForUpdates.english);
    } else if (MainWindow.currUpdateState == "UpdateAvailable") {
      $('.settings-version-text').html(TranslatedText.updateAvailable.english);
      $('.settings-button-version').html(TranslatedText.downloadUpdate.english);
    } else if (MainWindow.currUpdateState == "PendingRestart") {
      $('.settings-version-text').html(TranslatedText.updateAvailable.english);
      $('.settings-button-version').html(TranslatedText.updateNow.english);
    }

    $('.settings-version-id').html(version);
    if (await Beta.isBetaVersion() && MainWindow.currUpdateState == 'UpToDate') {
      $('.settings-version-id-beta').show();
    } else {
      $('.settings-version-id-beta').hide();
    }

    $('.settings-beta-version').removeAttr("disabled");
    $('.settings-version-loading-spinner').hide();
    $('.settings-button-version').show();
  }

  private static async betaChange(beta: boolean) {
    Beta.setBetaVersion(beta);
    MainWindow.currUpdateState = null;
    MainWindow.versionButtonClick();
  }

  private static async setAutoOpenMode(mode: number) {
    $('.settings-auto-open-lcu').prop('checked', mode != 1 && mode != 2);
    $('.settings-auto-open-cs').prop('checked', mode == 1);
    $('.settings-auto-open-never').prop('checked', mode == 2);

    LocalStorage.setAutoOpenMode(mode);
  }

  private static async subscribe() {
    overwolf.utils.openStore(<any>{ page:overwolf.utils.enums.eStorePage.SubscriptionPage });
  }

  private static async changeLanguage() {
    Popup.selectLanguage((newLang: string) => {
      LocalStorage.setLanguage(newLang);
      $('.settings-button-language img').attr('src', '/img/flags/' + newLang + '.png');
      Translator.updateAllTranslations();
    });
  }

  public async getWindowState() {
    return await this.window.getWindowState();
  }
  
  private async setDrag(elem: HTMLElement) {
    this.window.dragMove(elem);
  }


}

MainWindow.instance().run();