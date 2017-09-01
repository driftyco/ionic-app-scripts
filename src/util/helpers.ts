import { randomBytes } from 'crypto';
import { basename, dirname, extname, join } from 'path';
import { createReadStream, createWriteStream, ensureDir, readdir, readFile, readFileSync, readJsonSync, remove, unlink, writeFile } from 'fs-extra';
import * as osName from 'os-name';

import * as Constants from './constants';
import { BuildError } from './errors';
import { BuildContext, DeepLinkConfigEntry, File, WebpackStats } from './interfaces';
import { Logger } from '../logger/logger';
import { CAMEL_CASE_REGEXP } from './helpers/camel-case-regexp';
import { CAMEL_CASE_UPPER_REGEXP } from './helpers/camel-case-upper-regexp';
import { NON_WORD_REGEXP } from './helpers/non-word-regexp';

let _context: BuildContext;
let _parsedDeepLinkConfig: DeepLinkConfigEntry[];

let cachedAppScriptsPackageJson: any;
export function getAppScriptsPackageJson() {
  if (!cachedAppScriptsPackageJson) {
    try {
      cachedAppScriptsPackageJson = readJsonSync(join(__dirname, '..', '..', 'package.json'));
    } catch (e) {}
  }
  return cachedAppScriptsPackageJson;
}

export function getAppScriptsVersion(): string {
  const appScriptsPackageJson = getAppScriptsPackageJson();
  return (appScriptsPackageJson && appScriptsPackageJson.version) ? appScriptsPackageJson.version : '';
}

function getUserPackageJson(userRootDir: string) {
  try {
    return readJsonSync(join(userRootDir, 'package.json'));
  } catch (e) {}
  return null;
}

export function getSystemText(userRootDir: string) {
  const systemData = getSystemData(userRootDir);
  const d: string[] = [];

  d.push(`Ionic Framework: ${systemData.ionicFramework}`);
  if (systemData.ionicNative) {
    d.push(`Ionic Native: ${systemData.ionicNative}`);
  }
  d.push(`Ionic App Scripts: ${systemData.ionicAppScripts}`);
  d.push(`Angular Core: ${systemData.angularCore}`);
  d.push(`Angular Compiler CLI: ${systemData.angularCompilerCli}`);
  d.push(`Node: ${systemData.node}`);
  d.push(`OS Platform: ${systemData.osName}`);

  return d;
}


export function getSystemData(userRootDir: string) {
  const d = {
    ionicAppScripts: getAppScriptsVersion(),
    ionicFramework: '',
    ionicNative: '',
    angularCore: '',
    angularCompilerCli: '',
    node: process.version.replace('v', ''),
    osName: osName()
  };

  try {
    const userPackageJson = getUserPackageJson(userRootDir);
    if (userPackageJson) {
      const userDependencies = userPackageJson.dependencies;
      if (userDependencies) {
        d.ionicFramework = userDependencies['ionic-angular'];
        d.ionicNative = userDependencies['ionic-native'];
        d.angularCore = userDependencies['@angular/core'];
        d.angularCompilerCli = userDependencies['@angular/compiler-cli'];
      }
    }
  } catch (e) {}

  return d;
}


export function splitLineBreaks(sourceText: string) {
  if (!sourceText) return [];
  sourceText = sourceText.replace(/\\r/g, '\n');
  return sourceText.split('\n');
}


export const objectAssign = (Object.assign) ? Object.assign : function (target: any, source: any) {
  const output = Object(target);

  for (var index = 1; index < arguments.length; index++) {
    source = arguments[index];
    if (source !== undefined && source !== null) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          output[key] = source[key];
        }
      }
    }
  }

  return output;
};


export function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}


