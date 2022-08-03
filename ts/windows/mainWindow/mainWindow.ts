import { lcuClassId, windowNames } from "../../ts-lib/consts";
import { Beta } from "../../ts-lib/beta";
import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { Timer } from "../../ts-lib/timer";
import { Lcu } from "../../ts-lib/lcu";
import { Aws } from "../../ts-lib/aws";
import { Settings } from "../../ts-lib/settings";
import { OWWindow } from "../../ts-lib/ow-window";
import { Logger } from "../../ts-lib/logger";

export class MainWindow {
  private static _instance: MainWindow;
  protected window: OWWindow;

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
      const offsetX = $(tt).outerWidth() + currPos.left - (bodyWidth - 2);
      const offsetY = $(tt).outerHeight() + currPos.top - (bodyHeight - 2);
      if (offsetY > 0 || offsetX > 0) {
        $(tt).offset({ left: Math.min(currPos.left, currPos.left - offsetX), top: Math.min(currPos.top, currPos.top - offsetY) });
      }
    }
  }

  public async initWindow() {
    $('.side-menu').append(await (await fetch('sideMenu.html')).text());
    $('.home-tab').append(await (await fetch('homeTab.html')).text());
    $('.settings-tab').append(await (await fetch('settingsTab.html')).text());
    $('.faq-tab').append(await (await fetch('faqTab.html')).text());
    $('.feedback-tab').append(await (await fetch('feedbackTab.html')).text());

    //For debugging:
    for(let i = 0; i < 10; ++i) {
      $('#side-menu-old-cs-list').append(await (await fetch('sideMenuOption.html')).text());
    }
    $('.cs-tab').append(await (await fetch('csTab.html')).text());
    for(let i = 0; i < 5; ++i) {
      $('.cs-table').append(await (await fetch('csTabRow.html')).text());
    }
    for(let i = 0; i < 6; ++i) {
      $('.cs-table-recommended-champions-cell .cs-table-cell').append(await (await fetch('csTabRecommendationItem.html')).text());
    }
    for(let i = 0; i < 8; ++i) {
      $('.cs-table-history-cell .cs-table-cell').append(await (await fetch('csTabHistoryItem.html')).text());
    }
    
    
    this.repositionOverflowingPopups();
    

    // $('#autoLoad').prop("checked", Settings.autoLoadOnChampionSelect());
    // $('#autoLoad').on('change', () => { Settings.autoLoadOnChampionSelect($('#autoLoad').prop("checked").toString() == 'true') });

    // Beta.isBetaVersion().then(v => $('#betaVersion').prop("checked", v));
    // $('#betaVersion').on('change', async () => { await Beta.setBetaVersion($('#betaVersion').prop("checked")); });
    
    //Messaging between windows
    // overwolf.windows.onMessageReceived.addListener(async (message: overwolf.windows.MessageReceivedEvent) => { if (message.id === 'home') { } });
    // overwolf.windows.sendMessage(windowNames.mainWindow, 'home', '', () => {});

    $('.drags-window').each((index, elem) => { this.setDrag(elem); });

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
    $('.rateApp').on('click', () => {
      overwolf.utils.openStore({ page:overwolf.utils.enums.eStorePage.ReviewsPage, uid:"ljkaeojllenacnoipfcdpdllhcfndmohikaiphgi"});
    });

    $('.closeButton').on('click', async () => { overwolf.windows.sendMessage(windowNames.background, 'close', '', () => {}); });
    $('.minimizeButton').on('click', () => { this.window.minimize(); });

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