import { BuildContext } from './interfaces';
import { readFile, writeFile } from 'fs-extra';
import { BuildError } from './logger';
import { basename, dirname, extname, join } from 'path';

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
