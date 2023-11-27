import { LocalStorage } from './localStorage';
import { Timer } from './timer';
import * as $ from 'jquery'; //npm install --save-dev @types/jquery

export class ProgressBar {
  private static currentlyActive: ProgressBar;
  private static ALPHA = 0.9;
  private static TICK_MS = 30;
  private static MAX_SECONDS = 60 * 5;
  private currentlyShownValue = 0.0;
  private currentValue = 0.0;
  private remainingTaskNames = [];
  private remainingTaskParallelism = [];
  private remainingTaskSeconds = [];
  private remainingTotalSeconds = 0.0;
  private secondsOnTask = 0.0;
  private totalSeconds = 0.00001; //Prevent division by 0

  constructor(taskNames: string[], taskParallelism: number[]) {
    this.remainingTaskNames = taskNames;
    this.remainingTaskParallelism = taskParallelism;
    const stats = LocalStorage.getProgressBarStats();

    for (const i in taskNames) {
      const t = taskNames[i];
      const n = taskParallelism[i];
      const s = t in stats ? stats[t] : 1.0;
      this.remainingTaskSeconds.push(s * n);
      this.remainingTotalSeconds += s * n;
    }

    /* await */ this.tick();
  }

  private setValue() {
    //Actually edits the html element (this singleton class owns it)
    if (this == ProgressBar.currentlyActive) {
      $('.progress-bar-value').css('width', Math.round(1089 * this.currentlyShownValue) + 'px');
    }
  }

  public setActive() {
    ProgressBar.currentlyActive = this;
    this.setValue();
  }

  public isActive() {
    return ProgressBar.currentlyActive == this;
  }

  public taskCompleted() {
    const task = this.remainingTaskNames.shift();
    const parallelism = this.remainingTaskParallelism.shift();
    const taskEstimatedSeconds = this.remainingTaskSeconds.shift();
    this.sampleTaskCompletionTime(task, this.secondsOnTask, parallelism);
    this.remainingTotalSeconds -= taskEstimatedSeconds;
    if (this.remainingTaskNames.length == 0) this.remainingTotalSeconds = 0.0; //In case there are rounding errors

    this.secondsOnTask = 0.0;
  }

  public abort() {
    this.remainingTaskNames = [];
    this.remainingTaskParallelism = [];
    this.remainingTaskSeconds = [];
    this.remainingTotalSeconds = 0.0;
  }

  private async tick() {
    for (let remainingTicks = (ProgressBar.MAX_SECONDS * 1000.0) / ProgressBar.TICK_MS; remainingTicks > 0; remainingTicks--) {
      this.secondsOnTask += ProgressBar.TICK_MS / 1000.0;
      this.totalSeconds += ProgressBar.TICK_MS / 1000.0;
      let taskEstimatedSeconds = this.remainingTaskSeconds.length == 0 ? 0.0 : this.remainingTaskSeconds[0];
      this.currentValue = this.totalSeconds / (this.totalSeconds - this.secondsOnTask + Math.max(this.secondsOnTask, taskEstimatedSeconds) + this.remainingTotalSeconds - taskEstimatedSeconds);
      this.currentlyShownValue = this.currentlyShownValue * 0.5 + 0.5 * this.currentValue;
      this.setValue();
      await Timer.wait(ProgressBar.TICK_MS);
      if ((this.remainingTaskSeconds.length == 0 && this.currentlyShownValue >= 0.999) || (this != ProgressBar.currentlyActive && this.currentValue >= 0.999)) {
        this.currentlyShownValue = 0.0;
        this.setValue();
        break;
      }
    }
  }

  private sampleTaskCompletionTime(taskName: string, seconds: number, parallelism: number) {
    const stats = LocalStorage.getProgressBarStats();

    //This can be done better, it's not linear, can have another variable and find how seconds scale with parallelism, for example fit line mx+b instead of just mx like now
    if (!(taskName in stats)) {
      stats[taskName] = seconds / parallelism;
    } else {
      stats[taskName] = stats[taskName] * ProgressBar.ALPHA + ((1 - ProgressBar.ALPHA) * seconds) / parallelism;
    }

    LocalStorage.setProgressBarStats(stats);
  }
}
