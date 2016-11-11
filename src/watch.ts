import * as buildTask from './build';
import { BuildContext, BuildState, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { canRunTranspileUpdate } from './transpile';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars, setIonicEnvironment } from './util/config';
import { join, normalize, extname } from 'path';
import { Logger } from './logger/logger';
import * as chokidar from 'chokidar';


// https://github.com/paulmillr/chokidar

export function watch(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  // force watch options
  context.isProd = false;
  context.isWatch = true;

  context.sassState = BuildState.RequiresBuild;
  context.transpileState = BuildState.RequiresBuild;
  context.bundleState = BuildState.RequiresBuild;

  const logger = new Logger('watch');

  function buildDone() {
    return startWatchers(context, configFile).then(() => {
      logger.ready();
    });
  }

  return buildTask.build(context)
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

      Logger.debug(`watch callback start, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);

      const callbackToExecute = function(event: string, filePath: string, context: BuildContext, watcher: Watcher) {
        return watcher.callback(event, filePath, context);
      };

      callbackToExecute(event, filePath, context, watcher)
        .then(() => {
          Logger.debug(`watch callback complete, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
          watchCount++;
        })
        .catch(err => {
          Logger.debug(`watch callback error, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
          Logger.debug(`${err}`);
          watchCount++;
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


let queuedChangedFiles: ChangedFile[] = [];
let queuedChangeFileTimerId: any;
export interface ChangedFile {
  event: string;
  filePath: string;
  ext: string;
}

export function buildUpdate(event: string, filePath: string, context: BuildContext) {
  const changedFile: ChangedFile = {
    event: event,
    filePath: filePath,
    ext: extname(filePath).toLowerCase()
  };

  // do not allow duplicates
  if (!queuedChangedFiles.some(f => f.filePath === filePath)) {
    queuedChangedFiles.push(changedFile);

    // debounce our build update incase there are multiple files
    clearTimeout(queuedChangeFileTimerId);

    // run this code in a few milliseconds if another hasn't come in behind it
    queuedChangeFileTimerId = setTimeout(() => {
      // figure out what actually needs to be rebuilt
      const buildData = runBuildUpdate(context, queuedChangedFiles);

      // clear out all the files that are queued up for the build update
      queuedChangedFiles.length = 0;

      if (buildData) {
        // cool, we've got some build updating to do ;)
        buildTask.buildUpdate(buildData.event, buildData.filePath, context);
      }
    }, BUILD_UPDATE_DEBOUNCE_MS);
  }

  return Promise.resolve();
}


export function runBuildUpdate(context: BuildContext, changedFiles: ChangedFile[]) {
  if (!changedFiles || !changedFiles.length) {
    return null;
  }

  // create the data which will be returned
  const data = {
    event: changedFiles.map(f => f.event).find(ev => ev !== 'change') || 'change',
    filePath: changedFiles[0].filePath,
    changedFiles: changedFiles.map(f => f.filePath)
  };

  const tsFiles = changedFiles.filter(f => f.ext === '.ts');
  if (tsFiles.length > 1) {
    // multiple .ts file changes
    // if there is more than one ts file changing then
    // let's just do a full transpile build
    context.transpileState = BuildState.RequiresBuild;

  } else if (tsFiles.length) {
    // only one .ts file changed
    if (canRunTranspileUpdate(tsFiles[0].event, tsFiles[0].filePath, context)) {
      // .ts file has only changed, it wasn't a file add/delete
      // we can do the quick typescript update on this changed file
      context.transpileState = BuildState.RequiresUpdate;

    } else {
      // .ts file was added or deleted, we need a full rebuild
      context.transpileState = BuildState.RequiresBuild;
    }
  }

  const sassFiles = changedFiles.filter(f => f.ext === '.scss');
  if (sassFiles.length) {
    // .scss file was changed/added/deleted, lets do a sass update
    context.sassState = BuildState.RequiresUpdate;
  }

  const sassFilesNotChanges = changedFiles.filter(f => f.ext === '.ts' && f.event !== 'change');
  if (sassFilesNotChanges.length) {
    // .ts file was either added or deleted, so we'll have to
    // run sass again to add/remove that .ts file's potential .scss file
    context.sassState = BuildState.RequiresUpdate;
  }

  const htmlFiles = changedFiles.filter(f => f.ext === '.html');
  if (htmlFiles.length) {
    if (context.bundleState === BuildState.SuccessfulBuild && htmlFiles.every(f => f.event === 'change')) {
      // .html file was changed
      // just doing a template update is fine
      context.templateState = BuildState.RequiresUpdate;

    } else {
      // .html file was added/deleted
      // we should do a full transpile build because of this
      context.transpileState = BuildState.RequiresBuild;
    }
  }

  if (context.transpileState === BuildState.RequiresUpdate || context.transpileState === BuildState.RequiresBuild) {
    if (context.bundleState === BuildState.SuccessfulBuild || context.bundleState === BuildState.RequiresUpdate) {
      // transpiling needs to happen
      // and there has already been a successful bundle before
      // so let's just do a bundle update
      context.bundleState = BuildState.RequiresUpdate;
    } else {
      // transpiling needs to happen
      // but we've never successfully bundled before
      // so let's do a full bundle build
      context.bundleState = BuildState.RequiresBuild;
    }
  }

  // guess which file is probably the most important here
  data.filePath = tsFiles.concat(sassFiles, htmlFiles)[0].filePath;

  return data;
}


const taskInfo: TaskInfo = {
  fullArg: '--watch',
  shortArg: null,
  envVar: 'IONIC_WATCH',
  packageConfig: 'ionic_watch',
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

const BUILD_UPDATE_DEBOUNCE_MS = 20;
