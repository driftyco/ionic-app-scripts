import { constants, access, readFile, } from 'fs-extra';
import { basename, dirname, extname } from 'path';
import * as ts from 'typescript';

import { inlineTemplate } from '../../template';
import { getTsConfig } from '../../transpile';

import { BuildContext } from '../../util/interfaces';

export interface CompiledOutput {
  content: string,
  outputText: string,
  sourceMapText: string,
}

export function readAndCacheOnlyBuildTargetFile(context: BuildContext, filePath: string): Promise<CompiledOutput | any> {

  return new Promise<CompiledOutput | any>((resolve, reject) => {
    const platformName = context.fileNamePattern;

    if (platformName) {

      const fileName = getFileName(filePath);
      const currentFolder = dirname(filePath);
      const hasPlatformId = fileName.includes(`.${platformName}`);

      // If file name does not includes platform name, otherwise it is platform specific component
      if (!hasPlatformId) {
        const platformComponentTsPath = `${currentFolder}/${fileName}.${platformName}.ts`;

        checkIfFileExist(platformComponentTsPath).then((exist: boolean) => {
          if (exist) {
            readFileAsync(platformComponentTsPath).then((content: string) => {
              const compiledModule = transpileAndCache(context, content, filePath);
              resolve(compiledModule);
            });
          } else {
            resolve({});
          }
        });
      } else {
        resolve({});
      }

    } else {
      resolve({})
    }
  });
}

export function getFileName(filePath: string): string {
  const extension = extname(filePath);
  return basename(filePath, extension);
}

export function transpileAndCache(context: BuildContext, content: string, tsFilePath: string): CompiledOutput {
  const compiledModule = ts.transpileModule(content, {
    compilerOptions: getTsConfig(context).options,
    fileName: getFileName(tsFilePath) + '.js',
  });
  const { outputText, sourceMapText } = compiledModule;

  const compiledText = inlineTemplate(outputText, tsFilePath);
  const jsFilePath = tsFilePath.replace('.ts', '.js');
  const mapFilePath = jsFilePath + '.map';

  context.fileCache.set(tsFilePath, { content: content, path: tsFilePath });
  context.fileCache.set(mapFilePath, { content: sourceMapText, path: mapFilePath });
  context.fileCache.set(jsFilePath, { content: compiledText, path: jsFilePath });

  return { outputText, sourceMapText, content };
}

export function checkIfFileExist(filePath: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    access(filePath, constants.R_OK | constants.W_OK, (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true);
      }
    });
  });
}

export function readFileAsync(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    readFile(filePath, 'utf-8', (err, buffer) => {
      if (err) {
        return reject(err);
      }
      return resolve(buffer);
    });
  });
}
