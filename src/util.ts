import { join } from 'path';
import { accessSync, readFile, writeFile } from 'fs-extra';

/**
 * Create a context object which is used by all the build tasks.
 * Filling the config data uses the following hierarchy, which will
 * keep going down the list until it, or if it, finds data.
 *
 * 1) Get from the passed in context variable
 * 2) Get from the config file set using the command-line args
 * 3) Get from npm package.json config
 * 4) Get environment variables
 *
 * Lastly, Ionic's default configs will always fill in any data
 * which is missing from the user's data.
 */
export function generateContext(context?: BuildContext): BuildContext {
  if (!context) {
    context = {};
  }

  context.rootDir = context.rootDir || getConfigValueDefaults('--rootDir', null, 'ionic_root_dir', processCwd, context);

  context.tmpDir = context.tmpDir || getConfigValueDefaults('--tmpDir', null, 'ionic_tmp_dir', join(context.rootDir, TMP_DIR), context);

  context.srcDir = context.srcDir || getConfigValueDefaults('--srcDir', null, 'ionic_src_dir', join(context.rootDir, SRC_DIR), context);

  context.wwwDir = context.wwwDir || getConfigValueDefaults('--wwwDir', null, 'ionic_www_dir', join(context.rootDir, WWW_DIR), context);

  context.buildDir = context.buildDir || getConfigValueDefaults('--buildDir', null, 'ionic_build_dir', join(context.wwwDir, BUILD_DIR), context);

  context.mainEntryDev = join('app', 'main.dev.ts');

  context.mainEntryProd = join('app', 'main.prod.ts');

  checkDebugMode();

  return context;
}


export function generateBuildOptions(options?: BuildOptions): BuildOptions {
  if (!options) {
    options = {};
  }

  if (typeof options.isProd !== 'boolean') {
    options.isProd = !(hasArg('--dev', '-d') || (getEnvVariable('ionic_dev') === 'true'));
  }

  if (typeof options.isWatch !== 'boolean') {
    options.isWatch = hasArg('--watch', '-w');
  }

  return options;
}


export function fillConfigDefaults(context: BuildContext, config: any, task: TaskInfo): any {
  // if the context property wasn't already set, then see if a config file
  // was supplied by the user as an arg or env variable
  if (!config) {
    config = getConfigFileData(task.fullArgConfig, task.shortArgConfig, task.envConfig, null, context) || {};
  }

  const pathToImport = join('config', task.defaultConfigFilename);
  const defaultConfig = require('./' + pathToImport);

  // always assign any default values which were not already supplied by the user
  assignDefaults(config, defaultConfig);

  return config;
}


function getConfigFileData(fullName: string, shortName: string, envVarName: string, defaultValue: string, context: BuildContext): any {
  // see if the user supplied a value for where to look up their config file
  const configFilePath = getConfigValueDefaults(fullName, shortName, envVarName, null, context);

  if (configFilePath) {
    try {
      return require(configFilePath);
    } catch (e) {
      Logger.error(`Config file "${configFilePath}" not found. Using defaults instead.`);
      Logger.error(e);
    }
  }

  return null;
}


export function getConfigValueDefaults(argFullName: string, argShortName: string, envVarName: string, defaultValue: string, context: BuildContext) {
  // first see if the value was set in the command-line args
  const argValue = getArgValue(argFullName, argShortName);
  if (argValue) {
    return join(context.rootDir, argValue);
  }

  // next see if it was set in the environment variables
  // which also checks if it was set in the npm package.json config
  const envVar = getEnvVariable(envVarName);
  if (envVar) {
    return join(context.rootDir, envVar);
  }

  // return the default if nothing above was found
  return defaultValue;
}


