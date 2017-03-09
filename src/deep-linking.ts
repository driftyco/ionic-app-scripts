
import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getStringPropertyValue, setParsedDeepLinkConfig } from './util/helpers';
import { BuildContext, ChangedFile, DeepLinkConfigEntry } from './util/interfaces';

import { convertDeepLinkConfigEntriesToString, getDeepLinkData, hasExistingDeepLinkConfig, updateAppNgModuleAndFactoryWithDeepLinkConfig } from './deep-linking/util';


export function deepLinking(context: BuildContext) {
  const logger = new Logger(`deep links`);
  return deepLinkingWorker(context).then((deepLinkConfigEntries: DeepLinkConfigEntry[]) => {
      setParsedDeepLinkConfig(deepLinkConfigEntries);
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}


function deepLinkingWorker(context: BuildContext) {
  return Promise.resolve().then(() => {
    const appNgModulePath = getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
    const appNgModuleFile = context.fileCache.get(appNgModulePath);
    console.log('Getting deep link config entries');
    const deepLinkConfigEntries = getDeepLinkData(appNgModulePath, context.fileCache, context.runAot);
    console.log('Checking for existing deep link config');
    const hasExisting = hasExistingDeepLinkConfig(appNgModulePath, appNgModuleFile.content);
    if (!hasExisting) {
      // only update the app's main ngModule if there isn't an existing config
      console.log('Converting deep link config to string');
      const deepLinkString = convertDeepLinkConfigEntriesToString(deepLinkConfigEntries);
      console.log('Updating App module and factory');
      updateAppNgModuleAndFactoryWithDeepLinkConfig(context, deepLinkString);
    }
    console.log('DONE');
    return deepLinkConfigEntries;
  });
}



export function deepLinkingUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  /*const appNgModuleChangedFiles = changedFiles.filter(changedFile => changedFile.filePath === process.env[Constants.ENV_APP_NG_MODULE_PATH]);
  if (appNgModuleChangedFiles.length) {
    const fileContent = context.fileCache.get(appNgModuleChangedFiles[0].filePath).content;
    const hydratedDeepLinkEntries = extractDeepLinkData(appNgModuleChangedFiles[0].filePath, fileContent, context.runAot);
    setParsedDeepLinkConfig(hydratedDeepLinkEntries);
  }
  return Promise.resolve();
  */
  return Promise.resolve();
}

