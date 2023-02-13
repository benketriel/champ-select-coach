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
import { Aws } from "../../ts-lib/aws";
import { DynamicSettings } from "../../ts-lib/dynamicSettings";
import { TranslatedText, Translator } from "../../ts-lib/textLanguage";
import { Beta } from "../../ts-lib/beta";
import { LocalStorage } from "../../ts-lib/localStorage";
import { Updates } from "../../ts-lib/updates";
import { ErrorReporting } from "../../ts-lib/errorReporting";
import { Lcu } from "../../ts-lib/lcu";
import { CsDataFetcher } from "../../ts-lib/csDataFetcher";
import { Tutorial } from "../../ts-lib/tutorial";


declare var _owAdConstructor: any;

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
  public static MAX_PERSONAL_HISTORY_SIZE: number = 10;
  public static MAX_PATCH_NOTES: number = 10;

  public static instance() {
    return this._instance = this._instance || new MainWindow();
  }

  public run() {}

  constructor() {
    Logger.log("MainWindow begin");

    this.window = new OWWindow(windowNames.mainWindow);

    //Track window state to pause/resume ads
    overwolf.windows.onStateChanged.removeListener(async x => await MainWindow.handleMinimizeStateChanged(x));
    overwolf.windows.onStateChanged.addListener(async x => await MainWindow.handleMinimizeStateChanged(x));

    /* await */ this.initWindow();
  }

  public async initWindow() {
    ErrorReporting.LazyLcu = Lcu;
    ErrorReporting.LazyCsDataFetcher = CsDataFetcher;

    this.patchInfo = await CSCAI.getPatchInfo();
    await this.loadHTML();
    await this.setCallbacks();
    this.csTab = new CsTab(this.patchInfo);
    this.personalTab = new PersonalTab(this.patchInfo);
    this.dynamicSettings = new DynamicSettings(async (x: any) => await MainWindow.setStatus(x));
    /* await */ MainWindow.activateAds();
    /* await */ MainWindow.versionButtonClick();

    const rc = LocalStorage.getRestartCount();
    const windowIsTheRightSize = Math.abs($('body').outerWidth() - 1300) < 100 || Math.abs($('body').outerHeight() - 720) < 100;
    if (rc < 2 && !windowIsTheRightSize) {
      LocalStorage.setRestartCount(rc + 1);
      await Timer.wait(1000);
      overwolf.extensions.relaunch();
      return;
    }
    LocalStorage.setRestartCount(0);

    $('body').css('opacity', '1.0');

    const notes = PatchNotes.get();

    if (notes.length > 0 && LocalStorage.getLatestSeenPatchNote() == null) {
      LocalStorage.setLatestSeenPatchNote(<string>notes[notes.length - 1][0]);
    } else if (notes.length > 0 && LocalStorage.getLatestSeenPatchNote() != notes[notes.length - 1][0]) {
      await Timer.wait(100);
      $('.newsButton').trigger('click');
      await Timer.wait(100);
      $($('.slide-overlay-news .settings-sub-title').get(0)).trigger('click');
      LocalStorage.setLatestSeenPatchNote(<string>notes[notes.length - 1][0]);
    }

    Tutorial.init();
    if (!LocalStorage.languageHasBeenSet()) await MainWindow.changeLanguage(this.patchInfo);
    else Tutorial.runWelcome();
  }


  private static lastAdRefresh: number = 0;
  private static owAdObj: any = null;
  private static owAdObjReady: boolean = false;
  private static async activateAds() {
    while(!_owAdConstructor) await Timer.wait(1000);

    //For testing use:
    //localStorage.owAdsForceAdUnit = "Ad_test";
    //localStorage.owAdsForceAdUnit ="Ad_test_300x250";
    //localStorage.owAdsForceAdUnit = undefined; //Restore to original state

    // The creation of an OwAd object will automatically load an ad (so no need to call refreshAd here).
    // _owAd = new OwAd(document.getElementById("owad"), {size: {width: 400, height: 300}});
    // _owAd = new OwAd(document.getElementById("owad"), {size: {width: 300, height: 250}});
    // _owAd = new OwAd(document.getElementById("owad"), {size: {width: 400, height: 300}});

    $('#owad').html('');
    $('#owad').show();
    MainWindow.owAdObj = new _owAdConstructor(document.getElementById("owad"), {size: {width: 400, height: 300}});
    MainWindow.owAdObj.addEventListener('ow_internal_rendered', async () => {
      MainWindow.owAdObjReady = true;
      await MainWindow.activity();
    });
  }

  private static deactivateAds() {
    if (MainWindow.owAdObj == null) return;

    $('#owad').hide();
    MainWindow.owAdObj.shutdown();
    MainWindow.owAdObj = null;
    //MainWindow.owAdObjReady = false;
  }

  private static async refreshAds() {
    MainWindow.deactivateAds(); //Not calling this makes it a black screen forever sometimes
    await Timer.wait(500);
    await MainWindow.activateAds();
  }

  private static minimized = false;
  public static async handleMinimizeStateChanged(state: any) {
    if (state && state.window_name == windowNames.mainWindow) {
      if (!MainWindow.owAdObjReady){
        await Timer.wait(1000);
        let maxTries = 20;
        while(!MainWindow.owAdObjReady && --maxTries > 0){
          await Timer.wait(1000);
        }
        if (maxTries == 0) return;
      }

      if (Subscriptions.isSubscribed()) {
        MainWindow.deactivateAds(); //No ads for subscribed
        return;
      }
      if (state.window_state === "minimized") {
        MainWindow.minimized = true;
        MainWindow.deactivateAds();
      }
      else if(state.window_previous_state === "minimized" && state.window_state === "normal"){
        MainWindow.minimized = false;
        if (!Subscriptions.isSubscribed()) {
          MainWindow.lastAdRefresh = new Date().getTime();
          await this.refreshAds();
        }
      }
    }
  }

  private static lastActivity: number = 0;
  public static async activity() {
    if (MainWindow.minimized) return; //Activity triggered by lcu

    if (new Date().getTime() - MainWindow.lastActivity < 1000) {
      return; //Prevent spamming of this function
    }
    MainWindow.lastActivity = new Date().getTime();
    await Timer.wait(100); //Just prevent things from happening exactly when you click the window

    if (Subscriptions.isSubscribed()) {
      MainWindow.deactivateAds();
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
        if (MainWindow.owAdObjReady && !Subscriptions.isSubscribed()) {
          MainWindow.lastAdRefresh = new Date().getTime();
          await this.refreshAds();
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
    for (let i = 0; i < Math.min(MainWindow.MAX_PATCH_NOTES, patchNotesContent.length); ++i) {
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

    for (let i = 0; i < MainWindow.MAX_PERSONAL_HISTORY_SIZE; ++i) {
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

  private static lastKeyPress: number = 0;
  private async setCallbacks() {
    //Call this function once, else add .off() calls before each .on()

    const that = this;

    //Body resize
    const onResize = () => {
      const ws = $('body').width() / 1300.0;
      const hs = $('body').height() / 720.0;
      $('.window-container').css('transform', 'scaleX(' + ws + ') scaleY(' + hs + ')');
    };
    window.addEventListener("resize", onResize);
    onResize();

    //Menu navigation
    $('.side-menu-current-cs').on('click', async () => { $('.slide-overlay-close').trigger('click'); MainWindow.showLcuCS(); });
    for (let i = 0; i < MainWindow.MAX_MENU_HISTORY_SIZE; ++i) {
      $($('.side-menu-old-cs')[i]).on('click', async () => { $('.slide-overlay-close').trigger('click'); await MainWindow.showHistoryCS(i); });
      $($('.deleteHistoryItem')[i]).on('click', event => { 
        Popup.prompt(
          TranslatedText.deleteHistory.english,
          TranslatedText.thisWillRemoveLobbyAreYouSure.english,
          async () => await MainWindow.deleteHistoryCS(i), 
          () => null);
        event.stopPropagation(); 
      });
    }
    $('.side-menu-add-manual-cs').on('click', async () => { $('.slide-overlay-close').trigger('click'); await MainWindow.addNewEditableHistoryCS(); });
    $('.s-lcu-status').on('click', async () => { $('.slide-overlay-close').trigger('click'); await MainWindow.showPersonalTab(); });
    $('.homeButton').on('click', async () => { $('.slide-overlay-close').trigger('click'); await MainWindow.showPersonalTab(); });

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
      $('.slide-overlay').stop();
      $('.slide-overlay').animate({ left: '100%' });
    });
    $('.accordeon-title').on('click', e => { 
      if ($(e.currentTarget).siblings('.accordeon-content').is(':visible')) {
        $(e.currentTarget).siblings('.accordeon-content').slideUp();
        $('.accordeon-title').removeClass('accordeon-title-selected');
      } else {
        $('.accordeon-content').slideUp();
        $('.accordeon-title').removeClass('accordeon-title-selected');

        $(e.currentTarget).siblings('.accordeon-content').slideDown();
        $(e.currentTarget).addClass('accordeon-title-selected');
      }
    });
    $('.accordeon-content').hide();
    

    $('.settings-button-version').on('click', async () => await MainWindow.versionButtonClick());
    $('.settings-beta-version').prop('checked', await Beta.isBetaVersion());
    $('.settings-beta-version').on('change', async (e: any) => await MainWindow.betaChange(e.currentTarget.checked));

    const autoOpenMode = LocalStorage.getAutoOpenMode();
    $('.settings-auto-open-lcu').prop('checked', autoOpenMode != 1 && autoOpenMode != 2);
    $('.settings-auto-open-lcu').on('change', async () => await MainWindow.setAutoOpenMode(0));
    $('.settings-auto-open-cs').prop('checked', autoOpenMode == 1);
    $('.settings-auto-open-cs').on('change', async () => await MainWindow.setAutoOpenMode(1));
    $('.settings-auto-open-never').prop('checked', autoOpenMode == 2);
    $('.settings-auto-open-never').on('change', async () => await MainWindow.setAutoOpenMode(2));

    $('.settings-auto-focus-cs').prop('checked', LocalStorage.getAutoFocusCs());
    $('.settings-auto-focus-cs').on('change', (e: any) => LocalStorage.setAutoFocusCs(e.currentTarget.checked));

    $('.settings-single-thread-mode').prop('checked', LocalStorage.getSingleThreadedMode());
    $('.settings-single-thread-mode').on('change', (e: any) => LocalStorage.setSingleThreadedMode(e.currentTarget.checked));

    $('.settings-button-language img').attr('src', '/img/flags/' + LocalStorage.getLanguage() + '.png');
    $('.settings-button-language').on('click', async () => await MainWindow.changeLanguage(that.patchInfo));

    $('.settings-button-overwolf-settings').on('click', () => { window.location.href = 'overwolf://settings/hotkeys'; });
    
    $('.settings-button-reset-tutorial').on('click', () => { LocalStorage.resetTutorials(); Tutorial.runWelcome(); });

    $('.settings-button-subscribe').on('click', async () => await Subscriptions.subscribe());
    $('.owad-container-footer').on('click', async () => await Subscriptions.subscribe());
    
    //Popup
    $('.popupCloseButton').on('click', () => { Popup.close(); });
    $('.popup-button-yes').on('click', () => { Popup.yes(); });
    $('.popup-button-no').on('click', () => { Popup.no(); });

    $('.popup-input-text-input').on('input', () => { Popup.textChange(); });
    //$('.popup-input-text-input').on('keypress', event => { if (event.key === "Enter") { Popup.yes(); event.preventDefault(); } });
    
    $('.popup-flag').on('click', event => { Popup.flagClick(event); });

    //Global
    $('.drags-window').each((index, elem) => { /* await */ this.setDrag(elem);});
    $('.closeButton').on('click', async () => { overwolf.windows.sendMessage(windowNames.background, 'close', '', () => {}); });
    $('.minimizeButton').on('click', () => { this.window.minimize(); });
    $('.rateApp').on('click', () => { overwolf.utils.openStore({ page:overwolf.utils.enums.eStorePage.ReviewsPage, uid:"ljkaeojllenacnoipfcdpdllhcfndmohikaiphgi"}); });

    $('body').on('keyup', async e => {
      if (new Date().getTime() - MainWindow.lastKeyPress < 250) return;
      if (Tutorial.isShowingTutorial()) {
        e.preventDefault(); 
        return;
      }

      MainWindow.lastKeyPress = new Date().getTime();
      if (e.key === "Escape") {
        Popup.close();
        $('.slide-overlay').stop();
        $('.slide-overlay').animate({ left: '100%' });
      } 
      if (e.key === "Enter") {
        Popup.yes();
        e.preventDefault(); 
      } 
      await MainWindow.activity();
    });
    $('body').on('mousedown', async () => await MainWindow.activity());
    $('.tooltip').on('mouseenter', e => that.repositionOverflowingPopup(e.currentTarget));

    $('.translated-text').on('DOMSubtreeModified', (e: any) => { Translator.updateTranslation(this.patchInfo, e.currentTarget); });
    Translator.updateAllTranslations(this.patchInfo);

  }

  //Make callbacks static since the 'this' is confusing to pass to a callback, use MainWindow.instance() instead
  public static showLcuCS() {
    const main = MainWindow.instance();
    if (!main.csTab.hasBeenUpdated) return; //Prevent show garbage
    if (main.selectedView == 'lcu') return; //Already selected

    MainWindow.clearAll();
    $('.cs-tab').show();
    $('.side-menu-current-cs').addClass('side-menu-selected-effect');

    main.selectedView = 'lcu';
    main.csTab.swapToLcu();
  }

  public static async addNewEditableHistoryCS() {
    const main = MainWindow.instance();
    if (await main.csTab.currentManagerHasRegion()) {
      await main.csTab.addEditableCsToHistory(null);
      MainWindow.showHistoryCS(0);
    } else {
      const patchInfo = main.patchInfo;
      const regions = Object.values(patchInfo.RegionIdToGg).map(x => (<string>x).toUpperCase());
      Popup.text(TranslatedText.editRegion.english, TranslatedText.enterRegionInitials.english, '', regions, async rawRegion => {
        const picked = Object.keys(patchInfo.RegionIdToGg).filter(k => patchInfo.RegionIdToGg[k].toUpperCase() == rawRegion.toUpperCase());
        if (picked.length == 0) {
          Popup.message(TranslatedText.error.english, TranslatedText.regionNotFound.english);
          return;
        }
        await main.csTab.addEditableCsToHistory(picked[0]);
        MainWindow.showHistoryCS(0);
      });  
    }
  }


  public static async showHistoryCS(i: number) {
    const main = MainWindow.instance();
    if (main.selectedView == 'hist' + i) return; //Already selected

    {
      //Hack for better percieved responsiveness, the swapToHistory takes some noticeable time and we want feedback from the menu before that time
      $($('.side-menu-old-cs')[i]).addClass('side-menu-selected-effect');
      await Timer.wait(1);
    }

    MainWindow.clearAll();
    $('.cs-tab').show();
    $($('.side-menu-old-cs')[i]).addClass('side-menu-selected-effect');

    main.selectedView = 'hist' + i;
    main.csTab.swapToHistory(i);
  }

  public static async deleteHistoryCS(i: number) {
    const main = MainWindow.instance();

    await main.csTab.deleteCSHistory(i);
    if (main.selectedView.startsWith('hist')) {
      let currI = parseInt(main.selectedView.substring('hist'.length));
      if (currI == i) {
        main.selectedView = 'deleted-hist';
        $($('.side-menu-old-cs')[i]).removeClass('side-menu-selected-effect');
      } else if (currI > i) {
        main.selectedView = 'hist' + (currI - 1);
        $($('.side-menu-old-cs')[currI - 1]).addClass('side-menu-selected-effect');
        $($('.side-menu-old-cs')[currI]).removeClass('side-menu-selected-effect');
      }
    }
  }

  public static async showPersonalTab() {
    const main = MainWindow.instance();
    if (main.selectedView == 'personal') return; //Already selected

    // if (!main.personalTab.readyToBeDisplayed()) {
    //   if (Subscriptions.isSubscribed()) {
    //     await main.personalTab.editSummonerAndRegion();
    //   } else {
    //     Popup.message(TranslatedText.lolDisconnected.english, TranslatedText.cscNotConnectingToLCU.english);
    //   }
    //   return;
    // }
    MainWindow.clearAll();
    $('.personal-tab').show();
    $('.s-lcu-status').addClass('s-lcu-status-selected');

    main.selectedView = 'personal';
    await main.personalTab.updateView();
  }

  public static showPersonalCS(csView: any) {
    const main = MainWindow.instance();
    if (main.selectedView == 'personal-cs') return; //Already selected

    MainWindow.clearAll();
    $('.cs-tab').show();

    main.selectedView = 'personal-cs';
    main.csTab.swapToPersonal(csView);
  }

  public static selectHome() {
    MainWindow.clearAll();
    $('.home-tab').show();
  }

  public static clearAll() {
    const main = MainWindow.instance();
    $('.personal-tab').hide();
    $('.cs-tab').hide();
    main.selectedView = '';

    $('.home-tab').hide();
    // $('.slide-overlay').stop();
    // $('.slide-overlay').animate({ left: '100%' });
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
      } catch{}

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
    } catch (ex) {
      $('.feedback-error').html(TranslatedText.anErrorOccurred.english);
      $('.feedback-error').hide();
      $('.feedback-error').fadeIn();
      ErrorReporting.report('submitFeedback', {ex});
    } finally {
      $('#feedback-name').removeAttr("disabled");
      $('#feedback-contact').removeAttr("disabled");
      $('#feedback-message').removeAttr("disabled");
    }
  }

  public static async setStatus(statusJSON: string) {
    try {
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

      if (MainWindow.currUpdateState != null && status.supportedVersions && status.supportedVersions.length > 0 && !status.supportedVersions.includes(version)) {
        await MainWindow.versionButtonClick(); //Force update if not supported and not up to date
      }
    } catch (ex) {
      ErrorReporting.report('setStatus', {ex, statusJSON});
    }
  }

  private static currUpdateState: string = null;
  private static async versionButtonClick() {
    $('.settings-button-version').hide(); //Also prevents multiple concurrent clicks
    $('.settings-version-loading-spinner').show();
    $('.settings-beta-version').attr("disabled", "disabled"); //Also prevents multiple concurrent clicks

    if (MainWindow.currUpdateState == null || MainWindow.currUpdateState == Updates.updateStates.UpToDate) {
      $('.settings-version-text').html(TranslatedText.checkingForUpdates.english);

      await Timer.wait(500); //Give the user time to see that it did click the button
      let currState = await Updates.getUpdateState();
      if (MainWindow.currUpdateState == null && currState != Updates.updateStates.UpToDate) {
        Popup.message(TranslatedText.update.english, TranslatedText.updateIsAvailable.english);
      }
      MainWindow.currUpdateState = currState;
    } else if (MainWindow.currUpdateState == Updates.updateStates.UpdateAvailable) {
      const updateRes = <any>await Updates.update();
      if (updateRes && updateRes.success && updateRes.state == Updates.updateStates.PendingRestart) {
        MainWindow.currUpdateState = Updates.updateStates.PendingRestart;
      } else {
        Popup.message(TranslatedText.error.english, TranslatedText.anErrorOccurred.english);
      }
    } else if (MainWindow.currUpdateState == Updates.updateStates.PendingRestart) {
      overwolf.extensions.relaunch();
    }

    if (MainWindow.currUpdateState == null || MainWindow.currUpdateState == Updates.updateStates.UpToDate) {
      $('.settings-version-text').html(TranslatedText.appIsUpToDate.english);
      $('.settings-button-version').html(TranslatedText.checkForUpdates.english);
    } else if (MainWindow.currUpdateState == Updates.updateStates.UpdateAvailable) {
      $('.settings-version-text').html(TranslatedText.updateAvailable.english);
      $('.settings-button-version').html(TranslatedText.downloadUpdate.english);
    } else if (MainWindow.currUpdateState == Updates.updateStates.PendingRestart) {
      $('.settings-version-text').html(TranslatedText.updateAvailable.english);
      $('.settings-button-version').html(TranslatedText.updateNow.english);
    }

    $('.settings-version-id').html(version);
    if (await Beta.isBetaVersion() && (MainWindow.currUpdateState == null || MainWindow.currUpdateState == Updates.updateStates.UpToDate)) {
      $('.settings-version-id-beta').show();
    } else {
      $('.settings-version-id-beta').hide();
    }

    $('.settings-beta-version').removeAttr("disabled");
    $('.settings-version-loading-spinner').hide();
    $('.settings-button-version').show();
  }

  private static async betaChange(beta: boolean) {
    await Beta.setBetaVersion(beta);
    MainWindow.currUpdateState = null;
    await MainWindow.versionButtonClick();
  }

  private static async setAutoOpenMode(mode: number) {
    $('.settings-auto-open-lcu').prop('checked', mode != 1 && mode != 2);
    $('.settings-auto-open-cs').prop('checked', mode == 1);
    $('.settings-auto-open-never').prop('checked', mode == 2);

    LocalStorage.setAutoOpenMode(mode);
  }

  private static async changeLanguage(patchInfo: any) {
    Popup.selectLanguage((newLang: string) => {
      LocalStorage.setLanguage(newLang);
      $('.settings-button-language img').attr('src', '/img/flags/' + newLang + '.png');
      Translator.updateAllTranslations(patchInfo);
    });
  }

  public async getWindowState() {
    return await this.window.getWindowState();
  }
  
  private async setDrag(elem: HTMLElement) {
    this.window.dragMove(elem);
  }


}


if (document.getElementById("owad")) {  //The background controller imports this class but we don't want it to run then and cause havoc
  MainWindow.instance().run();
}
