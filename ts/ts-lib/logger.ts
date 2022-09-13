

export class Logger {

  public static async log(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    console.log(msg);
  }

  public static async warn(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    console.warn(msg);
  }

  public static async debug(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    console.log(msg); //TODO comment on prod
  }

}