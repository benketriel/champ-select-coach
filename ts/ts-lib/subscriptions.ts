


export class Subscriptions {

  private static cscPlanID = 0;
  
  public static TODO: boolean = false;
  private static lastChecked: number = 0;
  public static async isSubscribed() {
    if (new Date().getTime() - Subscriptions.lastChecked > 1000 * 10) {
      const result = <boolean>await new Promise(resolve => {
        try {
          overwolf.profile.subscriptions.getActivePlans((info) => { 
            resolve(info.success && info.plans != null && info.plans.includes(Subscriptions.cscPlanID));
          });
        } catch {
          resolve(false);
        }
      });
  
      Subscriptions.TODO = result;
      Subscriptions.lastChecked = new Date().getTime(); //Just in case, prevent spam
    }

    return Subscriptions.TODO;
  }

}