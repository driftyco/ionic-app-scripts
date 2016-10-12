import { BuildContext, BuildOptions, TaskInfo } from './util/interfaces';
import { endsWith } from './util/helpers';
import { fillConfigDefaults, generateContext, generateBuildOptions, replacePathVars } from './util/config';
import ionCompiler from './plugins/ion-compiler';
import { join, isAbsolute } from 'path';
import { BuildError, Logger } from './util/logger';
import { outputJson, readJsonSync } from 'fs-extra';
import { tmpdir } from 'os';
import { transpile } from './transpile';


export function bundle(context?: BuildContext, options?: BuildOptions, rollupConfig?: RollupConfig, useCache = true) {
  context = generateContext(context);
  options = generateBuildOptions(options);

  const logger = new Logger(`bundle ${(options.isProd ? 'prod' : 'dev')}`);

  rollupConfig = fillConfigDefaults(context, rollupConfig, ROLLUP_TASK_INFO);

  return transpile(context, options, rollupConfig.sourceMap).then(() => {
    return runRollup(context, options, rollupConfig, useCache);

  }).then(() => {
    return logger.finish();

  }).catch(err => {
    throw logger.fail(err);
  });
}


export function bundleUpdate(event: string, path: string, context: BuildContext, options: BuildOptions, useCache: boolean = true) {
  const logger = new Logger(`bundle ${(options.isProd ? 'prod' : 'dev')} update`);

  Logger.debug(`bundleUpdate, event: ${event}, path: ${path}`);

  const rollupConfig = fillConfigDefaults(context, null, ROLLUP_TASK_INFO);

  function transpileSuccess() {
    return runRollup(context, options, rollupConfig, useCache).then(() => {
      return logger.finish();
    });
  }

  function transpileFail(reason: any) {
    return logger.finish();
  }

  return transpile(context, options, rollupConfig.sourceMap)
    .then(transpileSuccess, transpileFail)
    .catch(err => {
      throw logger.fail(err);
    }
  );
}


function runRollup(context: BuildContext, options: BuildOptions, rollupConfig: RollupConfig, useCache: boolean): Promise<any> {
  if (!isAbsolute(rollupConfig.dest)) {
    // user can pass in absolute paths
    // otherwise save it in the build directory
    rollupConfig.dest = join(context.buildDir, rollupConfig.dest);
  }

  // replace any path vars like {{TMP}} with the real path
  rollupConfig.entry = replacePathVars(context, rollupConfig.entry);
  rollupConfig.dest = replacePathVars(context, rollupConfig.dest);

  if (!options.isProd) {
    // ngc does full production builds itself and the bundler
    // will already have receive transpiled and AoT templates

    // dev mode auto-adds the ion-compiler plugin, which will inline
    // templates and transpile source typescript code to JS before bundling
    rollupConfig.plugins.unshift(
      ionCompiler(context, options)
    );

    // add plugins that need to run before ion-compiler
    if (rollupConfig.prependPlugins) {
      rollupConfig.plugins.unshift(...rollupConfig.prependPlugins);
      delete rollupConfig.prependPlugins;
    }
  }

  if (useCache) {
    // tell rollup to use a previous bundle as its starting point
    rollupConfig.cache = context.cachedBundle;
  }

  if (!rollupConfig.onwarn) {
    // use our own logger if one wasn't already provided
    rollupConfig.onwarn = createOnWarnFn();
  }

  Logger.debug(`entry: ${rollupConfig.entry}, dest: ${rollupConfig.dest}, cache: ${rollupConfig.cache}, format: ${rollupConfig.format}`);

  checkDeprecations(options, rollupConfig);

  // bundle the app then create create css
  const rollup = require('rollup').rollup;
  return rollup(rollupConfig).then((bundle: RollupBundle) => {

    Logger.debug(`bundle.modules: ${bundle.modules.length}`);

    // set the module files used in this bundle
    // this reference can be used elsewhere in the build (sass)
    context.moduleFiles = bundle.modules.map((m) => m.id);

    // async cache all the module paths so we don't need
    // to always bundle to know which modules are used
    setModulePathsCache(context.moduleFiles);

    // cache our bundle for later use
    context.cachedBundle = bundle;

    // clean up any references
    rollupConfig.cache = rollupConfig.onwarn = rollupConfig.plugins = null;

    // write the bundle
    return bundle.write(rollupConfig);

  }).catch((err: any) => {
    // ensure references are cleared up when there's an error
    context.cachedBundle = rollupConfig.cache = rollupConfig.onwarn = rollupConfig.plugins = null;
    throw err;
  });
}


