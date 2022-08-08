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
    $('.faq-tab').append(await (await fetch('faqTab.html')).text());
    $('.settings-tab').append(await (await fetch('settingsTab.html')).text());
    $('.feedback-tab').append(await (await fetch('feedbackTab.html')).text());
    $('.news-tab').append(await (await fetch('newsTab.html')).text());
    $('.personal-tab').append(await (await fetch('personalTab.html')).text());

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
    
    for(let i = 0; i < 4; ++i) {
      $('.personal-champions-list').append(await (await fetch('personalTabChampionItem.html')).text());
    }

    for(let i = 0; i < 10; ++i) {
      $('.personal-history-list').append(await (await fetch('personalTabHistoryItem.html')).text());
    }

    
    

    this.repositionOverflowingPopups();

    //Canvas drawing
    const canvas : any = $('.personal-graph-canvas').get()[0];
    canvas.width = 320;
    canvas.height = 220;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#BE943A";
    const yellow = "#BE943A"; //Yellowish
    const white = "#DFDACB"; //White
    const blue = "#3B6284"; //Blue
    const red = "#755663"; //Red
    const shadow = "#000000"; //Shadow
    // ctx.fillRect(0, 0, 150, 75);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    for (let sh = 0; sh < 2; ++sh) {
      const o = sh == 0 ? 2 : 0;
      ctx.strokeStyle = sh == 0 ? shadow : yellow;

      ctx.beginPath();
      ctx.moveTo(o + 10, o + 10);
      ctx.lineTo(o + 10, o + 210);
      ctx.lineTo(o + 310, o + 210);
      // ctx.closePath();
      ctx.stroke();
      for (let i = 1; i <= 9; ++i){
        ctx.beginPath();
        ctx.moveTo(o + 10, o + 10 + 20 * i);
        ctx.lineTo(o + 3, o + 10 + 20 * i);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(o + 10 + 30 * i, o + 210);
        ctx.lineTo(o + 10 + 30 * i, o + 217);
        ctx.stroke();
      }
    }

    const all = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    const csc = [0, 0.13, 0.22, 0.31, 0.47, 0.57, 0.62, 0.76, 0.85, 0.91, null]
    const player = [null, 0.0, 1.0, 0.31, 0.37, 0.47, 0.72, 0.56, null, null, null]
    for (let wh = 0; wh < 10; ++wh) {
      ctx.strokeStyle = wh == 0 ? white : wh == 1 ? blue : red;
      const data = wh == 0 ? all : wh == 1 ? csc : player;
      for (let i = 1; i < 9; ++i) {
        var y0 = data[i];
        var y1 = data[i + 1];
        if (y0 != null && y1 != null) {
          ctx.beginPath();
          ctx.moveTo(10 + 30 * i, 210 - 200 * y0);
          ctx.lineTo(10 + 30 * (i + 1), 210 - 200 * y1);
          ctx.stroke();
        }
      }
    }

    // // the fill color
    // ctx.fill();
    

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