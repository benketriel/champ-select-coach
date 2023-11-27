import { TranslatedText } from './textLanguage';
import { Tutorial } from './tutorial';
import * as $ from 'jquery'; //npm install --save-dev @types/jquery

export class Subscriptions {
  private static cscPlanID = 116;

  public static subscriptionStatus: boolean = true;
  private static lastChecked: number = 0;
  public static isSubscribed() {
    /* await */ this.updateSubscriptionStatus();
    return Subscriptions.subscriptionStatus;
  }

  public static async updateSubscriptionStatus() {
    if (new Date().getTime() - Subscriptions.lastChecked > 1000 * 10) {
      const result = <boolean>await new Promise((resolve) => {
        try {
          overwolf.profile.subscriptions.getActivePlans((info) => {
            resolve(info.success && info.plans != null && info.plans.includes(Subscriptions.cscPlanID));
          });
        } catch {
          resolve(false);
        }
      });

      Subscriptions.subscriptionStatus = result;
      Subscriptions.lastChecked = new Date().getTime(); //Just in case, prevent spam

      if (Subscriptions.subscriptionStatus) {
        Tutorial.runProVersion();
        $('.settings-button-subscribe .settings-sub-title').html(TranslatedText.manageSubscription.english);
      } else {
        $('.settings-button-subscribe .settings-sub-title').html(TranslatedText.getProVersion.english);
      }
    }
  }

  public static async subscribe() {
    overwolf.utils.openStore(<any>{ page: overwolf.utils.enums.eStorePage.SubscriptionPage });
  }
}
