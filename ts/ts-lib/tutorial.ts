import * as $ from 'jquery'; //npm install --save-dev @types/jquery
import { ErrorReporting } from './errorReporting';
import { LocalStorage } from './localStorage';
import { Logger } from './logger';
import { Popup } from './popup';
import { TranslatedText } from './textLanguage';
import { Timer } from './timer';

export class TutorialStep {
  public focusX1: number = 0;
  public focusX2: number = 0;
  public focusY1: number = 0;
  public focusY2: number = 0;

  public msgX: number = 0;
  public msgY: number = 0;
  public msgMaxWidth: number = 0;

  public text: string = '';
  public onStart: any = () => {};
  public onEnd: any = () => {};
}

export class Tutorial {
  public static WINDOW_WIDTH = 1298;
  public static WINDOW_HEIGHT = 718;

  public static init() {
    $('.tutorial-text-buttons-backToStart').on('click', () => Tutorial.goFirst());
    $('.tutorial-text-buttons-backOne').on('click', () => Tutorial.goPrevious());
    $('.tutorial-text-buttons-forwardOne').on('click', () => Tutorial.goNext());
    $('.tutorial-text-buttons-forwardToEnd').on('click', () => Tutorial.goLast());
    $('.tutorial-text-buttons-end').on('click', () => Tutorial.goEnd());

    //Tutorial.setBackgroundBox(Tutorial.WINDOW_WIDTH / 2, Tutorial.WINDOW_WIDTH / 2, Tutorial.WINDOW_HEIGHT / 2, Tutorial.WINDOW_HEIGHT / 2);
    //Tutorial.setInfoBox('', true, true, Tutorial.WINDOW_WIDTH / 2, Tutorial.WINDOW_HEIGHT / 2);
  }

  public static isShowingTutorial() {
    return Tutorial.currentTutorialName != '';
  }

