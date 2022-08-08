

export class CsTab {

  public static MODE_IDLE: number = 0;
  public static MODE_LCU: number = 1;
  public static MODE_MANUAL: number = 2;
  public static MODE_STATIC: number = 3;

  constructor() {
    //has one instance of manual csManager and one instance of lcu csManager
    //if mode matches then handle their callbacks and set view
  }

  public setMode(mode: number) {
    //Different modes print differently (can change region? can swap champions?)
    //TODO
    //Query the relevant csManager for its info and set view
  }


  private resetView(csView: any) {
    //TODO
  }

  private updateView(csUpdate: any) {
    //TODO
  }

}