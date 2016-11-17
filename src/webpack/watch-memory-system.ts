import { FileCache } from '../util/file-cache';
import { on, EventType } from '../util/events';
import { Logger } from '../logger/logger';

export class WatchMemorySystem {

  private changes: Set<string>;
  private isAggregating: boolean;
  private isListening: boolean;
  private lastWatchEventTimestamp: number = Date.now();

  private filePathsBeingWatched: string[];
  private dirPaths: string[];
  private missing: string[];
  private startTime: number;
  private options: any;
  private immediateCallback: (filePath: string, timestamp: number) => void;
  private aggregatedCallback: (err: Error, changesFilePaths: string[], dirPaths: string[], missingPaths: string[], timesOne: any, timesTwo: any) => void;

  constructor(private fileCache: FileCache) {
  }

  close() {
    this.isListening = false;
  }

  pause() {
    this.isListening = false;
  }

  watch(filePathsBeingWatched: string[], dirPaths: string[], missing: string[], startTime: number, options: any, aggregatedCallback: (err: Error, changesFilePaths: string[]) => void, immediateCallback: (filePath: string, timestamp: number) => void) {
    this.filePathsBeingWatched = filePathsBeingWatched;
    this.dirPaths = dirPaths;
    this.missing = missing;
    this.startTime = startTime;
    this.options = options;

    this.immediateCallback = immediateCallback;
    this.aggregatedCallback = aggregatedCallback;

    if (!this.isListening) {
      this.startListening();
    }

    return {
      pause: this.pause,
      close: this.close
    };
  }

  startListening() {
    this.isListening = true;
    on(EventType.WebpackFilesChanged, () => {
      this.changes = new Set<string>();
      const filePaths = this.fileCache.getAll().filter(file => file.timestamp >= this.lastWatchEventTimestamp).map(file => file.path);
      Logger.debug('filePaths: ', filePaths);
      this.lastWatchEventTimestamp = Date.now();
      this.processChanges(filePaths);
    });
  }

  processChanges(filePaths: string[]) {
    this.immediateCallback(filePaths[0], Date.now());
    for ( const path of filePaths) {
      this.changes.add(path);
    }
    // don't bother waiting around, just call doneAggregating right away.
    // keep it as a function in case we need to wait via setTimeout a bit in the future
    this.doneAggregating(this.changes);
  }

  doneAggregating(changes: Set<string>) {
    this.isAggregating = false;
    // process the changes
    const filePaths = Array.from(changes);
    const files = filePaths.filter(filePath => this.filePathsBeingWatched.indexOf(filePath) >= 0).sort();
    const dirs = filePaths.filter(filePath => this.dirPaths.indexOf(filePath) >= 0).sort();
    const missing = filePaths.filter(filePath => this.missing.indexOf(filePath) >= 0).sort();
    const times = this.getTimes(this.filePathsBeingWatched, this.startTime, this.fileCache);
    this.aggregatedCallback(null, files, dirs, missing, times, times);
  }

  getTimes(allFiles: string[], startTime: number, fileCache: FileCache) {
    let times: any = { };
    for (const filePath of allFiles) {
      const file = fileCache.get(filePath);
      if (file) {
        times[filePath] = file.timestamp;
      } else {
        times[filePath] = startTime;
      }
    }
    return times;
  }
}