export function writeFileAsync(filePath: string, content: string) {
  return new Promise((resolve, reject) => {
    writeFile(filePath, content, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

export function readFileAsync(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    readFile(filePath, 'utf-8', (err, buffer) => {
      if (err) {
        return reject(err);
      }
      return resolve(buffer);
    });
  });
}

export function readAndCacheFile(filePath: string, purge: boolean = false): Promise<string> {
  const file = _context.fileCache.get(filePath);
  if (file && !purge) {
    return Promise.resolve(file.content);
  }
  return readFileAsync(filePath).then((fileContent: string) => {
    _context.fileCache.set(filePath, { path: filePath, content: fileContent});
    return fileContent;
  });
}

export function unlinkAsync(filePath: string|string[]): Promise<any> {
  let filePaths: string[];

  if (typeof filePath === 'string') {
    filePaths = [filePath];
  } else if (Array.isArray(filePath)) {
    filePaths = filePath;
  } else {
    return Promise.reject('unlinkAsync, invalid filePath type');
  }

  let promises = filePaths.map(filePath => {
    return new Promise<void>((resolve, reject) => {
      unlink(filePath, (err: Error) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  });

  return Promise.all(promises);
}

export function rimRafAsync(directoryPath: string) {
  return new Promise<void>((resolve, reject) => {
    remove(directoryPath, (err: Error) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

export function copyFileAsync(srcPath: string, destPath: string) {
  return new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(destPath);

    writeStream.on('error', (err: Error) => {
      reject(err);
    });

    writeStream.on('close', () => {
      resolve();
    });

    createReadStream(srcPath).pipe(writeStream);
  });
}

export function mkDirpAsync(directoryPath: string) {
  return new Promise((resolve, reject) => {
    ensureDir(directoryPath, (err: Error) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

export function readDirAsync(pathToDir: string) {
  return new Promise<string[]>((resolve, reject) => {
    readdir(pathToDir, (err: Error, fileNames: string[]) => {
      if (err) {
        return reject(err);
      }
      resolve(fileNames);
    });
  });
}

export function createFileObject(filePath: string): File {
  const content = readFileSync(filePath).toString();
  return {
    content: content,
    path: filePath,
    timestamp: Date.now()
  };
}

export function setContext(context: BuildContext) {
  _context = context;
}

export function getContext() {
  return _context;
}

export function setParsedDeepLinkConfig(parsedDeepLinkConfig: DeepLinkConfigEntry[]) {
  _parsedDeepLinkConfig = parsedDeepLinkConfig;
}

export function getParsedDeepLinkConfig(): DeepLinkConfigEntry[] {
  return _parsedDeepLinkConfig;
}

export function transformSrcPathToTmpPath(originalPath: string, context: BuildContext) {
  return originalPath.replace(context.srcDir, context.tmpDir);
}

export function transformTmpPathToSrcPath(originalPath: string, context: BuildContext) {
  return originalPath.replace(context.tmpDir, context.srcDir);
}

export function changeExtension(filePath: string, newExtension: string) {
  const dir = dirname(filePath);
  const extension = extname(filePath);
  const extensionlessfileName = basename(filePath, extension);
  const newFileName = extensionlessfileName + newExtension;
  return join(dir, newFileName);
}

export function escapeHtml(unsafe: string) {
  return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
}

export function escapeStringForRegex(input: string) {
  return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

export function rangeReplace(source: string, startIndex: number, endIndex: number, newContent: string) {
  return source.substring(0, startIndex) + newContent + source.substring(endIndex);
}

export function stringSplice(source: string, startIndex: number, numToDelete: number, newContent: string) {
  return source.slice(0, startIndex) + newContent + source.slice(startIndex + Math.abs(numToDelete));
}

export function toUnixPath(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

export function generateRandomHexString(numCharacters: number) {
  return randomBytes(Math.ceil(numCharacters / 2)).toString('hex').slice(0, numCharacters);
}

export function getStringPropertyValue(propertyName: string) {
  const result = process.env[propertyName];
  return result;
}

export function getIntPropertyValue(propertyName: string) {
  const result = process.env[propertyName];
  return parseInt(result, 0);
}

export function getBooleanPropertyValue(propertyName: string) {
  const result = process.env[propertyName];
  return result === 'true';
}

export function convertFilePathToNgFactoryPath(filePath: string) {
  const directory = dirname(filePath);
  const extension = extname(filePath);
  const extensionlessFileName = basename(filePath, extension);
  const ngFactoryFileName = extensionlessFileName + '.ngfactory' + extension;
  return join(directory, ngFactoryFileName);
}

export function printDependencyMap(map: Map<string, Set<string>>) {
  map.forEach((dependencySet: Set<string>, filePath: string) => {
    Logger.unformattedDebug('\n\n');
    Logger.unformattedDebug(`${filePath} is imported by the following files:`);
    dependencySet.forEach((importeePath: string) => {
      Logger.unformattedDebug(`   ${importeePath}`);
    });
  });
}

export function webpackStatsToDependencyMap(context: BuildContext, stats: any) {
  const statsObj = stats.toJson({
    source: false,
    timings: false,
    version: false,
    errorDetails: false,
    chunks: false,
    chunkModules: false
  });
  return processStatsImpl(statsObj);
}

export function processStatsImpl(webpackStats: WebpackStats) {
  const dependencyMap = new Map<string, Set<string>>();
  if (webpackStats && webpackStats.modules) {
      webpackStats.modules.forEach(webpackModule => {
      const moduleId = purgeWebpackPrefixFromPath(webpackModule.identifier);
      const dependencySet = new Set<string>();
      webpackModule.reasons.forEach(webpackDependency => {
        const depId = purgeWebpackPrefixFromPath(webpackDependency.moduleIdentifier);
        dependencySet.add(depId);
      });
      dependencyMap.set(moduleId, dependencySet);
    });
  }

  return dependencyMap;
}

export function purgeWebpackPrefixFromPath(filePath: string) {
  return filePath.replace(process.env[Constants.ENV_OPTIMIZATION_LOADER], '').replace(process.env[Constants.ENV_WEBPACK_LOADER], '').replace('!', '');
}

export function replaceAll(input: string, toReplace: string, replacement: string) {
  if (!replacement) {
    replacement = '';
  }

  return input.split(toReplace).join(replacement);
}

export function ensureSuffix(input: string, suffix: string) {
  if (!input.endsWith(suffix)) {
    input += suffix;
  }

  return input;
}

export function removeSuffix(input: string, suffix: string) {
  if (input.endsWith(suffix)) {
    input = input.substring(0, input.length - suffix.length);
  }

  return input;
}

export function buildErrorToJson(buildError: BuildError) {
  return {
    message: buildError.message,
    name: buildError.name,
    stack: buildError.stack,
    hasBeenLogged: buildError.hasBeenLogged,
    isFatal: buildError.isFatal
  };
}

export function jsonToBuildError(nonTypedBuildError: any) {
  const error = new BuildError(new Error(nonTypedBuildError.message));
  error.name = nonTypedBuildError.name;
  error.stack = nonTypedBuildError.stack;
  error.hasBeenLogged = nonTypedBuildError.hasBeenLogged;
  error.isFatal = nonTypedBuildError.isFatal;
  return error;
}

export function upperCaseFirst(input: string) {
  if (input.length > 1) {
    return input.charAt(0).toUpperCase() + input.substr(1);
  }
  return input.toUpperCase();
}

export function sentenceCase(input: string) {
  const noCase = removeCaseFromString(input);
  return upperCaseFirst(noCase);
}

export function snakeCase(input: string) {
  return removeCaseFromString(input, '_');
}

export function constantCase(input: string) {
  return snakeCase(input).toUpperCase();
}

export function camelCase(input: string) {
  input = removeCaseFromString(input);
  input = input.replace(/ (?=\d)/g, '_');
  return input.replace(/ (.)/g, (m: string, arg: string) => {
    return arg.toUpperCase();
  });
}

export function paramCase(input: string) {
  return removeCaseFromString(input, '-');
}

export function pascalCase(input: string) {
  return upperCaseFirst(camelCase(input));
}

export function removeCaseFromString(input: string, inReplacement?: string) {
  const replacement = inReplacement && inReplacement.length > 0 ? inReplacement : ' ';

  function replace (match: string, index: number, value: string) {
    if (index === 0 || index === (value.length - match.length)) {
      return '';
    }

    return replacement;
  }

  const modified = input
    // Support camel case ("camelCase" -> "camel Case").
    .replace(CAMEL_CASE_REGEXP, '$1 $2')
    // Support odd camel case ("CAMELCase" -> "CAMEL Case").
    .replace(CAMEL_CASE_UPPER_REGEXP, '$1 $2')
    // Remove all non-word characters and replace with a single space.
    .replace(NON_WORD_REGEXP, replace);

  return modified.toLowerCase();
}

export function isSrcOrIonicOrIonicDeps(filePath: string) {
  return (filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_AT_ANGULAR_DIR))
    || filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_DIR))
    || filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_RXJS_DIR))
    || filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_SRC_DIR)));
}

export function isIonicOrAngular(filePath: string) {
  return (filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_AT_ANGULAR_DIR))
    || filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_DIR)));
}

export function isIonic(filePath: string) {
  return filePath.startsWith(getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_DIR));
}
