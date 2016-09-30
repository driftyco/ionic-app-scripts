import { build } from './build';
import { BuildContext, BuildOptions, generateBuildOptions, generateContext, fillConfigDefaults, Logger, replacePathVars, TaskInfo } from './util';


export function watch(context?: BuildContext, options?: BuildOptions, watchConfig?: WatchConfig) {
  context = generateContext(context);
  options = generateBuildOptions(options);
  watchConfig = fillConfigDefaults(context, watchConfig, WATCH_TASK_INFO);

  // force watch options
  options.isProd = false;
  options.isWatch = true;

  const logger = new Logger('watch');

  build(context, options).then(() => {
    startWatchers(context, options, watchConfig);
    logger.ready();
  });
}


export function startWatchers(context: BuildContext, options: BuildOptions, watchConfig: WatchConfig) {
  // https://github.com/paulmillr/chokidar
  const chokidar = require('chokidar');

  watchConfig.watchers.forEach(watcher => {
    if (watcher.callback && watcher.paths) {
      let taskPromise = Promise.resolve();
      let nextTask: any = null;
      const watcherOptions = watcher.options || {};
      if (!watcherOptions.cwd) {
        watcherOptions.cwd = context.rootDir;
      }
      if (typeof watcherOptions.ignoreInitial !== 'boolean') {
        watcherOptions.ignoreInitial = true;
      }
      const paths = cleanPaths(context, watcher.paths);
      const chokidarWatcher = chokidar.watch(paths, watcherOptions);

      chokidarWatcher.on('all', (event: string, path: string) => {
        nextTask = watcher.callback.bind(null, event, path, context, options);
        taskPromise.then(function() {
          taskPromise = nextTask();
          nextTask = null;
        });
      });
    }
  });
}


function cleanPaths(context: BuildContext, paths: any): any {
  if (Array.isArray(paths)) {
    return paths.map(p => replacePathVars(context, p));
  }
  if (typeof paths === 'string') {
    return replacePathVars(context, paths);
  }
  return paths;
}


const WATCH_TASK_INFO: TaskInfo = {
  fullArgConfig: '--watch',
  shortArgConfig: '-w',
  envConfig: 'ionic_watch',
  defaultConfigFilename: 'watch.config'
};


export interface WatchConfig {
  watchers: Watcher[];
}


export interface Watcher {
  // https://www.npmjs.com/package/chokidar
  paths: string[];
  options: {
    ignored?: string;
    ignoreInitial?: boolean;
    followSymlinks?: boolean;
    cwd?: string;
  };
  callback: {
    (event: string, path: string, context: BuildContext, options: BuildOptions): void;
  };
}
