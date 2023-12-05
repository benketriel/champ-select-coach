export class Logger {
  public static log(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    console.log(msg);
  }

  public static warn(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    console.warn(msg);
  }

  public static debug(msg) {
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    //console.log(msg);
  }
}
