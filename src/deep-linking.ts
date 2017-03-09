import { extname } from 'path';

import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { FileCache } from './util/file-cache';
import { getStringPropertyValue, readFileAsync, setParsedDeepLinkConfig } from './util/helpers';
import { BuildContext, ChangedFile, HydratedDeepLinkConfigEntry } from './util/interfaces';

import { getDeepLinkData } from './deep-linking/util';


export function deepLinking(context: BuildContext) {
  const logger = new Logger(`deep links`);
  return deepLinkingWorker(context).then((hydratedDeepLinkEntryList: HydratedDeepLinkConfigEntry[]) => {
      setParsedDeepLinkConfig(hydratedDeepLinkEntryList);
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}


function deepLinkingWorker(context: BuildContext) {
  /*const appModulePath = process.env[Constants.ENV_APP_NG_MODULE_PATH];
  return getAppNgModuleContent(appModulePath, context.fileCache).then((fileContent: string) => {
    return extractDeepLinkData(appModulePath, fileContent, context.runAot);
  });
  */

  //const typescriptFiles = context.fileCache.getAll().filter(file => extname(file.path) === '.ts').filter(file => file.path.indexOf('ngfactory') === -1);

  //return Promise.resolve([]);

  return Promise.resolve().then(() => {
    const deepLinkConfigEntries = getDeepLinkData(getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH), context.fileCache, context.runAot);

  });
}

function getAppNgModuleContent(filePath: string, fileCache: FileCache): Promise<string> {
  const file = fileCache.get(filePath);
  if (file) {
    return Promise.resolve(file.content);
  }
  return readFileAsync(filePath).then((fileContent: string) => {
    // cache it!
    fileCache.set(filePath, { path: filePath, content: fileContent});
    return fileContent;
  });
}

export function deepLinkingUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const appNgModuleChangedFiles = changedFiles.filter(changedFile => changedFile.filePath === process.env[Constants.ENV_APP_NG_MODULE_PATH]);
  if (appNgModuleChangedFiles.length) {
    const fileContent = context.fileCache.get(appNgModuleChangedFiles[0].filePath).content;
    const hydratedDeepLinkEntries = extractDeepLinkData(appNgModuleChangedFiles[0].filePath, fileContent, context.runAot);
    setParsedDeepLinkConfig(hydratedDeepLinkEntries);
  }
  return Promise.resolve();
}

function extractDeepLinkData(appNgModulePath: string, fileContent: string, isAot: boolean) {
  return getDeepLinkData(appNgModulePath, fileContent, isAot);
}
