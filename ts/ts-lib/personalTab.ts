import * as $ from "jquery"; //npm install --save-dev @types/jquery

export class PersonalTab {

  constructor() {
  }

  public canvasDraw() {

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
        
  }

  public hide() {
    $('.personal-tab').hide();
  }

  public show() {
    $('.personal-tab').show();
  }


}