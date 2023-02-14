import * as $ from "jquery"; //npm install --save-dev @types/jquery
import { TranslatedText } from "./textLanguage";
import { Tutorial } from "./tutorial";


export class Popup {

  public static popupShowing() {
    return $('.popup-bg:visible').length > 0;
  }

  private static onClose: any = null;
  public static onPopupClose(func: any) {
    const newFunc = func;
    if (Popup.onClose != null) {
      const oldFunc = Popup.onClose;
      Popup.onClose = () => {
        oldFunc();
        newFunc();
      }
    } else {
      Popup.onClose = newFunc;
    }
  }

  public static close() {
    $('.popup-bg').hide();
    $('.popup-content').hide();
    Popup.onYes = null;
    Popup.onNo = null;
    Popup.onLanguage = null;
    if (Popup.onClose != null) {
      const func = Popup.onClose;
      Popup.onClose = null;
      func();
    }
    Tutorial.runWelcome(); //Because the first thing that happens is a language choice, in case they close the window
  }

  public static show() {
    $('.popup-bg').show();
    $('.popup-content').show();
  }

  public static message(title: string, content: string) {
    $('.popup-title-text').html(title);
    $('.popup-content-text').html(content);
    
    $('.popup-content-text').show();
    $('.popup-input-text').hide();
    $('.popup-buttons').hide();
    $('.popup-flags').hide();
    Popup.show();
    Popup.adjustPosition();
  }

  private static adjustPosition() {
    const pc = $('.popup-content');
    const w = pc.width();
    const h = pc.height();
    pc.css('left', 'calc(50% - ' + Math.floor(w/2) + 'px)');
    pc.css('top', 'calc(50% - ' + Math.floor(h/2) + 'px)');
  }

  private static onYes: any = null;
  private static onNo: any = null;
  public static prompt(title: string, content: string, onYes: any, onNo: any) {
    Popup.onYes = onYes;
    Popup.onNo = onNo;
    $('.popup-title-text').html(title);
    $('.popup-content-text').html(content);

    $('.popup-content-text').show();
    $('.popup-input-text').hide();
    $('.popup-buttons').show();
    $('.popup-flags').hide();
    Popup.show();
    Popup.adjustPosition();
    $('.popup-input-text-input').trigger('focus');
  }

  public static yes() {
    if (!Popup.onYes) return;
    const toRun = Popup.onYes;
    Popup.close();
    toRun();
  }

  public static no() {
    if (!Popup.onNo) return;
    const toRun = Popup.onNo;
    Popup.close();
    toRun();
  }

  private static autocompleteOptions: string[] = [];
  private static currText: string = '';
  private static prevTyped: string = '';
  public static text(title: string, content: string, currentText: string, options: string[], onText: any) {
    Popup.autocompleteOptions = options;
    Popup.currText = currentText;
    Popup.prevTyped = currentText;
    Popup.onYes = () => onText(Popup.currText);
    Popup.onNo = () => null;
    const elmn = <any>$('.popup-input-text-input').get(0);
    elmn.value = currentText;

    $('.popup-title-text').html(title);
    $('.popup-content-text').html(content);

    $('.popup-content-text').show();
    $('.popup-input-text').show();
    $('.popup-buttons').show();
    $('.popup-flags').hide();
    Popup.show();
    Popup.adjustPosition();
    $(elmn).trigger('focus');
    if (elmn.value.length > 0) {
      elmn.setSelectionRange(0, elmn.value.length);
    }
  }

  public static textChange() {
    const elmn = <any>$('.popup-input-text-input').get(0);
    const typed = elmn.value;
    
    if (typed.length <= Popup.prevTyped.length) {
      Popup.prevTyped = typed;
      Popup.currText = typed;
      return;
    }

    const posI = elmn.selectionStart;
    const options = Popup.autocompleteOptions.filter(x => x.toLowerCase().startsWith(typed.toLowerCase()));
    if (options.length > 0) {
      elmn.value = options[0];
      elmn.setSelectionRange(posI, elmn.value.length);
    }

    Popup.prevTyped = typed;
    Popup.currText = elmn.value;
  }

  // https://www.flaticon.com/packs/countrys-flags
  private static onLanguage: any = null;
  public static selectLanguage(onLanguage: any) {
    Popup.onLanguage = onLanguage;
    $('.popup-title-text').html(TranslatedText.language.english);
    $('.popup-content-text').html(TranslatedText.languageText.english);

    $('.popup-content-text').show();
    $('.popup-input-text').hide();
    $('.popup-buttons').hide();
    $('.popup-flags').show();
    Popup.show();
    Popup.adjustPosition();
  }

  public static flagClick(e: any) {
    const language = $(e.currentTarget).attr('class').split(/\s+/).filter(c => c.startsWith('popup-flag-'))[0].split('-')[2];
    const toRun = Popup.onLanguage;
    Popup.close();
    toRun(language);
    Tutorial.runWelcome(); //Because the first thing that happens is a language choice
  }


}