import { randomBytes } from 'crypto';
import { basename, dirname, extname, join } from 'path';
import { createReadStream, createWriteStream, readdir, readFile, readFileSync, readJsonSync, remove, unlink, writeFile } from 'fs-extra';
import * as osName from 'os-name';

import * as Constants from './constants';
import { BuildContext, File, HydratedDeepLinkConfigEntry, WebpackStats } from './interfaces';
import { Logger } from '../logger/logger';


let _context: BuildContext;
let _parsedDeepLinkConfig: HydratedDeepLinkConfigEntry[];

let cachedAppScriptsPackageJson: any;
export function getAppScriptsPackageJson() {
  if (!cachedAppScriptsPackageJson) {
    try {
      cachedAppScriptsPackageJson = readJsonSync(join(__dirname, '..', '..', 'package.json'));
    } catch (e) {}
  }
  return cachedAppScriptsPackageJson;
}

export function getAppScriptsVersion() {
  const appScriptsPackageJson = getAppScriptsPackageJson();
  return (appScriptsPackageJson && appScriptsPackageJson.version) ? appScriptsPackageJson.version : '';
}

function getUserPackageJson(userRootDir: string) {
  try {
    return readJsonSync(join(userRootDir, 'package.json'));
  } catch (e) {}
  return null;
}

export function getSystemInfo(userRootDir: string) {
  const d: string[] = [];

  let ionicAppScripts = getAppScriptsVersion();
  let ionicFramework: string = null;
  let ionicNative: string = null;
  let angularCore: string = null;
  let angularCompilerCli: string = null;

  try {
    const userPackageJson = getUserPackageJson(userRootDir);
    if (userPackageJson) {
      const userDependencies = userPackageJson.dependencies;
      if (userDependencies) {
        ionicFramework = userDependencies['ionic-angular'];
        ionicNative = userDependencies['ionic-native'];
        angularCore = userDependencies['@angular/core'];
        angularCompilerCli = userDependencies['@angular/compiler-cli'];
      }
    }
  } catch (e) {}

  d.push(`Ionic Framework: ${ionicFramework}`);
  if (ionicNative) {
    d.push(`Ionic Native: ${ionicNative}`);
  }
  d.push(`Ionic App Scripts: ${ionicAppScripts}`);
  d.push(`Angular Core: ${angularCore}`);
  d.push(`Angular Compiler CLI: ${angularCompilerCli}`);
  d.push(`Node: ${process.version.replace('v', '')}`);
  d.push(`OS Platform: ${osName()}`);

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

export function unlinkAsync(filePath: string|string[]) {
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

export function setParsedDeepLinkConfig(parsedDeepLinkConfig: HydratedDeepLinkConfigEntry[]) {
  _parsedDeepLinkConfig = parsedDeepLinkConfig;
}

export function getParsedDeepLinkConfig(): HydratedDeepLinkConfigEntry[] {
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

  if (getBooleanPropertyValue(Constants.ENV_PRINT_DEPENDENCY_TREE)) {
    printDependencyMap(dependencyMap);
  }

  return dependencyMap;
}

export function purgeWebpackPrefixFromPath(filePath: string) {
  return filePath.replace(process.env[Constants.ENV_OPTIMIZATION_LOADER], '').replace(process.env[Constants.ENV_WEBPACK_LOADER], '').replace('!', '');
}
