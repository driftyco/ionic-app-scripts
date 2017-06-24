import { extname, join, normalize, resolve as pathResolve } from 'path';

import * as chokidar from 'chokidar';

import * as buildTask from './build';
import { copyUpdate as copyUpdateHandler} from './copy';
import { Logger } from './logger/logger';
import { canRunTranspileUpdate } from './transpile';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getIntPropertyValue } from './util/helpers';
import { BuildContext, BuildState, ChangedFile, TaskInfo } from './util/interfaces';


// https://github.com/paulmillr/chokidar

export function watch(context?: BuildContext, configFile?: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  // Override all build options if watch is ran.
  context.isProd = false;
  context.optimizeJs = false;
  context.runMinifyJs = false;
  context.runMinifyCss = false;
  context.runAot = false;

  // Ensure that watch is true in context
  context.isWatch = true;

  context.sassState = BuildState.RequiresBuild;
  context.transpileState = BuildState.RequiresBuild;
  context.bundleState = BuildState.RequiresBuild;
  context.deepLinkState = BuildState.RequiresBuild;

  const logger = new Logger('watch');

  function buildDone() {
    return startWatchers(context, configFile).then(() => {
      logger.ready();
    });
  }

  return buildTask.build(context)
    .then(buildDone, (err: BuildError) => {
      if (err && err.isFatal) {
        throw err;
      } else {
        buildDone();
      }
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


function startWatchers(context: BuildContext, configFile: string) {
  const watchConfig: WatchConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);

  const promises: Promise<any>[] = [];
  Object.keys(watchConfig).forEach((key) => {
    promises.push(startWatcher(key, watchConfig[key], context));
  });

  return Promise.all(promises);
}


function startWatcher(name: string, watcher: Watcher, context: BuildContext) {
  return new Promise((resolve, reject) => {

    // If a file isn't found (probably other scenarios too),
    // Chokidar watches don't always trigger the ready or error events
    // so set a timeout, and clear it if they do fire
    // otherwise, just reject the promise and log an error
    const timeoutId = setTimeout(() => {
      let filesWatchedString: string = null;
      if (typeof watcher.paths === 'string') {
        filesWatchedString = watcher.paths;
      } else if (Array.isArray(watcher.paths)) {
        filesWatchedString = watcher.paths.join(', ');
      }
      reject(new BuildError(`A watch configured to watch the following paths failed to start. It likely that a file referenced does not exist: ${filesWatchedString}`));
    }, getIntPropertyValue(Constants.ENV_START_WATCH_TIMEOUT));

    prepareWatcher(context, watcher);

    if (!watcher.paths) {
      Logger.error(`watcher config, entry ${name}: missing "paths"`);
      resolve();
      return;
    }

    if (!watcher.callback) {
      Logger.error(`watcher config, entry ${name}: missing "callback"`);
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

      filePath = normalize(pathResolve(join(context.rootDir, filePath)));

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
      clearTimeout(timeoutId);
      Logger.debug(`watcher ready: ${watcher.options.cwd}${watcher.paths}`);
      resolve();
    });

    chokidarWatcher.on('error', (err: any) => {
      clearTimeout(timeoutId);
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

  if (watcher.options.ignored) {
    if (Array.isArray(watcher.options.ignored)) {
      watcher.options.ignored = watcher.options.ignored.map(p => normalize(replacePathVars(context, p)));
    } else if (typeof watcher.options.ignored === 'string') {
      // it's a string, so just do it once and leave it
      watcher.options.ignored = normalize(replacePathVars(context, watcher.options.ignored));
    }
  }

  if (watcher.paths) {
    if (Array.isArray(watcher.paths)) {
      watcher.paths = watcher.paths.map(p => normalize(replacePathVars(context, p)));
    } else {
      watcher.paths = normalize(replacePathVars(context, watcher.paths));
    }
  }
}


let queuedWatchEventsMap = new Map<string, ChangedFile>();
let queuedWatchEventsTimerId: any;

export function buildUpdate(event: string, filePath: string, context: BuildContext) {
  return queueWatchUpdatesForBuild(event, filePath, context);
}

export function queueWatchUpdatesForBuild(event: string, filePath: string, context: BuildContext) {
  const changedFile: ChangedFile = {
    event: event,
    filePath: filePath,
    ext: extname(filePath).toLowerCase()
  };

  queuedWatchEventsMap.set(filePath, changedFile);

  // debounce our build update incase there are multiple files
  clearTimeout(queuedWatchEventsTimerId);

  // run this code in a few milliseconds if another hasn't come in behind it
  queuedWatchEventsTimerId = setTimeout(() => {

    // figure out what actually needs to be rebuilt
    const queuedChangeFileList: ChangedFile[] = [];
    queuedWatchEventsMap.forEach(changedFile => queuedChangeFileList.push(changedFile));

    const changedFiles = runBuildUpdate(context, queuedChangeFileList);

    // clear out all the files that are queued up for the build update
    queuedWatchEventsMap.clear();

    if (changedFiles && changedFiles.length) {
      // cool, we've got some build updating to do ;)
      queueOrRunBuildUpdate(changedFiles, context);
    }
  }, BUILD_UPDATE_DEBOUNCE_MS);

  return Promise.resolve();
}

// exported just for use in unit testing
export let buildUpdatePromise: Promise<any> = null;
export let queuedChangedFileMap = new Map<string, ChangedFile>();
export function queueOrRunBuildUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  if (buildUpdatePromise) {
    // there is an active build going on, so queue our changes and run
    // another build when this one finishes

    // in the event this is called multiple times while queued, we are following a "last event wins" pattern
    // so if someone makes an edit, and then deletes a file, the last "ChangedFile" is the one we act upon
    changedFiles.forEach(changedFile => {
      queuedChangedFileMap.set(changedFile.filePath, changedFile);
    });
    return buildUpdatePromise;
  } else {
    // there is not an active build going going on
    // clear out any queued file changes, and run the build
    queuedChangedFileMap.clear();

    const buildUpdateCompleteCallback: () => Promise<any> = () => {
      // the update is complete, so check if there are pending updates that need to be run
      buildUpdatePromise = null;
      if (queuedChangedFileMap.size > 0) {
        const queuedChangeFileList: ChangedFile[] = [];
        queuedChangedFileMap.forEach(changedFile => {
          queuedChangeFileList.push(changedFile);
        });
        return queueOrRunBuildUpdate(queuedChangeFileList, context);
      }
      return Promise.resolve();
    };

    buildUpdatePromise = buildTask.buildUpdate(changedFiles, context);
    return buildUpdatePromise.then(buildUpdateCompleteCallback).catch((err: Error) => {
      return buildUpdateCompleteCallback();
    });
  }
}






let queuedCopyChanges: ChangedFile[] = [];
let queuedCopyTimerId: any;

export function copyUpdate(event: string, filePath: string, context: BuildContext) {
  const changedFile: ChangedFile = {
    event: event,
    filePath: filePath,
    ext: extname(filePath).toLowerCase()
  };
  // do not allow duplicates
  if (!queuedCopyChanges.some(f => f.filePath === filePath)) {
    queuedCopyChanges.push(changedFile);

    // debounce our build update incase there are multiple files
    clearTimeout(queuedCopyTimerId);

    // run this code in a few milliseconds if another hasn't come in behind it
    queuedCopyTimerId = setTimeout(() => {

      const changedFiles = queuedCopyChanges.concat([]);
      // clear out all the files that are queued up for the build update
      queuedCopyChanges.length = 0;

      if (changedFiles && changedFiles.length) {
        // cool, we've got some build updating to do ;)
        copyUpdateHandler(changedFiles, context);
      }
    }, BUILD_UPDATE_DEBOUNCE_MS);
  }

  return Promise.resolve();
}


export function runBuildUpdate(context: BuildContext, changedFiles: ChangedFile[]) {
  if (!changedFiles || !changedFiles.length) {
    return null;
  }

  const jsFiles = changedFiles.filter(f => f.ext === '.js');
  if (jsFiles.length) {
    // this is mainly for linked modules
    // if a linked library has changed (which would have a js extention)
    // we should do a full transpile build because of this
    context.bundleState = BuildState.RequiresUpdate;
  }

  const tsFiles = changedFiles.filter(f => f.ext === '.ts');
  if (tsFiles.length) {
    let requiresFullBuild = false;
    for (const tsFile of tsFiles) {
      if (!canRunTranspileUpdate(tsFile.event, tsFiles[0].filePath, context)) {
        requiresFullBuild = true;
        break;
      }
    }

    if (requiresFullBuild) {
      // .ts file was added or deleted, we need a full rebuild
      context.transpileState = BuildState.RequiresBuild;
      context.deepLinkState = BuildState.RequiresBuild;
    } else {
      // .ts files have changed, so we can get away with doing an update
      context.transpileState = BuildState.RequiresUpdate;
      context.deepLinkState = BuildState.RequiresUpdate;
    }
  }


  const sassFiles = changedFiles.filter(f => /^\.s(c|a)ss$/.test(f.ext));
  if (sassFiles.length) {
    // .scss or .sass file was changed/added/deleted, lets do a sass update
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
      context.deepLinkState = BuildState.RequiresBuild;
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
  return changedFiles.concat();
}


const taskInfo: TaskInfo = {
  fullArg: '--watch',
  shortArg: null,
  envVar: 'IONIC_WATCH',
  packageConfig: 'ionic_watch',
  defaultConfigFile: 'watch.config'
};


export interface WatchConfig {
  [index: string]: Watcher;
}

export interface Watcher {
  // https://www.npmjs.com/package/chokidar
  paths?: string[]|string;
  options?: {
    ignored?: string|string[]|Function;
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
