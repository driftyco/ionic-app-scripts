import { BuildContext } from './interfaces';
import { readFile, readJsonSync, writeFile } from 'fs-extra';
import { BuildError } from './logger';
import { basename, dirname, extname, join } from 'path';
import * as osName from 'os-name';

let _context: BuildContext;



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


export function writeFileAsync(filePath: string, content: string): Promise<any> {
  return new Promise((resolve, reject) => {
    writeFile(filePath, content, (err) => {
      if (err) {
        reject(new BuildError(err));
      } else {
        resolve();
      }
    });
  });
}


export function readFileAsync(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(filePath, 'utf-8', (err, buffer) => {
      if (err) {
        reject(new BuildError(err));
      } else {
        resolve(buffer);
      }
    });
  });
}

export function setContext(context: BuildContext) {
  _context = context;
}

export function getContext() {
  return _context;
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