function checkDeprecations(options: BuildOptions, rollupConfig: RollupConfig) {
  if (!options.isProd) {
    if (rollupConfig.entry.indexOf('.tmp') > -1 || endsWith(rollupConfig.entry, '.js')) {
      // warning added 2016-10-05, v0.0.29
      throw new BuildError('\nDev builds no longer use the ".tmp" directory. Please update your rollup config\'s\n' +
                           'entry to use your "src" directory\'s "main.dev.ts" TypeScript file.\n' +
                           'For example, the entry for dev builds should be: "src/app/main.dev.ts"');

    }
  }
}


export function getModulePathsCache(): string[] {
  // sync get the cached array of module paths (if they exist)
  let modulePaths: string[] = null;
  const modulesCachePath = getModulesPathsCachePath();
  try {
    modulePaths = readJsonSync(modulesCachePath, <any>{ throws: false });
    Logger.debug(`Cached module paths: ${modulePaths && modulePaths.length}, ${modulesCachePath}`);
  } catch (e) {
    Logger.debug(`Cached module paths not found: ${modulesCachePath}`);
  }
  return modulePaths;
}


function setModulePathsCache(modulePaths: string[]) {
  // async save the module paths for later lookup
  const modulesCachePath = getModulesPathsCachePath();

  Logger.debug(`Cached module paths: ${modulePaths && modulePaths.length}, ${modulesCachePath}`);

  outputJson(modulesCachePath, modulePaths, (err) => {
    if (err) {
      Logger.error(`Error writing module paths cache: ${err}`);
    }
  });
}


function getModulesPathsCachePath(): string {
  // make a unique tmp directory for this project's module paths cache file
  let cwd = process.cwd().replace(/-|:|\/|\\|\.|~|;|\s/g, '').toLowerCase();
  if (cwd.length > 40) {
    cwd = cwd.substr(cwd.length - 40);
  }
  return join(tmpdir(), cwd, 'modulepaths.json');
}


export function clearCachedModule(context: BuildContext, id: string) {
  if (context.cachedBundle) {
    const cachedModule = (<RollupBundle>context.cachedBundle).modules.find(m => m.id === id);
    if (cachedModule) {
      const index = context.cachedBundle.modules.indexOf(cachedModule);
      if (index > -1) {
        context.cachedBundle.modules.splice(index, 1);
        Logger.debug(`clearCachedModule: ${id}`);
        return true;
      }
    }
  }
  Logger.debug(`clearCachedModule: no existing context.cachedBundle to clear`);
  return false;
}


function createOnWarnFn() {
  const previousWarns: {[key: string]: boolean} = {};

  return function onWarningMessage(msg: string) {
    if (msg in previousWarns) {
      return;
    }
    previousWarns[msg] = true;

    if (!(IGNORE_WARNS.some(warnIgnore => msg.indexOf(warnIgnore) > -1))) {
      Logger.warn(`rollup: ${msg}`);
    }
  };
}

const IGNORE_WARNS = [
  'keyword is equivalent to'
];


const ROLLUP_TASK_INFO: TaskInfo = {
  fullArgConfig: '--rollup',
  shortArgConfig: '-r',
  envConfig: 'ionic_rollup',
  defaultConfigFilename: 'rollup.config'
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

  // augmentation; used by ionic-app-scripts only
  prependPlugins?: any[];
}


export interface RollupBundle {
  // https://github.com/rollup/rollup/wiki/JavaScript-API
  write: Function;
  modules: { id: string }[];
}
