import { BuildContext } from './interfaces';
import { outputJson, readFile, readJsonSync, writeFile } from 'fs-extra';
import { BuildError, Logger } from './logger';
import { basename, dirname, extname, join } from 'path';
import { tmpdir } from 'os';

let _context: BuildContext;

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


export function endsWith(str: string, tail: string) {
  if (str && tail) {
    return !tail.length || str.slice(-tail.length).toLowerCase() === tail.toLowerCase();
  }
  return false;
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

export function setModulePathsCache(modulePaths: string[]) {
  // async save the module paths for later lookup
  const modulesCachePath = getModulesPathsCachePath();

  Logger.debug(`Cached module paths: ${modulePaths && modulePaths.length}, ${modulesCachePath}`);

  outputJson(modulesCachePath, modulePaths, (err) => {
    if (err) {
      Logger.error(`Error writing module paths cache: ${err}`);
    }
  });
}


export function getModulesPathsCachePath(): string {
  // make a unique tmp directory for this project's module paths cache file
  let cwd = process.cwd().replace(/-|:|\/|\\|\.|~|;|\s/g, '').toLowerCase();
  if (cwd.length > 40) {
    cwd = cwd.substr(cwd.length - 40);
  }
  return join(tmpdir(), cwd, 'modulepaths.json');
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