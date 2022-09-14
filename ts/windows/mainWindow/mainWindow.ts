import { windowNames } from "../../ts-lib/consts";
import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { Timer } from "../../ts-lib/timer";
import { OWWindow } from "../../ts-lib/ow-window";
import { CsTab } from "../../ts-lib/csTab";
import { PersonalTab } from "../../ts-lib/personalTab";
import { Logger } from "../../ts-lib/logger";
import { CSCAI } from "../../ts-lib/cscai";
import { Popup } from "../../ts-lib/popup";
import { Subscriptions } from "../../ts-lib/subscriptions";

export class MainWindow {
  private static _instance: MainWindow;
  protected window: OWWindow;

  private csTab: CsTab;
  private personalTab: PersonalTab;
  private selectedView: string = '';

  public patchInfo: any;

  public static MAX_MENU_HISTORY_SIZE: number = 10;

  constructor() {
    Logger.log("MainWindow begin");

    this.window = new OWWindow(windowNames.mainWindow);
    this.initWindow();
  }

  public static instance() {
    return this._instance = this._instance || new MainWindow();
  }

  public run() {}

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

  public async initWindow() {
    this.patchInfo = await CSCAI.getPatchInfo();
    await this.loadHTML();
    await this.setCallbacks();
    this.csTab = new CsTab(this.patchInfo);
    this.personalTab = new PersonalTab();

    this.personalTab.canvasDraw();

    //this.csTab.show();
    //this.personalTab.hide();
    // this.repositionOverflowingPopups();

    // const options = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua &amp; Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia &amp; Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre &amp; Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts &amp; Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad &amp; Tobago","Tunisia","Turkey","Turkmenistan","Turks &amp; Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];
    // Popup.text("Select Champion", "Enter the champion name", options, console.log);

    // Popup.selectLanguage(console.log);
    
  }

