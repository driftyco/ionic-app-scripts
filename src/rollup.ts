import { join, isAbsolute, normalize, sep } from 'path';

import * as rollupBundler from 'rollup';

import { Logger } from './logger/logger';
import { ionicRollupResolverPlugin, PLUGIN_NAME } from './rollup/ionic-rollup-resolver-plugin';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import { BuildError } from './util/errors';
import { writeFileAsync } from './util/helpers';
import { BuildContext, BuildState, ChangedFile, TaskInfo } from './util/interfaces';


export function rollup(context: BuildContext, configFile: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('rollup');

  return rollupWorker(context, configFile)
    .then(() => {
      context.bundleState = BuildState.SuccessfulBuild;
      logger.finish();
    })
    .catch(err => {
      context.bundleState = BuildState.RequiresBuild;
      throw logger.fail(err);
    });
}


export function rollupUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const logger = new Logger('rollup update');

  const configFile = getUserConfigFile(context, taskInfo, null);

  return rollupWorker(context, configFile)
    .then(() => {
      context.bundleState = BuildState.SuccessfulBuild;
      logger.finish();
    })
    .catch(err => {
      context.bundleState = BuildState.RequiresBuild;
      throw logger.fail(err);
    });
}


export function rollupWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let rollupConfig = getRollupConfig(context, configFile);

    rollupConfig.dest = getOutputDest(context, rollupConfig);

    // replace any path vars like {{TMP}} with the real path
    rollupConfig.entry = replacePathVars(context, normalize(rollupConfig.entry));
    rollupConfig.dest = replacePathVars(context, normalize(rollupConfig.dest));

    addRollupPluginIfNecessary(context, rollupConfig.plugins);

    // tell rollup to use a previous bundle as its starting point
    rollupConfig.cache = cachedBundle;

    if (!rollupConfig.onwarn) {
      // use our own logger if one wasn't already provided
      rollupConfig.onwarn = createOnWarnFn();
    }

    Logger.debug(`entry: ${rollupConfig.entry}, dest: ${rollupConfig.dest}, cache: ${rollupConfig.cache}, format: ${rollupConfig.format}`);

    // bundle the app then create create css
    rollupBundler.rollup(rollupConfig)
      .then((bundle: RollupBundle) => {


        Logger.debug(`bundle.modules: ${bundle.modules.length}`);

        // set the module files used in this bundle
        // this reference can be used elsewhere in the build (sass)
        context.moduleFiles = bundle.modules.map((m) => {
          // sometimes, Rollup appends weird prefixes to the path like commonjs:proxy
          const index = m.id.indexOf(sep);
          if (index >= 0) {
            return m.id.substring(index);
          }
          return m.id;
        });

        // cache our bundle for later use
        if (context.isWatch) {
          cachedBundle = bundle;
        }

        const bundleOutput = bundle.generate(rollupConfig);

        // write the bundle
        const promises: Promise<any>[] = [];
        promises.push(writeFileAsync(rollupConfig.dest, bundleOutput.code));
        context.fileCache.set(rollupConfig.dest, { path: rollupConfig.dest, content: bundleOutput.code});
        const filePaths = [rollupConfig.dest];
        if (bundleOutput.map) {
          const sourceMapContent = bundleOutput.map.toString();
          promises.push(writeFileAsync(rollupConfig.dest + '.map', sourceMapContent));
          context.fileCache.set(rollupConfig.dest + '.map', { path: rollupConfig.dest + '.map', content: sourceMapContent});
          filePaths.push(rollupConfig.dest + '.map');
        }
        context.bundledFilePaths = filePaths;
        return Promise.all(promises);
      })
      .then(() => {
        // clean up any references (overkill yes, but let's play it safe)
        rollupConfig = rollupConfig.cache = rollupConfig.onwarn = rollupConfig.plugins = null;

        resolve();
      })
      .catch((err: any) => {
        // ensure references are cleared up when there's an error
        cachedBundle = rollupConfig = rollupConfig.cache = rollupConfig.onwarn = rollupConfig.plugins = null;
        reject(new BuildError(err));
      });
  });
}

function addRollupPluginIfNecessary(context: BuildContext, plugins: any[]) {
  let found = false;
  for (const plugin of plugins) {
    if (plugin.name === PLUGIN_NAME) {
      found = true;
      break;
    }
  }
  if (!found) {
    // always add the Ionic plugin to the front of the list
    plugins.unshift(ionicRollupResolverPlugin(context));
  }
}


export function getRollupConfig(context: BuildContext, configFile: string): RollupConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);
  return fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
}


export function getOutputDest(context: BuildContext, rollupConfig: RollupConfig) {
  if (!isAbsolute(rollupConfig.dest)) {
    // user can pass in absolute paths
    // otherwise save it in the build directory
    return join(context.buildDir, rollupConfig.dest);
  }
  return rollupConfig.dest;
}

export function invalidateCache() {
  cachedBundle = null;
}

let cachedBundle: RollupBundle = null;


function createOnWarnFn() {
  const previousWarns: {[key: string]: boolean} = {};

  return function onWarningMessage(warning: RollupWarning) {
    if (warning && warning.message in previousWarns) {
      return;
    }
    previousWarns[warning.message] = true;

    if (!(IGNORE_WARNS.some(warnIgnore => warning.message.indexOf(warnIgnore) > -1))) {
      Logger.warn(`rollup: ${warning.loc.file} has issued a warning: ${warning.message}`);
    }
  };
}

const IGNORE_WARNS = [
  'keyword is equivalent to'
];


const taskInfo: TaskInfo = {
  fullArg: '--rollup',
  shortArg: '-r',
  envVar: 'IONIC_ROLLUP',
  packageConfig: 'ionic_rollup',
  defaultConfigFile: 'rollup.config'
};


export interface RollupConfig {
  // https://github.com/rollup/rollup/wiki/JavaScript-API
  entry?: string;
  sourceMap?: boolean;
  plugins?: any[];
  format?: string;
  dest?: string;
  cache?: RollupBundle;
  onwarn?: Function;
}

export interface RollupBundle {
  // https://github.com/rollup/rollup/wiki/JavaScript-API
  write?: Function;
  modules: RollupModule[];
  generate: (config: RollupConfig) => RollupBundleOutput;
}

export interface RollupBundleOutput {
  code: string;
  map: string;
}


export interface RollupModule {
  id: string;
}

export interface RollupWarning {
  code: string;
  message: string;
  url: string;
  pos: number;
  loc: RollupLocationInfo;
}

export interface RollupLocationInfo {
  file: string;
  line: number;
  column: number;
}