function getEnvVariable(envVarName: string): string {
  // see if it was set in npm package.json config
  // which ends up as an env variable prefixed with "npm_package_config_"
  let val = processEnv['npm_package_config_' + envVarName];
  if (val !== undefined) {
    return val;
  }

  // next see if it was just set as an environment variables
  val = processEnv[envVarName];
  if (val !== undefined) {
    return val;
  }

  return null;
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


export function hasArg(fullName: string, shortName: string = null): boolean {
  return (processArgv.some(a => a === fullName) || (shortName !== null && processArgv.some(a => a === shortName)));
}


function assignDefaults(userConfig: any, defaultConfig: any) {
  if (userConfig && defaultConfig) {
    for (var key in defaultConfig) {
      if (!Object.prototype.hasOwnProperty.call(userConfig, key)) {
        userConfig[key] = defaultConfig[key];
      }
    }
  }
}


export function replacePathVars(context: BuildContext, filePath: string) {
  return filePath.replace('{{SRC}}', context.srcDir)
                 .replace('{{WWW}}', context.wwwDir)
                 .replace('{{TMP}}', context.tmpDir)
                 .replace('{{ROOT}}', context.rootDir)
                 .replace('{{BUILD}}', context.buildDir);
}

export function writeFileAsync(filePath: string, content: string): Promise<any> {
  return new Promise( (resolve, reject) => {
    writeFile(filePath, content, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function readFileAsync(filePath: string): Promise<string> {
  return new Promise( (resolve, reject) => {
    readFile(filePath, function(err, buffer) {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString());
      }
    });
  });
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


export function isTsFilename(filename: string) {
  return (filename.length > 3) && (filename.substr(filename.length - 3) === '.ts');
}


let checkedDebug = false;
function checkDebugMode() {
  if (!checkedDebug) {
    if (hasArg('--debug') || getEnvVariable('ionic_debug_mode') === 'true') {
      processEnv.ionic_debug_mode = 'true';
    }

    if (isDebugMode()) {
      Logger.debug('Debugging enabled');
    }
    checkedDebug = true;
  }
}


function isDebugMode() {
  return (processEnv.ionic_debug_mode === 'true');
}


export class Logger {
  private start: number;
  private scope: string;

  constructor(scope: string) {
    if (!printedAppScriptsVersion) {
      printedAppScriptsVersion = true;
      Logger.info(`ionic-app-scripts ${getAppScriptsVersion()}`);
    }

    this.start = Date.now();
    this.scope = scope;
    Logger.info(`${scope} started ...`);
  }

  ready() {
    return this.completed('ready');
  }

  finish() {
    return this.completed('finished');
  }

  private completed(msg: string) {
    let duration = Date.now() - this.start;
    let time: string;

    if (duration > 1000) {
      time = 'in ' + (duration / 1000).toFixed(2) + ' s';

    } else {
      let ms = parseFloat((duration).toFixed(3));
      if (ms > 0) {
        time = 'in ' + duration + ' ms';
      } else {
        time = 'in less than 1 ms';
      }
    }

    Logger.info(`${this.scope} ${msg} ${time}`);
    return true;
  }

  fail(exception: Error, msg?: string) {
    if (msg) {
      Logger.error(`${this.scope} failed:  ${msg}`);
    }

    if (exception) {
      if (typeof exception === 'string') {
        Logger.error(exception);
      } 
      if (exception.stack) {
        Logger.error(exception.stack);
      }
    }

    return false;
  }

  static info(...msg: string[]) {
    print('info', msg.join(' '));
  }

  static warn(...msg: string[]) {
    print('warn', msg.join(' '));
  }

  static error(...msg: string[]) {
    print('error', msg.join(' '));
  }

  static debug(...msg: string[]) {
    if (isDebugMode()) {
      print('log', msg.join(' '), ' DEBUG! ');
    }
  }

}

function print(type: string, msg: string, prefix?: string) {
  const date = new Date();
  if (!prefix) {
    prefix = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
  }
  (<any>console)[type](`[${prefix}]  ${msg}`);
}

let printedAppScriptsVersion = false;
function getAppScriptsVersion() {
  let rtn = '';
  try {
    const packageJson = require(join(__dirname, '..', 'package.json'));
    rtn = packageJson.version;
  } catch (e) {}
  return rtn;
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

export function setEnvVar(key: string, value: any) {
  processEnv[key] = value;
}

let processCwd: string;
export function setCwd(cwd: string) {
  processCwd = cwd;
}
setCwd(process.cwd());

const BUILD_DIR = 'build';
const SRC_DIR = 'src';
const TMP_DIR = '.tmp';
const WWW_DIR = 'www';


export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  buildDir?: string;
  mainEntryDev?: string;
  mainEntryProd?: string;
  moduleFiles?: string[];
}


export interface BuildOptions {
  isProd?: boolean;
  isWatch?: boolean;
}


export interface TaskInfo {
  fullArgConfig: string;
  shortArgConfig: string;
  envConfig: string;
  defaultConfigFilename: string;
}