  private async loadHTML() {
    // Note, load everything but hide it, this is more efficient than having to reload every time

    //Side menu
    $('.side-menu').append(await (await fetch('sideMenu.html')).text());
    for (let i = 0; i < MainWindow.MAX_MENU_HISTORY_SIZE; ++i) {
      $('#side-menu-old-cs-list').append(await (await fetch('sideMenuOption.html')).text());
    }
    if (Subscriptions.isSubscribed()) {
      $('.side-menu-add-manual-cs').show();
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
          "Delete history",
          "This will remove this champion select lobby from your history<br>Are you sure?", 
          () => MainWindow.deleteHistoryCS(i), 
          () => null);
        event.stopPropagation(); 
      });
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
    
    $('.popupCloseButton').on('click', () => { Popup.close(); });
    $('.popup-button-yes').on('click', () => { Popup.yes(); });
    $('.popup-button-no').on('click', () => { Popup.no(); });

    $('.popup-input-text-input').on('input', () => { Popup.textChange(); });
    $('.popup-input-text-input').on('keypress', event => { if (event.key === "Enter") { Popup.yes(); event.preventDefault(); } });
    
    $('.popup-flag').on('click', event => { Popup.flagClick(event); });

    //CS
    const that = this;
    const roleSwappers = $('.cs-table-champion-swap-role').get();
    for (const i in roleSwappers) {
      const idx = Math.round(parseInt(i) % 4);
      const team = Math.floor((parseInt(i) / 4) % 2);
      const role = Math.floor(parseInt(i) / 8);
      $(roleSwappers[i]).on('click', () => that.csTab.swapRole(5 * team + role, idx + (role <= idx ? 1 : 0)));
    }

    const champSwappers = $('.cs-table-champion-swap-champion').get();
    for (const i in champSwappers) {
      const idx = Math.round(parseInt(i) % 4);
      const team = Math.floor((parseInt(i) / 4) % 2);
      const role = Math.floor(parseInt(i) / 8);
      $(champSwappers[i]).on('click', () => that.csTab.swapChampion(5 * team + role, 5 * team + idx + (role <= idx ? 1 : 0)));
    }

    const defaultSwappers = $('.cs-table-champion-swap-default').get();
    for (const i in defaultSwappers) {
      const idx = Math.round(parseInt(i) % 2);
      const team = Math.floor((parseInt(i) / 2) % 2);
      const role = Math.floor(parseInt(i) / 4);
      if (idx == 0) {
        $(defaultSwappers[i]).on('click', () => that.csTab.swapRole(5 * team + role, -1));
      } else {
        $(defaultSwappers[i]).on('click', () => that.csTab.swapChampion(5 * team + role, -1));
      }
    }

    const editIcons = $('.cs-table-edit-button').get();
    for (const i in editIcons) {
      const idx = Math.round(Math.floor((parseInt(i) + 1) / 2) % 2);
      const team = Math.floor((parseInt(i) / 2) % 2);
      const role = Math.floor(parseInt(i) / 4);

      const elm = editIcons[i]
      $(elm).parent().on('mouseenter', () => { if (that.csTab.getActiveManager().getCsView().editable) $(elm).show(); });
      $(elm).parent().on('mouseleave', () => $(elm).hide());
      if (idx == 0) {
        $(elm).on('click', () => that.csTab.editChampion(role + 5 * team));
      } else {
        $(elm).on('click', () => that.csTab.editSummoner(role + 5 * team));
      }
    }
    const regionEditIcon = $('.cs-region-edit-button').get(0);
    $('.cs-region').on('mouseenter', () => { if (that.csTab.getActiveManager().getCsView().editable) $(regionEditIcon).show(); });
    $('.cs-region').on('mouseleave', () => $(regionEditIcon).hide());
    $(regionEditIcon).on('click', () => that.csTab.editRegion());

    $('.cs-side-blue').on('change', () => { that.csTab.editSide(true); });
    $('.cs-side-red').on('change', () => { that.csTab.editSide(false); });

    $('.cs-queue-solo').on('change', () => { that.csTab.editQueue(true); });
    $('.cs-queue-flex').on('change', () => { that.csTab.editQueue(false); });
    
    //Global
    $('.drags-window').each((index, elem) => { this.setDrag(elem); });
    $('.closeButton').on('click', async () => { overwolf.windows.sendMessage(windowNames.background, 'close', '', () => {}); });
    $('.minimizeButton').on('click', () => { this.window.minimize(); });
    $('.rateApp').on('click', () => { overwolf.utils.openStore({ page:overwolf.utils.enums.eStorePage.ReviewsPage, uid:"ljkaeojllenacnoipfcdpdllhcfndmohikaiphgi"}); });

    $('body').on('keyup', e => { if (e.key === "Escape") Popup.close(); });
    $('.tooltip').on('mouseenter', e => that.repositionOverflowingPopup(e.currentTarget));
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

  public static async selectHistoryCS(i: number) {
    const main = MainWindow.instance();
    if (null == i) {
      main.csTab.addManualCs();
      i = 0;
    } else if (main.selectedView == 'hist' + i) return;

    //Hack for better percieved responsiveness, the swapToManual takes some noticeable time and we want feedback from the menu before that time
    {
      $('.s-lcu-status-selected').removeClass('s-lcu-status-selected');
      $('.side-menu-selected-effect').removeClass('side-menu-selected-effect');
      $($('.side-menu-old-cs')[i]).addClass('side-menu-selected-effect');
      await Timer.wait(1);
    }

    main.selectedView = 'hist' + i;
    main.csTab.swapToManual(i);
    main.personalTab.hide();
    main.csTab.show();

    $('.s-lcu-status-selected').removeClass('s-lcu-status-selected');
    $('.side-menu-selected-effect').removeClass('side-menu-selected-effect');
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
      else MainWindow.showBackground();
    }
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

  public static showBackground() {
    const main = MainWindow.instance();
    main.personalTab.hide();
    main.csTab.hide();
    main.selectedView = '';
  }

  public async getWindowState() {
    return await this.window.getWindowState();
  }
  
  private async setDrag(elem: HTMLElement) {
    this.window.dragMove(elem);
  }



}

MainWindow.instance().run();