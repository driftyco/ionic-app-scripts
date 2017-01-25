import { accessSync, readJSONSync, statSync } from 'fs-extra';
import { BuildContext, TaskInfo } from './interfaces';
import { join, resolve } from 'path';
import { objectAssign } from './helpers';
import { FileCache } from './file-cache';
import * as Constants from './constants';

/**
 * Create a context object which is used by all the build tasks.
 * Filling the config data uses the following hierarchy, which will
 * keep going down the list until it, or if it, finds data.
 *
 * 1) Get from the passed in context variable
 * 2) Get from the config file set using the command-line args
 * 3) Get from environment variable
 * 4) Get from package.json config property
 * 5) Get environment variables
 *
 * Lastly, Ionic's default configs will always fill in any data
 * which is missing from the user's data.
 */
export function generateContext(context?: BuildContext): BuildContext {
  if (!context) {
    context = {};
    context.fileCache = new FileCache();
  }

  context.isProd = [
    context.isProd,
    hasArg('--prod')
  ].find(val => typeof val === 'boolean');

  setProcessEnvVar(Constants.ENV_VAR_IONIC_ENV, (context.isProd ? Constants.ENV_VAR_PROD : Constants.ENV_VAR_DEV));

  // If context is prod then the following flags must be set to true
  context.runAot = [
    context.runAot,
    context.isProd || hasArg('--aot'),
  ].find(val => typeof val === 'boolean');

  context.runMinifyJs = [
    context.runMinifyJs,
    context.isProd || hasArg('--minifyJs')
  ].find(val => typeof val === 'boolean');

  context.runMinifyCss = [
    context.runMinifyCss,
    context.isProd || hasArg('--minifyCss')
  ].find(val => typeof val === 'boolean');

  context.optimizeJs = [
    context.optimizeJs,
    context.isProd || hasArg('--optimizeJs')
  ].find(val => typeof val === 'boolean');

  if (typeof context.isWatch !== 'boolean') {
    context.isWatch = hasArg('--watch');
  }

  context.rootDir = resolve(context.rootDir || getConfigValue(context, '--rootDir', null, Constants.ENV_VAR_ROOT_DIR, Constants.ENV_VAR_ROOT_DIR.toLowerCase(), processCwd));
  setProcessEnvVar(Constants.ENV_VAR_ROOT_DIR, context.rootDir);

  context.tmpDir = resolve(context.tmpDir || getConfigValue(context, '--tmpDir', null, Constants.ENV_VAR_TMP_DIR, Constants.ENV_VAR_TMP_DIR.toLowerCase(), join(context.rootDir, Constants.TMP_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_TMP_DIR, context.tmpDir);

  context.srcDir = resolve(context.srcDir || getConfigValue(context, '--srcDir', null, Constants.ENV_VAR_SRC_DIR, Constants.ENV_VAR_SRC_DIR.toLowerCase(), join(context.rootDir, Constants.SRC_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_SRC_DIR, context.srcDir);

  context.wwwDir = resolve(context.wwwDir || getConfigValue(context, '--wwwDir', null, Constants.ENV_VAR_WWW_DIR, Constants.ENV_VAR_WWW_DIR.toLowerCase(), join(context.rootDir, Constants.WWW_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_WWW_DIR, context.wwwDir);

  context.wwwIndex = join(context.wwwDir, Constants.WWW_INDEX_FILENAME);

  context.buildDir = resolve(context.buildDir || getConfigValue(context, '--buildDir', null, Constants.ENV_VAR_BUILD_DIR, Constants.ENV_VAR_BUILD_DIR.toLowerCase(), join(context.wwwDir, Constants.BUILD_DIR)));
  setProcessEnvVar(Constants.ENV_VAR_BUILD_DIR, context.buildDir);

  setProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR, join(__dirname, '..', '..'));

  const generateSourceMap = getConfigValue(context, '--generateSourceMap', null, Constants.ENV_VAR_GENERATE_SOURCE_MAP, Constants.ENV_VAR_GENERATE_SOURCE_MAP.toLowerCase(), context.isProd || context.runMinifyJs ? null : 'true');
  setProcessEnvVar(Constants.ENV_VAR_GENERATE_SOURCE_MAP, generateSourceMap);

  const sourceMapTypeValue = getConfigValue(context, '--sourceMapType', null, Constants.ENV_VAR_SOURCE_MAP_TYPE, Constants.ENV_VAR_SOURCE_MAP_TYPE.toLowerCase(), Constants.SOURCE_MAP_TYPE_EXPENSIVE);
  setProcessEnvVar(Constants.ENV_VAR_SOURCE_MAP_TYPE, sourceMapTypeValue);

  const tsConfigPathValue = resolve(getConfigValue(context, '--tsconfig', null, Constants.ENV_TS_CONFIG, Constants.ENV_TS_CONFIG.toLowerCase(), join(context.rootDir, 'tsconfig.json')));
  setProcessEnvVar(Constants.ENV_TS_CONFIG, tsConfigPathValue);

  const appEntryPointPathValue = resolve(getConfigValue(context, '--appEntryPoint', null, Constants.ENV_APP_ENTRY_POINT, Constants.ENV_APP_ENTRY_POINT.toLowerCase(), join(context.srcDir, 'app', 'main.ts')));
  setProcessEnvVar(Constants.ENV_APP_ENTRY_POINT, appEntryPointPathValue);

  const appNgModulePath = resolve(getConfigValue(context, '--appNgModulePath', null, Constants.ENV_APP_NG_MODULE_PATH, Constants.ENV_APP_NG_MODULE_PATH.toLowerCase(), join(context.srcDir, 'app', 'app.module.ts')));
  setProcessEnvVar(Constants.ENV_APP_NG_MODULE_PATH, appNgModulePath);

  const appNgModuleClass = getConfigValue(context, '--appNgModuleClass', null, Constants.ENV_APP_NG_MODULE_CLASS, Constants.ENV_APP_NG_MODULE_CLASS.toLowerCase(), 'AppModule');
  setProcessEnvVar(Constants.ENV_APP_NG_MODULE_CLASS, appNgModuleClass);

  setProcessEnvVar(Constants.ENV_GLOB_UTIL, join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'util', 'glob-util.js'));

  const cleanBeforeCopy = getConfigValue(context, '--cleanBeforeCopy', null, Constants.ENV_CLEAN_BEFORE_COPY, Constants.ENV_CLEAN_BEFORE_COPY.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_CLEAN_BEFORE_COPY, cleanBeforeCopy);

  const closureEnabled = getConfigValue(context, '--useExperimentalClosure', null, Constants.ENV_USE_EXPERIMENTAL_CLOSURE, Constants.ENV_USE_EXPERIMENTAL_CLOSURE.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_USE_EXPERIMENTAL_CLOSURE, closureEnabled);

  setProcessEnvVar(Constants.ENV_CLOSURE_JAR, join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'bin', 'closure-compiler.jar'));

  const outputJsFileName = getConfigValue(context, '--outputJsFileName', null, Constants.ENV_OUTPUT_JS_FILE_NAME, Constants.ENV_OUTPUT_JS_FILE_NAME.toLowerCase(), 'main.js');
  setProcessEnvVar(Constants.ENV_OUTPUT_JS_FILE_NAME, outputJsFileName);

  const outputJsMapFileName = getConfigValue(context, '--outputJsMapFileName', null, Constants.ENV_OUTPUT_JS_MAP_FILE_NAME, Constants.ENV_OUTPUT_JS_MAP_FILE_NAME.toLowerCase(), 'main.js.map');
  setProcessEnvVar(Constants.ENV_OUTPUT_JS_MAP_FILE_NAME, outputJsMapFileName);

  const outputCssFileName = getConfigValue(context, '--outputCssFileName', null, Constants.ENV_OUTPUT_CSS_FILE_NAME, Constants.ENV_OUTPUT_CSS_FILE_NAME.toLowerCase(), 'main.css');
  setProcessEnvVar(Constants.ENV_OUTPUT_CSS_FILE_NAME, outputCssFileName);

  const outputCssMapFileName = getConfigValue(context, '--outputCssMapFileName', null, Constants.ENV_OUTPUT_CSS_MAP_FILE_NAME, Constants.ENV_OUTPUT_CSS_MAP_FILE_NAME.toLowerCase(), 'main.css.map');
  setProcessEnvVar(Constants.ENV_OUTPUT_CSS_MAP_FILE_NAME, outputCssMapFileName);

  setProcessEnvVar(Constants.ENV_WEBPACK_FACTORY, join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'webpack', 'ionic-webpack-factory.js'));

  setProcessEnvVar(Constants.ENV_WEBPACK_LOADER, join(getProcessEnvVar(Constants.ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'webpack', 'loader.js'));

  const aotWriteToDisk = getConfigValue(context, '--aotWriteToDisk', null, Constants.ENV_AOT_WRITE_TO_DISK, Constants.ENV_AOT_WRITE_TO_DISK.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_AOT_WRITE_TO_DISK, aotWriteToDisk);

  const bailOnLintError = getConfigValue(context, '--bailOnLintError', null, Constants.ENV_BAIL_ON_LINT_ERROR, Constants.ENV_BAIL_ON_LINT_ERROR.toLowerCase(), null);
  setProcessEnvVar(Constants.ENV_BAIL_ON_LINT_ERROR, bailOnLintError);

  // default stand-alone builds to default to es5
  // if closure is being used, don't worry about this as it already automatically converts to ES5
  const buildToEs5 = getConfigValue(context, '--buildToEs5', null, Constants.ENV_BUILD_TO_ES5, Constants.ENV_BUILD_TO_ES5.toLowerCase(), closureEnabled ? null : 'true');
  setProcessEnvVar(Constants.ENV_BUILD_TO_ES5, buildToEs5);

  if (!isValidBundler(context.bundler)) {
    context.bundler = bundlerStrategy(context);
  }

  context.inlineTemplates = true;

  checkDebugMode();

  return context;
}

export function getUserConfigFile(context: BuildContext, task: TaskInfo, userConfigFile: string) {
  if (!context) {
    context = generateContext(context);
  }

  if (userConfigFile) {
    return resolve(userConfigFile);
  }

  const defaultConfig = getConfigValue(context, task.fullArg, task.shortArg, task.envVar, task.packageConfig, null);
  if (defaultConfig) {
    return join(context.rootDir, defaultConfig);
  }

  return null;
}


export function fillConfigDefaults(userConfigFile: string, defaultConfigFile: string): any {
  let userConfig: any = null;

  if (userConfigFile) {
    try {
      // check if exists first, so we can print a more specific error message
      // since required config could also throw MODULE_NOT_FOUND
      statSync(userConfigFile);
      // create a fresh copy of the config each time
      userConfig = require(userConfigFile);

      // if user config returns a function call it to determine proper object
      if (typeof userconfig === 'function') {
         userConfig = userConfig();
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.error(`Config file "${userConfigFile}" not found. Using defaults instead.`);
      } else {
        console.error(`There was an error in config file "${userConfigFile}". Using defaults instead.`);
        console.error(e);
      }
    }
  }

  const defaultConfig = require(join('..', '..', 'config', defaultConfigFile));

  // create a fresh copy of the config each time
  // always assign any default values which were not already supplied by the user
  return objectAssign({}, defaultConfig, userConfig);
}

export function bundlerStrategy(context: BuildContext): string {
  // 1) User provided a rollup config via cmd line args
  let val: any = getArgValue('--rollup', '-r');
  if (val) {
    return Constants.BUNDLER_ROLLUP;
  }

  // 2) User provided both a rollup config and webpack config in package.json config
  val = getPackageJsonConfig(context, 'ionic_rollup');
  const webpackVal = getPackageJsonConfig(context, 'ionic_webpack');
  if (val && webpackVal) {
    let bundler = getPackageJsonConfig(context, 'ionic_bundler');
    if (isValidBundler(bundler)) {
      return bundler;
    }
  }

  // 3) User provided a rollup config env var
  val = getProcessEnvVar('ionic_rollup');
  if (val) {
    return Constants.BUNDLER_ROLLUP;
  }

  // 4) User provided a rollup config in package.json config
  val = getPackageJsonConfig(context, 'ionic_rollup');
  if (val) {
    return Constants.BUNDLER_ROLLUP;
  }

  // 5) User set bundler through full arg
  val = getArgValue('--bundler', null);
  if (isValidBundler(val)) {
    return val;
  }

  // 6) User set bundler through package.json config
  val = getPackageJsonConfig(context, 'ionic_bundler');
  if (isValidBundler(val)) {
    return val;
  }

  // 7) User set to use rollup at the bundler
  val = getProcessEnvVar('ionic_bundler');
  if (isValidBundler(val)) {
    return val;
  }

  // 8) Default to use webpack
  return Constants.BUNDLER_WEBPACK;
}


function isValidBundler(bundler: any) {
  return (bundler === Constants.BUNDLER_ROLLUP || bundler === Constants.BUNDLER_WEBPACK);
}


export function getConfigValue(context: BuildContext, argFullName: string, argShortName: string, envVarName: string, packageConfigProp: string, defaultValue: string) {
  if (!context) {
    context = generateContext(context);
  }

  // first see if the value was set in the command-line args
  const argVal = getArgValue(argFullName, argShortName);
  if (argVal !== null) {
    return argVal;
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the package.json config property
  const envVar = getProcessEnvVar(envVarName);
  if (envVar !== null) {
    return envVar;
  }

  const packageConfig = getPackageJsonConfig(context, packageConfigProp);
  if (packageConfig !== null) {
    return packageConfig;
  }

  // return the default if nothing above was found
  return defaultValue;
}


function getArgValue(fullName: string, shortName: string): string {
  for (var i = 2; i < processArgv.length; i++) {
    var arg = processArgv[i];
    if (arg === fullName || (shortName && arg === shortName)) {
      var val = processArgv[i + 1];
      if (val !== undefined && val !== '') {
        return val;
      }
    }
  }
  return null;
}


export function hasConfigValue(context: BuildContext, argFullName: string, argShortName: string, envVarName: string, defaultValue: boolean) {
  if (!context) {
    context = generateContext(context);
  }

  if (hasArg(argFullName, argShortName)) {
    return true;
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the package.json config property
  const envVar = getProcessEnvVar(envVarName);
  if (envVar !== null) {
    return true;
  }

  const packageConfig = getPackageJsonConfig(context, envVarName);
  if (packageConfig !== null) {
    return true;
  }

  // return the default if nothing above was found
  return defaultValue;
}


export function hasArg(fullName: string, shortName: string = null): boolean {
  return !!(processArgv.some(a => a.toLowerCase() === fullName.toLowerCase()) ||
    (shortName !== null && processArgv.some(a => a.toLowerCase() === shortName.toLowerCase())));
}


export function replacePathVars(context: BuildContext, filePath: string | string[] | { [key: string]: any }): any {
  if (Array.isArray(filePath)) {
    return filePath.map(f => replacePathVars(context, f));
  }

  if (typeof filePath === 'object') {
    const clonedFilePaths = Object.assign({}, filePath);
    for (let key in clonedFilePaths) {
      clonedFilePaths[key] = replacePathVars(context, clonedFilePaths[key]);
    }
    return clonedFilePaths;
  }

  return filePath.replace('{{SRC}}', context.srcDir)
    .replace('{{WWW}}', context.wwwDir)
    .replace('{{TMP}}', context.tmpDir)
    .replace('{{ROOT}}', context.rootDir)
    .replace('{{BUILD}}', context.buildDir);
}

export function getNodeBinExecutable(context: BuildContext, cmd: string) {
  let cmdPath = join(context.rootDir, 'node_modules', '.bin', cmd);

  try {
    accessSync(cmdPath);
  } catch (e) {
    cmdPath = null;
  }

  return cmdPath;
}


let checkedDebug = false;
function checkDebugMode() {
  if (!checkedDebug) {
    if (hasArg('--debug') || getProcessEnvVar('ionic_debug_mode') === 'true') {
      processEnv.ionic_debug_mode = 'true';
    }
    checkedDebug = true;
  }
}


export function isDebugMode() {
  return (processEnv.ionic_debug_mode === 'true');
}

let processArgv: string[];
export function setProcessArgs(argv: string[]) {
  processArgv = argv;
}
setProcessArgs(process.argv);

export function addArgv(value: string) {
  processArgv.push(value);
}

let processEnv: any;
export function setProcessEnv(env: any) {
  processEnv = env;
}
setProcessEnv(process.env);

export function setProcessEnvVar(key: string, value: any) {
  if (key && value) {
    processEnv[key] = value;
  }
}

export function getProcessEnvVar(key: string): any {
  const val = processEnv[key];
  if (val !== undefined) {
    if (val === 'true') {
      return true;
    }
    if (val === 'false') {
      return false;
    }
    return val;
  }
  return null;
}

let processCwd: string;
export function setCwd(cwd: string) {
  processCwd = cwd;
}
setCwd(process.cwd());


export function getPackageJsonConfig(context: BuildContext, key: string): any {
  const packageJsonData = getAppPackageJsonData(context);
  if (packageJsonData && packageJsonData.config) {
    const val = packageJsonData.config[key];
    if (val !== undefined) {
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
      return val;
    }
  }
  return null;
}


let appPackageJsonData: any = null;
export function setAppPackageJsonData(data: any) {
  appPackageJsonData = data;
}

function getAppPackageJsonData(context: BuildContext) {
  if (!appPackageJsonData) {
    try {
      appPackageJsonData = readJSONSync(join(context.rootDir, 'package.json'));
    } catch (e) {}
  }

  return appPackageJsonData;
}
