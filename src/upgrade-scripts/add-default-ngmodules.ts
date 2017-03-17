import { writeFileSync } from 'fs';
import { join } from 'path';

import { generateDefaultDeepLinkNgModuleContent, getDeepLinkDecoratorContentForSourceFile, getNgModulePathFromCorrespondingPage } from '../deep-linking/util';
import { generateContext } from '../util/config';
import * as Constants from '../util/constants';
import { FileCache } from '../util/file-cache';
import { globAll, GlobResult } from '../util/glob-util';
import { changeExtension, getStringPropertyValue, readFileAsync } from '../util/helpers';
import { BuildContext, File } from '../util/interfaces';

import { getTypescriptSourceFile } from '../util/typescript-utils';

export function getTsFilePaths(context: BuildContext) {
  const tsFileGlobString = join(context.srcDir, '**', '*.ts');
  return globAll([tsFileGlobString]).then((results: GlobResult[]) => {
    return results.map(result => result.absolutePath);
  });
}

export function readTsFiles(context: BuildContext, tsFilePaths: string[]) {
  const promises = tsFilePaths.map(tsFilePath => {
    const promise = readFileAsync(tsFilePath);
    promise.then((fileContent: string) => {
      context.fileCache.set(tsFilePath, { path: tsFilePath, content: fileContent});
    });
    return promise;
  });
  return Promise.all(promises);
}

export function generateAndWriteNgModules(fileCache: FileCache) {
  fileCache.getAll().forEach(file => {
    const sourceFile = getTypescriptSourceFile(file.path, file.content);
    const deepLinkDecoratorData = getDeepLinkDecoratorContentForSourceFile(sourceFile);
    if (deepLinkDecoratorData) {
      // we have a valid DeepLink decorator
      const correspondingNgModulePath = getNgModulePathFromCorrespondingPage(file.path);
      const ngModuleFile = fileCache.get(correspondingNgModulePath);
      if (!ngModuleFile) {
        // the ngModule file does not exist, so go ahead and create a default one
        const defaultNgModuleContent = generateDefaultDeepLinkNgModuleContent(file.path, deepLinkDecoratorData.className);
        const ngModuleFilePath = changeExtension(file.path, getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX));
        writeFileSync(ngModuleFilePath, defaultNgModuleContent);
      }
    }
  });
}

function run() {
  const context = generateContext();

  // find out what files to read
  return getTsFilePaths(context).then((filePaths: string[]) => {
    // read the files
    return readTsFiles(context, filePaths);
  }).then(() => {
    generateAndWriteNgModules(context.fileCache);
  });
}

run();
