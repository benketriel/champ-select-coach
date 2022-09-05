import { windowNames } from "../../ts-lib/consts";
import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { Timer } from "../../ts-lib/timer";
import { OWWindow } from "../../ts-lib/ow-window";
import { CsTab } from "../../ts-lib/csTab";
import { PersonalTab } from "../../ts-lib/personalTab";
import { Logger } from "../../ts-lib/logger";
import { CSCAI } from "../../ts-lib/cscai";

export class MainWindow {
  private static _instance: MainWindow;
  protected window: OWWindow;

  private csTab: CsTab;
  private personalTab: PersonalTab;
  private selectedView: string = '';

  public patchInfo: any;

  public static MAX_MENU_HISTORY_SIZE: number = 10;

  constructor() {
    this.window = new OWWindow(windowNames.mainWindow);
    this.initWindow();
  }

  public static instance() {
    return this._instance = this._instance || new MainWindow();
  }

  public run() {}

  public repositionOverflowingPopups() {
    const bodyHeight = $('body').height();
    const bodyWidth = $('body').width();
    for(var tt of $('.tooltiptext')) {
      const currPos = $(tt).offset();
      let originalTop = $(tt).attr('data-original-top');
      let originalLeft = $(tt).attr('data-original-left');
      if (!originalTop || ! originalLeft) {
        originalTop = currPos.top.toString();
        originalLeft = currPos.left.toString();
        $(tt).attr('data-original-top', originalTop);
        $(tt).attr('data-original-left', originalLeft);
      }
      const offsetX = $(tt).outerWidth() + parseInt(originalLeft) - (bodyWidth - 2);
      const offsetY = $(tt).outerHeight() + parseInt(originalTop) - (bodyHeight - 2);
      if (offsetY > 0 || offsetX > 0) {
        $(tt).offset({ left: Math.min(parseInt(originalLeft), parseInt(originalLeft) - offsetX), top: Math.min(parseInt(originalTop), parseInt(originalTop) - offsetY) });
      }
    }
  }

  public async initWindow() {
    this.patchInfo = await CSCAI.getPatchInfo();
    this.csTab = new CsTab(this.patchInfo);
    this.personalTab = new PersonalTab();
    await this.loadHTML();
    await this.setCallbacks();

    this.personalTab.canvasDraw();

    this.csTab.show();
    this.personalTab.hide();
    this.repositionOverflowingPopups();

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
    for (let i = 0; i < 6; ++i) {
      $('.cs-table-recommended-champions-cell .cs-table-cell').append(await (await fetch('csTabRecommendationItem.html')).text());
    }
    for (let i = 0; i < 8; ++i) {
      $('.cs-table-history-cell .cs-table-cell').append(await (await fetch('csTabHistoryItem.html')).text());
    }

  }

  private async setCallbacks() {
    //Call this function once, else add .off() calls before each .on()

    //Menu navigation
    $('.side-menu-current-cs').on('click', MainWindow.selectCurrentCS);
    for (let i = 0; i < 10; ++i) {
      $($('.side-menu-old-cs')[i]).on('click', () => MainWindow.selectHistoryCS(i));
    }
    $('.side-menu-add-manual-cs').on('click', () => MainWindow.selectHistoryCS(null));
    $('.s-lcu-status').on('click', MainWindow.selectPersonal);

    //Popup navigation
    $('.homeButton').on('click', async () => { 
      $('.slide-overlay').animate({ left: '100%' });
    });
    $('.infoButton').on('click', async () => { 
      $('.slide-overlay-settings').animate({ left: '100%' });
      $('.slide-overlay-feedback').animate({ left: '100%' });
      $('.slide-overlay-info').animate({ left: 0 });
    });
    $('.settingsButton').on('click', async () => { 
      $('.slide-overlay-info').animate({ left: '100%' });
      $('.slide-overlay-feedback').animate({ left: '100%' });
      $('.slide-overlay-settings').animate({ left: 0 });
    });
    $('.feedbackButton').on('click', async () => { 
      $('.slide-overlay-info').animate({ left: '100%' });
      $('.slide-overlay-settings').animate({ left: '100%' });
      $('.slide-overlay-feedback').animate({ left: 0 });
    });
    $('.backButton').on('click', () => { 
      $('.slide-overlay').animate({ left: '100%' });
    });

    //Global
    $('.drags-window').each((index, elem) => { this.setDrag(elem); });
    $('.closeButton').on('click', async () => { overwolf.windows.sendMessage(windowNames.background, 'close', '', () => {}); });
    $('.minimizeButton').on('click', () => { this.window.minimize(); });
    $('.rateApp').on('click', () => { overwolf.utils.openStore({ page:overwolf.utils.enums.eStorePage.ReviewsPage, uid:"ljkaeojllenacnoipfcdpdllhcfndmohikaiphgi"}); });

  }

  //Make callbacks static since the 'this' is confusing to pass to a callback, use MainWindow.instance() instead
  public static selectCurrentCS() {
    const main = MainWindow.instance();
    if (!main.csTab.hasBeenInCS) return;
    if (main.selectedView == 'lcu') return;
    main.selectedView = 'lcu';

    main.csTab.swapToLcu();
    main.personalTab.hide();
    main.csTab.show();

    $('.s-lcu-status-selected').removeClass('s-lcu-status-selected');
    $('.side-menu-selected-effect').removeClass('side-menu-selected-effect');
    $('.side-menu-current-cs').addClass('side-menu-selected-effect');
  }

  public static selectHistoryCS(i: number) {
    const main = MainWindow.instance();
    if (main.selectedView == 'hist' + i) return;
    main.selectedView = 'hist' + i;

    if (i = null) {
      main.csTab.addManualCs();
      i = 0;
    }
    main.csTab.swapToManual(i);
    main.personalTab.hide();
    main.csTab.show();

    $('.s-lcu-status-selected').removeClass('s-lcu-status-selected');
    $('.side-menu-selected-effect').removeClass('side-menu-selected-effect');
    $($('.side-menu-old-cs')[i]).addClass('side-menu-selected-effect');
  }

  public static selectPersonal() {
    const main = MainWindow.instance();
    if (main.selectedView == 'personal') return;
    main.selectedView = 'personal';

    main.csTab.hide();
    main.personalTab.show();

    $('.side-menu-selected-effect').removeClass('side-menu-selected-effect');
    $('.s-lcu-status').addClass('s-lcu-status-selected');
  }


  public static async waitForWindowToOpen(w: OWWindow) {
    let i = 0;
    while (++i < 500 && (await w.getWindowState()).window_state_ex == 'closed') {
      await Timer.wait(100);
    }
  }

  public async getWindowState() {
    return await this.window.getWindowState();
  }
  
  private async setDrag(elem: HTMLElement) {
    this.window.dragMove(elem);
  }



}

MainWindow.instance().run();