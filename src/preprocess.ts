import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { readFileAsync, setParsedDeepLinkConfig } from './util/helpers';
import { BuildContext, ChangedFile, HydratedDeepLinkConfigEntry } from './util/interfaces';

import { getDeepLinkData } from './deep-linking/util';


export function preprocess(context: BuildContext) {
  const logger = new Logger(`preprocess`);
  return preprocessWorker(context)
    .then((hydratedDeepLinkEntryList: HydratedDeepLinkConfigEntry[]) => {
      setParsedDeepLinkConfig(hydratedDeepLinkEntryList);
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}


function preprocessWorker(context: BuildContext) {
  const appModulePath = process.env[Constants.ENV_APP_NG_MODULE_PATH];
  return readFileAsync(appModulePath)
    .then((fileContent: string) => {
      return extractDeepLinkData(appModulePath, fileContent, context.runAot);
    });
}

export function preprocessUpdate(changedFiles: ChangedFile[], context: BuildContext) {
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
