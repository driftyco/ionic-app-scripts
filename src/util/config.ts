import { accessSync, readJSONSync, statSync } from 'fs-extra';
import { BuildContext, TaskInfo } from './interfaces';
import { join, resolve } from 'path';
import { objectAssign } from './helpers';
import { FileCache } from './file-cache';


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

  context.rootDir = resolve(context.rootDir || getConfigValue(context, '--rootDir', null, ENV_VAR_ROOT_DIR, ENV_VAR_ROOT_DIR.toLowerCase(), processCwd));
  setProcessEnvVar(ENV_VAR_ROOT_DIR, context.rootDir);

  context.tmpDir = resolve(context.tmpDir || getConfigValue(context, '--tmpDir', null, ENV_VAR_TMP_DIR, ENV_VAR_TMP_DIR.toLowerCase(), join(context.rootDir, TMP_DIR)));
  setProcessEnvVar(ENV_VAR_TMP_DIR, context.tmpDir);

  context.srcDir = resolve(context.srcDir || getConfigValue(context, '--srcDir', null, ENV_VAR_SRC_DIR, ENV_VAR_SRC_DIR.toLowerCase(), join(context.rootDir, SRC_DIR)));
  setProcessEnvVar(ENV_VAR_SRC_DIR, context.srcDir);

  context.wwwDir = resolve(context.wwwDir || getConfigValue(context, '--wwwDir', null, ENV_VAR_WWW_DIR, ENV_VAR_WWW_DIR.toLowerCase(), join(context.rootDir, WWW_DIR)));
  setProcessEnvVar(ENV_VAR_WWW_DIR, context.wwwDir);

  context.wwwIndex = join(context.wwwDir, WWW_INDEX_FILENAME);

  context.buildDir = resolve(context.buildDir || getConfigValue(context, '--buildDir', null, ENV_VAR_BUILD_DIR, ENV_VAR_BUILD_DIR.toLowerCase(), join(context.wwwDir, BUILD_DIR)));
  setProcessEnvVar(ENV_VAR_BUILD_DIR, context.buildDir);

  setProcessEnvVar(ENV_VAR_APP_SCRIPTS_DIR, join(__dirname, '..', '..'));

  const sourceMapValue = getConfigValue(context, '--sourceMap', null, ENV_VAR_SOURCE_MAP, ENV_VAR_SOURCE_MAP.toLowerCase(), 'eval');
  setProcessEnvVar(ENV_VAR_SOURCE_MAP, sourceMapValue);

  if (!isValidBundler(context.bundler)) {
    context.bundler = bundlerStrategy(context);
  }

  context.isProd = getIsProd(context);
  setIonicEnvironment(context.isProd);

  if (typeof context.isWatch !== 'boolean') {
    context.isWatch = hasArg('--watch', '-w');
  }

  context.inlineTemplates = true;

  checkDebugMode();

  return context;
}


export function getIsProd(context: BuildContext) {
  // only check if isProd hasn't already been manually set
  if (typeof context.isProd === 'boolean') {
    return context.isProd;
  }
  if (hasArg('--dev', '-d')) {
    // not production: has a --dev or -d cmd line arg
    return false;
  }

  let val = getPackageJsonConfig(context, ENV_VAR_IONIC_DEV.toLowerCase());
  if (typeof val === 'boolean') {
    return !val;
  }

  val = getProcessEnvVar(ENV_VAR_IONIC_DEV);
  if (typeof val === 'boolean') {
    return !val;
  }

  return true;
}


export function getUserConfigFile(context: BuildContext, task: TaskInfo, userConfigFile: string) {
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
    return BUNDLER_ROLLUP;
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
    return BUNDLER_ROLLUP;
  }

  // 4) User provided a rollup config in package.json config
  val = getPackageJsonConfig(context, 'ionic_rollup');
  if (val) {
    return BUNDLER_ROLLUP;
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
  return BUNDLER_WEBPACK;
}


function isValidBundler(bundler: any) {
  return (bundler === BUNDLER_ROLLUP || bundler === BUNDLER_WEBPACK);
}


export function getConfigValue(context: BuildContext, argFullName: string, argShortName: string, envVarName: string, packageConfigProp: string, defaultValue: string) {
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
  return !!(processArgv.some(a => a === fullName) || (shortName !== null && processArgv.some(a => a === shortName)));
}


export function replacePathVars(context: BuildContext, filePath: string) {
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


export function setIonicEnvironment(isProd: boolean) {
  setProcessEnvVar(ENV_VAR_IONIC_ENV, (isProd ? ENV_VAR_PROD : ENV_VAR_DEV));
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
  processEnv[key] = value;
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


const BUILD_DIR = 'build';
const SRC_DIR = 'src';
const TMP_DIR = '.tmp';
const WWW_DIR = 'www';
const WWW_INDEX_FILENAME = 'index.html';

const ENV_VAR_PROD = 'prod';
const ENV_VAR_DEV = 'dev';

const ENV_VAR_IONIC_ENV = 'IONIC_ENV';
const ENV_VAR_IONIC_DEV = 'IONIC_DEV';
const ENV_VAR_ROOT_DIR = 'IONIC_ROOT_DIR';
const ENV_VAR_TMP_DIR = 'IONIC_TMP_DIR';
const ENV_VAR_SRC_DIR = 'IONIC_SRC_DIR';
const ENV_VAR_WWW_DIR = 'IONIC_WWW_DIR';
const ENV_VAR_BUILD_DIR = 'IONIC_BUILD_DIR';
const ENV_VAR_APP_SCRIPTS_DIR = 'IONIC_APP_SCRIPTS_DIR';
const ENV_VAR_SOURCE_MAP = 'IONIC_SOURCE_MAP';

export const BUNDLER_ROLLUP = 'rollup';
export const BUNDLER_WEBPACK = 'webpack';
