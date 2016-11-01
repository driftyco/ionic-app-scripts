import { build, fullBuildUpdate } from './build';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, IgnorableError, Logger } from './util/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars, setIonicEnvironment } from './util/config';
import { join, normalize } from 'path';
import * as chalk from 'chalk';
import * as chokidar from 'chokidar';


// https://github.com/paulmillr/chokidar

export function watch(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  // force watch options
  context.isProd = false;
  context.isWatch = true;
  context.fullBuildCompleted = false;

  const logger = new Logger('watch');

  function buildDone() {
    return startWatchers(context, configFile).then(() => {
      logger.ready(chalk.green);
    });
  }

  return build(context)
    .then(buildDone, buildDone)
    .catch(err => {
      throw logger.fail(err);
    });
}


function startWatchers(context: BuildContext, configFile: string) {
  const watchConfig: WatchConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);

  const promises = watchConfig
    .watchers
    .map((w, i) => startWatcher(i, w, context, watchConfig));

  return Promise.all(promises);
}


function startWatcher(index: number, watcher: Watcher, context: BuildContext, watchConfig: WatchConfig) {
  return new Promise((resolve, reject) => {

    prepareWatcher(context, watcher);

    if (!watcher.paths) {
      Logger.error(`watcher config, index ${index}: missing "paths"`);
      resolve();
      return;
    }

    if (!watcher.callback) {
      Logger.error(`watcher config, index ${index}: missing "callback"`);
      resolve();
      return;
    }

    const chokidarWatcher = chokidar.watch(<any>watcher.paths, watcher.options);

    let eventName = 'all';
    if (watcher.eventName) {
      eventName = watcher.eventName;
    }

    chokidarWatcher.on(eventName, (event: string, filePath: string) => {
      // if you're listening for a specific event vs 'all',
      // the event is not included and the first param is the filePath
      // go ahead and adjust it if filePath is null so it's uniform
      if (!filePath) {
        filePath = event;
        event = watcher.eventName;
      }

      setIonicEnvironment(context.isProd);

      filePath = join(context.rootDir, filePath);

      context.isUpdate = true;
      context.fileChanged = filePath;

      Logger.debug(`watch callback start, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);

      function taskDone() {
        // TODO - why is this the way it is?
        console.log('');
        Logger.info(chalk.green.bold('watch ready'));
        console.log('');
      }

      const callbackToExecute = function(event: string, filePath: string, context: BuildContext, watcher: Watcher) {
        if (!context.fullBuildCompleted) {
          return fullBuildUpdate(event, filePath, context);
        }
        return watcher.callback(event, filePath, context);
      };

      callbackToExecute(event, filePath, context, watcher)
        .then(() => {
          Logger.debug(`watch callback complete, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
          watchCount++;
          taskDone();
        })
        .catch(err => {
          Logger.debug(`watch callback error, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
          Logger.debug(`${err}`);
          watchCount++;
          if (!(err instanceof IgnorableError)) {
            taskDone();
          }
        });
    });

    chokidarWatcher.on('ready', () => {
      Logger.debug(`watcher ready: ${watcher.options.cwd}${watcher.paths}`);
      resolve();
    });

    chokidarWatcher.on('error', (err: any) => {
      reject(new BuildError(`watcher error: ${watcher.options.cwd}${watcher.paths}: ${err}`));
    });
  });
}


export function prepareWatcher(context: BuildContext, watcher: Watcher) {
  watcher.options = watcher.options || {};

  if (!watcher.options.cwd) {
    watcher.options.cwd = context.rootDir;
  }

  if (typeof watcher.options.ignoreInitial !== 'boolean') {
    watcher.options.ignoreInitial = true;
  }

  if (typeof watcher.options.ignored === 'string') {
    watcher.options.ignored = normalize(replacePathVars(context, watcher.options.ignored));
  }

  if (typeof watcher.paths === 'string') {
    watcher.paths = normalize(replacePathVars(context, watcher.paths));

  } else if (Array.isArray(watcher.paths)) {
    watcher.paths = watcher.paths.map(p => normalize(replacePathVars(context, p)));
  }
}


const taskInfo: TaskInfo = {
  fullArgConfig: '--watch',
  shortArgConfig: '-w',
  envConfig: 'ionic_watch',
  defaultConfigFile: 'watch.config'
};


export interface WatchConfig {
  watchers: Watcher[];
}


export interface Watcher {
  // https://www.npmjs.com/package/chokidar
  paths?: string[]|string;
  options?: {
    ignored?: string|Function;
    ignoreInitial?: boolean;
    followSymlinks?: boolean;
    cwd?: string;
  };
  eventName?: string;
  callback?: {
    (event: string, filePath: string, context: BuildContext): Promise<any>;
  };
}

let watchCount = 0;
