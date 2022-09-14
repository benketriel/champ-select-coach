import { LocalStorage } from "./localStorage";
import { Timer } from "./timer";
import * as $ from "jquery"; //npm install --save-dev @types/jquery


export class Popup {

  public static close() {
    $('.popup-bg').hide();
    $('.popup-content').hide();
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

  private static onYes: any;
  private static onNo: any;
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
    Popup.close();
    Popup.onYes();
  }

  public static no() {
    Popup.close();
    Popup.onNo();
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
  private static onLanguage: any = () => null;
  public static selectLanguage(onLanguage: any) {
    Popup.onLanguage = onLanguage;
    $('.popup-title-text').html('Language');
    $('.popup-content-text').html('Select your preferred language');

    $('.popup-content-text').show();
    $('.popup-input-text').hide();
    $('.popup-buttons').hide();
    $('.popup-flags').show();
    Popup.show();
    Popup.adjustPosition();
  }

  public static flagClick(e: any) {
    const language = $(e.currentTarget).attr('class').split(/\s+/).filter(c => c.startsWith('popup-flag-'))[0].split('-')[2];
    Popup.close();
    Popup.onLanguage(language);
  }


}