  public static runDummy() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    /*await*/ Tutorial.runTutorial('dummy', [
      {
        focusX1: 0,
        focusX2: 0,
        focusY1: 0,
        focusY2: 0,
        msgX: 0, //(document.querySelector("body > div > main > div.tutorial-text-box").getBoundingClientRect().right - document.querySelector("body > div > main > div.tutorial-text-box").getBoundingClientRect().left) / 2+ document.querySelector("body > div > main > div.tutorial-text-box").getBoundingClientRect().left
        msgY: 0,
        msgMaxWidth: 400,
        text: '',
        onStart: () => {},
        onEnd: () => {},
      },
    ]);
  }

  public static runWelcome() {
    /*await*/ Tutorial.runTutorial('welcome', [
      {
        focusX1: Tutorial.WINDOW_WIDTH / 2,
        focusX2: Tutorial.WINDOW_WIDTH / 2,
        focusY1: Tutorial.WINDOW_HEIGHT / 2,
        focusY2: Tutorial.WINDOW_HEIGHT / 2,
        msgX: Tutorial.WINDOW_WIDTH / 2,
        msgY: 150,
        msgMaxWidth: 500,
        text: TranslatedText.tutWelcome0.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: 0,
        focusX2: 210,
        focusY1: 35,
        focusY2: 125,
        msgX: 105,
        msgY: 125,
        msgMaxWidth: 150,
        text: TranslatedText.tutWelcome1.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 0,
        focusX2: 210,
        focusY1: 125,
        focusY2: 685,
        msgX: 285,
        msgY: 300,
        msgMaxWidth: 150,
        text: TranslatedText.tutWelcome2.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 895,
        focusX2: 1120,
        focusY1: 1,
        focusY2: 32,
        msgX: 1011 - 20,
        msgY: 31,
        msgMaxWidth: 300,
        text: TranslatedText.tutWelcome3.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 215,
        focusX2: 891,
        focusY1: 45,
        focusY2: 501,
        msgX: 1049,
        msgY: 90,
        msgMaxWidth: 300,
        text: TranslatedText.tutWelcome4.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 216,
        focusX2: 891,
        focusY1: 505,
        focusY2: 711,
        msgX: 1025,
        msgY: 520,
        msgMaxWidth: 250,
        text: TranslatedText.tutWelcome5.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 237,
        focusX2: 359,
        focusY1: 611,
        focusY2: 663,
        msgX: 593,
        msgY: 578,
        msgMaxWidth: 450,
        text: TranslatedText.tutWelcome6.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 899,
        focusX2: 1290,
        focusY1: 44,
        focusY2: 378,
        msgX: 770,
        msgY: 111,
        msgMaxWidth: 250,
        text: TranslatedText.tutWelcome7.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: 229,
        focusX2: 513,
        focusY1: 329,
        focusY2: 395,
        msgX: 371,
        msgY: 393,
        msgMaxWidth: 350,
        text: TranslatedText.tutWelcome8.english,
        onStart: () => {
          $('.settingsButton').trigger('click');
        },
        onEnd: () => {
          $('.homeButton').trigger('click');
        },
      },
    ]);
  }

  public static runShowingPersonalCard() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    if ($('.personal-champions-table-container:visible').length == 0) return;

    const elmn0 = $('.personal-champions-table-container').get(0);
    const rect0 = elmn0.getBoundingClientRect();
    const elmn1 = $(elmn0).find('.personal-champions-solo-score').get(0);
    const rect1 = elmn1.getBoundingClientRect();
    const elmn2 = $('.personal-champions-kp').get(0);
    const rect2 = elmn2.getBoundingClientRect();

    /*await*/ Tutorial.runTutorial('showingPersonalCard', [
      {
        focusX1: rect0.left - 2,
        focusX2: rect0.right,
        focusY1: rect0.top - 2,
        focusY2: rect0.bottom,
        msgX: rect0.right + 160,
        msgY: rect0.bottom + 0.9 * (rect0.top - rect0.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutShowingPersonalCard0.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: rect0.left - 2,
        focusX2: rect0.right,
        focusY1: rect1.top - 2,
        focusY2: rect1.bottom,
        msgX: rect0.right + 160,
        msgY: rect1.bottom + 0.9 * (rect1.top - rect1.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutShowingPersonalCard1.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: rect0.left - 2,
        focusX2: rect0.right,
        focusY1: rect2.top - 2,
        focusY2: rect0.bottom,
        msgX: rect0.right + 160,
        msgY: rect0.bottom + 0.9 * (rect2.top - rect0.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutShowingPersonalCard2.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
    ]);
  }

  public static runHistoryInPersonalTab() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    if ($('.personal-history-list:visible').length == 0) return;
    if ($('.personal-history-stats-total-user:visible').length == 0) return;

    const elmn0 = $('.personal-history-list').get(0);
    const rect0 = elmn0.getBoundingClientRect();
    const elmn1 = $('.personal-history-stats-total-user').get(0);
    const rect1 = elmn1.getBoundingClientRect();

    /*await*/ Tutorial.runTutorial('historyInPersonalTab', [
      {
        focusX1: rect0.left - 2,
        focusX2: rect0.right,
        focusY1: rect0.top - 2,
        focusY2: rect0.bottom,
        msgX: rect0.right + 160,
        msgY: rect0.bottom + 1.3 * (rect0.top - rect0.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutHistoryInPersonalTab0.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: rect1.left - 2,
        focusX2: rect1.right,
        focusY1: rect1.top - 2,
        focusY2: rect1.bottom,
        msgX: rect1.right + 330,
        msgY: rect1.bottom + 3.5 * (rect1.top - rect1.bottom),
        msgMaxWidth: 600,
        text: TranslatedText.tutHistoryInPersonalTab1.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
    ]);
  }

  public static runLcuCS() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    if ($('.side-menu-current-cs:visible').length == 0) return;
    if ($('.cs-wr-total-cell:visible').length == 0) return;

    const elmn0 = $('.side-menu-current-cs').get(0);
    const rect0 = elmn0.getBoundingClientRect();
    const elmn1 = $('.cs-wr-total-cell').get(0);
    const rect1 = elmn1.getBoundingClientRect();
    const elmn2 = $('.cs-table').get(0);
    const rect2 = elmn2.getBoundingClientRect();

    /*await*/ Tutorial.runTutorial('lcuCS', [
      {
        focusX1: rect0.left - 2,
        focusX2: rect0.right,
        focusY1: rect0.top - 2,
        focusY2: rect0.bottom,
        msgX: rect0.right + 160,
        msgY: rect0.bottom + 1.0 * (rect0.top - rect0.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutLcuCS0.english,
        onStart: () => {
          $('.side-menu-current-cs').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: rect1.left - 2,
        focusX2: rect1.right,
        focusY1: rect1.top - 2,
        focusY2: rect1.bottom,
        msgX: (rect1.right + rect1.left) * 0.5,
        msgY: rect1.bottom + 0.0 * (rect1.top - rect1.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutLcuCS1.english,
        onStart: () => {
          $('.side-menu-current-cs').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: rect2.left - 2,
        focusX2: rect2.right,
        focusY1: rect2.top - 2,
        focusY2: rect2.bottom,
        msgX: (rect2.right + rect2.left) * 0.5,
        msgY: rect2.bottom + 0.7 * (rect2.top - rect2.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutLcuCS2.english,
        onStart: () => {
          $('.side-menu-current-cs').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: Tutorial.WINDOW_WIDTH / 2,
        focusX2: Tutorial.WINDOW_WIDTH / 2,
        focusY1: Tutorial.WINDOW_HEIGHT / 2,
        focusY2: Tutorial.WINDOW_HEIGHT / 2,
        msgX: Tutorial.WINDOW_WIDTH / 2,
        msgY: Tutorial.WINDOW_HEIGHT * 0.2,
        msgMaxWidth: 300,
        text: TranslatedText.tutLcuCS3.english,
        onStart: () => {
          $('.side-menu-current-cs').trigger('click');
        },
        onEnd: () => {},
      },
    ]);
  }

  public static runMenuCS() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    const elmn0 = $('#side-menu-old-cs-list').get(0);
    const rect0 = elmn0.getBoundingClientRect();

    /*await*/ Tutorial.runTutorial('menuCS', [
      {
        focusX1: rect0.left - 2,
        focusX2: rect0.right,
        focusY1: rect0.top - 2,
        focusY2: rect0.bottom,
        msgX: rect0.right + 160,
        msgY: rect0.bottom + 0.7 * (rect0.top - rect0.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutMenuCS0.english,
        onStart: () => {},
        onEnd: () => {},
      },
    ]);
  }

  public static runCSReady() {
    let histElmn = null;
    for (let elmn of $('.cs-table-history-cell')) {
      const el = $(elmn).find('.cs-table-history:visible');
      if (el.length == 0) continue;
      histElmn = elmn;
      break;
    }
    if (histElmn == null) return;
    const histRect = histElmn.getBoundingClientRect();

    let recommendElmn = null;
    for (let elmn of $('.cs-table-recommended-champions-cell')) {
      const el = $(elmn).find('.cs-table-recommended-champion:visible');
      if (el.length == 0) continue;
      recommendElmn = elmn;
      break;
    }
    if (recommendElmn == null) return;
    const recommendRect = recommendElmn.getBoundingClientRect();

    if ($('.cs-wr-total-left-result').html().length == 0) return;
    if ($('.cs-wr-total-right-result').html().length == 0) return;

    const indBox = $('.cs-table-individuals-p').get(0).getBoundingClientRect();
    const otherIndBox = $('.cs-table-individuals-p').get(1).getBoundingClientRect();
    const teamBox = $('.cs-table-individuals-p').get(2).getBoundingClientRect();
    const otherTeamBox = $('.cs-table-individuals-p').get(3).getBoundingClientRect();

    const champBox = $('.cs-table-champion-icon').get(0).getBoundingClientRect();
    const nameBox = $('.cs-table-summoner-name-cell').get(0).getBoundingClientRect();

    const rolesRect0 = $('.cs-table-main-role-win-lose-cell').get(0).getBoundingClientRect();
    const rolesRect1 = $('.cs-table-secondary-role-win-lose-cell').get(0).getBoundingClientRect();
    const otherRolesRect1 = $('.cs-table-secondary-role-win-lose-cell').get(1).getBoundingClientRect();

    const prioRect = $('.cs-table-prio-cell').get(0).getBoundingClientRect();
    const laneWinRect = $('.cs-table-lane-winner-cell').get(0).getBoundingClientRect();

    const wrTotalRect = $('.cs-wr-total-result').get(0).getBoundingClientRect();
    const wrLeftRect = $('.cs-wr-total-left-result').get(0).getBoundingClientRect();
    const wrRightRect = $('.cs-wr-total-right-result').get(0).getBoundingClientRect();

    const legendRect = $('.cs-colors-legend-table').get(0).getBoundingClientRect();
    const barsRect = $('.cs-total-bars-table').get(0).getBoundingClientRect();
    const footerRect = $('.cs-footer').get(0).getBoundingClientRect();

    //Tutorial.runWelcome(); //Don't run because you need to stay on this selected CS

    /*await*/ Tutorial.runTutorial('CSReady', [
      {
        focusX1: Tutorial.WINDOW_WIDTH / 2,
        focusX2: Tutorial.WINDOW_WIDTH / 2,
        focusY1: Tutorial.WINDOW_HEIGHT / 2,
        focusY2: Tutorial.WINDOW_HEIGHT / 2,
        msgX: Tutorial.WINDOW_WIDTH / 2,
        msgY: Tutorial.WINDOW_HEIGHT * 0.2,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady0.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: champBox.left - 2,
        focusX2: otherRolesRect1.right,
        focusY1: nameBox.top - 2,
        focusY2: otherRolesRect1.bottom,
        msgX: (otherRolesRect1.right + champBox.left) * 0.5,
        msgY: otherRolesRect1.bottom,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady1.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: champBox.left - 2,
        focusX2: nameBox.right,
        focusY1: nameBox.top - 2,
        focusY2: champBox.bottom,
        msgX: nameBox.right + 160,
        msgY: champBox.bottom + 1.0 * (nameBox.top - champBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady2.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: indBox.left - 2,
        focusX2: indBox.right,
        focusY1: indBox.top - 2,
        focusY2: indBox.bottom,
        msgX: indBox.right + 160,
        msgY: indBox.bottom + 1.0 * (indBox.top - indBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady3.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: teamBox.left - 2,
        focusX2: teamBox.right,
        focusY1: teamBox.top - 2,
        focusY2: teamBox.bottom,
        msgX: teamBox.right + 160,
        msgY: teamBox.bottom + 1.0 * (teamBox.top - teamBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady4.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: otherIndBox.left - 2,
        focusX2: otherIndBox.right,
        focusY1: otherIndBox.top - 2,
        focusY2: otherTeamBox.bottom,
        msgX: otherIndBox.right + 160,
        msgY: otherTeamBox.bottom + 1.0 * (otherIndBox.top - otherTeamBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady5.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: recommendRect.left - 2,
        focusX2: recommendRect.right,
        focusY1: recommendRect.top - 2,
        focusY2: recommendRect.bottom,
        msgX: recommendRect.right + 160,
        msgY: recommendRect.bottom + 1.0 * (recommendRect.top - recommendRect.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady6.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: rolesRect0.left - 2,
        focusX2: rolesRect0.right,
        focusY1: rolesRect0.top - 2,
        focusY2: rolesRect1.bottom,
        msgX: rolesRect0.right + 160,
        msgY: rolesRect1.bottom + 1.0 * (rolesRect0.top - rolesRect1.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady7.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: histRect.left - 2,
        focusX2: histRect.right,
        focusY1: histRect.top - 2,
        focusY2: histRect.bottom,
        msgX: histRect.right + 160,
        msgY: histRect.bottom + 1.0 * (histRect.top - histRect.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady8.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: prioRect.left - 2,
        focusX2: prioRect.right,
        focusY1: prioRect.top - 2,
        focusY2: prioRect.bottom,
        msgX: prioRect.right + 160,
        msgY: prioRect.bottom + 1.0 * (prioRect.top - prioRect.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady9.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: laneWinRect.left - 2,
        focusX2: laneWinRect.right,
        focusY1: laneWinRect.top - 2,
        focusY2: laneWinRect.bottom,
        msgX: laneWinRect.right + 160,
        msgY: laneWinRect.bottom + 1.0 * (laneWinRect.top - laneWinRect.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady10.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: wrLeftRect.left - 2,
        focusX2: wrLeftRect.right,
        focusY1: wrLeftRect.top - 2,
        focusY2: wrLeftRect.bottom,
        msgX: (wrLeftRect.right + wrLeftRect.left) * 0.5,
        msgY: wrLeftRect.bottom,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady11.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: wrRightRect.left - 2,
        focusX2: wrRightRect.right,
        focusY1: wrRightRect.top - 2,
        focusY2: wrRightRect.bottom,
        msgX: (wrRightRect.right + wrRightRect.left) * 0.5,
        msgY: wrRightRect.bottom,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady12.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: wrTotalRect.left - 2,
        focusX2: wrTotalRect.right,
        focusY1: wrTotalRect.top - 2,
        focusY2: wrTotalRect.bottom,
        msgX: (wrTotalRect.right + wrTotalRect.left) * 0.5,
        msgY: wrTotalRect.bottom,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady13.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: legendRect.left - 2,
        focusX2: legendRect.right,
        focusY1: legendRect.top - 2,
        focusY2: barsRect.bottom,
        msgX: (legendRect.right + legendRect.left) * 0.5,
        msgY: barsRect.bottom,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady14.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: footerRect.left - 2,
        focusX2: footerRect.right,
        focusY1: footerRect.top - 2,
        focusY2: footerRect.bottom,
        msgX: (footerRect.right + footerRect.left) * 0.5,
        msgY: footerRect.bottom,
        msgMaxWidth: 300,
        text: TranslatedText.tutCSReady15.english,
        onStart: () => {},
        onEnd: () => {},
      },
    ]);
  }

  public static runProVersion() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    if ($('.personal-title-edit-button:visible').length == 0) return;
    if ($('.side-menu-add-manual-cs:visible').length == 0) return;

    const champsContainerBox = $('.personal-champions-container').get(0).getBoundingClientRect();
    const personalTitleBox = $('.personal-title').get(0).getBoundingClientRect();
    const addManualCS = $('.side-menu-add-manual-cs').get(0).getBoundingClientRect();

    /*await*/ Tutorial.runTutorial('proVersion', [
      {
        focusX1: Tutorial.WINDOW_WIDTH / 2,
        focusX2: Tutorial.WINDOW_WIDTH / 2,
        focusY1: Tutorial.WINDOW_HEIGHT / 2,
        focusY2: Tutorial.WINDOW_HEIGHT / 2,
        msgX: Tutorial.WINDOW_WIDTH / 2,
        msgY: Tutorial.WINDOW_HEIGHT * 0.2,
        msgMaxWidth: 400,
        text: TranslatedText.tutProVersion0.english,
        onStart: () => {
          $('.homeButton').trigger('click');
        },
        onEnd: () => {},
      },
      {
        focusX1: champsContainerBox.left - 2,
        focusX2: champsContainerBox.right,
        focusY1: personalTitleBox.top - 2,
        focusY2: personalTitleBox.bottom,
        msgX: (champsContainerBox.right + champsContainerBox.left) * 0.5,
        msgY: personalTitleBox.bottom + 0.0 * (personalTitleBox.top - personalTitleBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutProVersion1.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: addManualCS.left - 2,
        focusX2: addManualCS.right,
        focusY1: addManualCS.top - 2,
        focusY2: addManualCS.bottom,
        msgX: addManualCS.right + 160,
        msgY: addManualCS.bottom + 1.0 * (addManualCS.top - addManualCS.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutProVersion2.english,
        onStart: () => {},
        onEnd: () => {},
      },
    ]);
  }

  public static runEditableCS() {
    Tutorial.runWelcome(); //Make sure this has been shown first

    if ($('.cs-table-champion-icon:visible').length == 0) return;
    if ($('.cs-table-summoner-name-cell:visible').length == 0) return;

    const champBox = $('.cs-table-champion-icon').get(0).getBoundingClientRect();
    const nameBox = $('.cs-table-summoner-name-cell').get(0).getBoundingClientRect();
    const swapRect = $('.cs-table-champion-swap').get(0).getBoundingClientRect(); //This is only in live or editable
    const footerRect = $('.cs-footer').get(0).getBoundingClientRect();

    /*await*/ Tutorial.runTutorial('editableCS', [
      {
        focusX1: Tutorial.WINDOW_WIDTH / 2,
        focusX2: Tutorial.WINDOW_WIDTH / 2,
        focusY1: Tutorial.WINDOW_HEIGHT / 2,
        focusY2: Tutorial.WINDOW_HEIGHT / 2,
        msgX: Tutorial.WINDOW_WIDTH / 2,
        msgY: Tutorial.WINDOW_HEIGHT * 0.2,
        msgMaxWidth: 400,
        text: TranslatedText.tutEditableCs0.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: champBox.left - 2,
        focusX2: champBox.right,
        focusY1: champBox.top - 2,
        focusY2: champBox.bottom,
        msgX: (champBox.right + champBox.left) * 0.5,
        msgY: champBox.bottom + 0.0 * (champBox.top - champBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutEditableCs1.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: nameBox.left - 2,
        focusX2: nameBox.right,
        focusY1: nameBox.top - 2,
        focusY2: nameBox.bottom,
        msgX: (nameBox.right + nameBox.left) * 0.5,
        msgY: nameBox.bottom + 0.0 * (nameBox.top - nameBox.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutEditableCs2.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: swapRect.left - 2 - 10,
        focusX2: swapRect.right,
        focusY1: swapRect.top - 2,
        focusY2: swapRect.bottom,
        msgX: swapRect.right + 160,
        msgY: swapRect.bottom + 1.0 * (swapRect.top - swapRect.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutEditableCs3.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: footerRect.left - 2,
        focusX2: footerRect.right,
        focusY1: footerRect.top - 2,
        focusY2: footerRect.bottom,
        msgX: (footerRect.right + footerRect.left) * 0.5,
        msgY: footerRect.bottom + 0.0 * (footerRect.top - footerRect.bottom),
        msgMaxWidth: 300,
        text: TranslatedText.tutEditableCs4.english,
        onStart: () => {},
        onEnd: () => {},
      },
      {
        focusX1: Tutorial.WINDOW_WIDTH / 2,
        focusX2: Tutorial.WINDOW_WIDTH / 2,
        focusY1: Tutorial.WINDOW_HEIGHT / 2,
        focusY2: Tutorial.WINDOW_HEIGHT / 2,
        msgX: Tutorial.WINDOW_WIDTH / 2,
        msgY: Tutorial.WINDOW_HEIGHT * 0.2,
        msgMaxWidth: 400,
        text: TranslatedText.tutEditableCs5.english,
        onStart: () => {},
        onEnd: () => {},
      },
    ]);
  }

  private static currentTutorialSteps: TutorialStep[] = [];
  private static currentTutorialIndex = -1;
  private static currentTutorialName = '';
  private static pendingTutorials = [];
  private static async runTutorial(name: string, steps: TutorialStep[]) {
    if (LocalStorage.getShownTutorial(name)) return;
    if (Tutorial.currentTutorialName == name || Tutorial.pendingTutorials.filter((x) => x[0] == name).length > 0) return;

    if (Tutorial.currentTutorialIndex != -1) {
      Tutorial.pendingTutorials.push([name, steps]);
      return;
    }
    for (let s of steps) {
      if (s.focusX1 == 0 && s.focusX2 == 0 && s.focusY1 == 0 && s.focusY2 == 0) {
        ErrorReporting.report('runTutorial', { name, steps });
        return;
      }
    }
    Tutorial.currentTutorialName = name;
    Tutorial.currentTutorialSteps = steps;
    Tutorial.currentTutorialIndex = 0;
    Tutorial.updateView();
  }

  private static goNext() {
    Tutorial.currentTutorialSteps[Tutorial.currentTutorialIndex].onEnd();
    Tutorial.currentTutorialIndex++;
    Tutorial.updateView();
  }

  private static goLast() {
    Tutorial.currentTutorialSteps[Tutorial.currentTutorialIndex].onEnd();
    Tutorial.currentTutorialIndex = Tutorial.currentTutorialSteps.length - 1;
    Tutorial.updateView();
  }

  private static goPrevious() {
    Tutorial.currentTutorialSteps[Tutorial.currentTutorialIndex].onEnd();
    Tutorial.currentTutorialIndex--;
    Tutorial.updateView();
  }

  private static goFirst() {
    Tutorial.currentTutorialSteps[Tutorial.currentTutorialIndex].onEnd();
    Tutorial.currentTutorialIndex = 0;
    Tutorial.updateView();
  }

  private static goEnd() {
    Tutorial.currentTutorialSteps[Tutorial.currentTutorialIndex].onEnd();
    LocalStorage.setShownTutorial(Tutorial.currentTutorialName);
    Tutorial.currentTutorialIndex = -1;
    Tutorial.currentTutorialName = '';
    Tutorial.updateView();
  }

  public static advance() {
    if (0 <= Tutorial.currentTutorialIndex && Tutorial.currentTutorialIndex < Tutorial.currentTutorialSteps.length - 1) {
      this.goNext();
    } else if (Tutorial.currentTutorialIndex == Tutorial.currentTutorialSteps.length - 1) {
      this.goEnd();
    }
  }

  private static updateView() {
    if (Popup.popupShowing()) {
      $('.tutorial-bg-0').hide();
      $('.tutorial-bg-1').hide();
      $('.tutorial-bg-2').hide();
      $('.tutorial-bg-3').hide();
      $('.tutorial-bg-4').hide();
      $('.tutorial-text-box').hide();
      Popup.onPopupClose(Tutorial.updateView);
      return;
    }
    if (Tutorial.currentTutorialIndex == -1 || Tutorial.currentTutorialIndex >= Tutorial.currentTutorialSteps.length) {
      Tutorial.currentTutorialIndex = -1;
      Tutorial.currentTutorialSteps = [];

      if (Tutorial.pendingTutorials.length == 0) {
        $('.tutorial-bg-0').hide();
        $('.tutorial-bg-1').hide();
        $('.tutorial-bg-2').hide();
        $('.tutorial-bg-3').hide();
        $('.tutorial-bg-4').hide();
        $('.tutorial-text-box').hide();

        return;
      }
      const next = Tutorial.pendingTutorials.splice(0, 1)[0];
      Tutorial.currentTutorialName = next[0];
      Tutorial.currentTutorialSteps = next[1];
      Tutorial.currentTutorialIndex = 0;
    }

    $('.tutorial-bg-0').show();
    $('.tutorial-bg-1').show();
    $('.tutorial-bg-2').show();
    $('.tutorial-bg-3').show();
    $('.tutorial-bg-4').show();
    $('.tutorial-text-box').show();

    const step = Tutorial.currentTutorialSteps[Tutorial.currentTutorialIndex];
    step.onStart();
    Tutorial.setBackgroundBox(step.focusX1, step.focusX2, step.focusY1, step.focusY2);
    Tutorial.setInfoBox(step.text, Tutorial.currentTutorialIndex == 0, Tutorial.currentTutorialIndex == Tutorial.currentTutorialSteps.length - 1, step.msgX, step.msgY, step.msgMaxWidth);
  }

  private static setBackgroundBox(x1: number, x2: number, y1: number, y2: number) {
    x1 = Math.max(0, Math.min(Tutorial.WINDOW_WIDTH, x1));
    y1 = Math.max(0, Math.min(Tutorial.WINDOW_HEIGHT, y1));
    x2 = Math.max(0, Math.min(Tutorial.WINDOW_WIDTH, x2));
    y2 = Math.max(0, Math.min(Tutorial.WINDOW_HEIGHT, y2));

    $('.tutorial-bg-1').animate({ bottom: Tutorial.WINDOW_HEIGHT - y1, left: x1 }, 500);
    $('.tutorial-bg-2').animate({ top: y1, left: x2 }, 500);
    $('.tutorial-bg-3').animate({ top: y2, right: Tutorial.WINDOW_WIDTH - x2 }, 500);
    $('.tutorial-bg-4').animate({ bottom: Tutorial.WINDOW_HEIGHT - y2, right: Tutorial.WINDOW_WIDTH - x1 }, 500);
  }

  private static setInfoBox(text: string, first: boolean, last: boolean, x: number, y: number, maxW: number) {
    x = Math.max(0, Math.min(Tutorial.WINDOW_WIDTH - 200, x));
    y = Math.max(0, Math.min(Tutorial.WINDOW_HEIGHT - 100, y));

    if (last) {
      $('.tutorial-text-buttons-forwardToEnd').hide();
      $('.tutorial-text-buttons-forwardOne').hide();
      $('.tutorial-text-buttons-end').show();
    } else {
      $('.tutorial-text-buttons-forwardToEnd').show();
      $('.tutorial-text-buttons-forwardOne').show();
      $('.tutorial-text-buttons-end').hide();
    }

    if (first) {
      $('.tutorial-text-buttons-backToStart').hide();
      $('.tutorial-text-buttons-backOne').hide();
    } else {
      $('.tutorial-text-buttons-backToStart').show();
      $('.tutorial-text-buttons-backOne').show();
    }

    if (first) {
      $('.tutorial-text-msg').css('max-width', maxW + 'px');
      $('.tutorial-text-msg').html(text);
      const w = $('.tutorial-text-box').outerWidth();
      const h = $('.tutorial-text-box').outerHeight();

      x = Math.max(0, Math.min(Tutorial.WINDOW_WIDTH - w / 2, x));
      y = Math.max(0, Math.min(Tutorial.WINDOW_HEIGHT - h, y));

      $('.tutorial-text-box').animate({ top: y, left: x - w / 2 }, 1, () => {
        $('.tutorial-text-msg').hide();
        $('.tutorial-text-msg').slideDown(200);
      });
    } else {
      const prevText = $('.tutorial-text-msg').html();
      const prevMaxW = $('.tutorial-text-msg').css('max-width');
      const prevTop = $('.tutorial-text-box').css('top');
      const prevLeft = $('.tutorial-text-box').css('left');

      $('.tutorial-text-msg').css('max-width', maxW + 'px');
      $('.tutorial-text-msg').html(text);
      $('.tutorial-text-box').css('top', 0);
      $('.tutorial-text-box').css('left', 0);
      const w = $('.tutorial-text-box').outerWidth();
      const h = $('.tutorial-text-box').outerHeight();

      x = Math.max(0, Math.min(Tutorial.WINDOW_WIDTH - w / 2, x));
      y = Math.max(0, Math.min(Tutorial.WINDOW_HEIGHT - h, y));

      $('.tutorial-text-msg').html(prevText);
      $('.tutorial-text-msg').css('max-width', prevMaxW);
      $('.tutorial-text-box').css('top', prevTop);
      $('.tutorial-text-box').css('left', prevLeft);

      $('.tutorial-text-msg').slideUp(150, () => {
        $('.tutorial-text-box').animate({ top: y, left: x - w / 2 }, 300, () => {
          $('.tutorial-text-msg').css('max-width', maxW + 'px');
          $('.tutorial-text-msg').html(text);
          $('.tutorial-text-msg').slideDown(150);
        });
      });
    }
  }
}
