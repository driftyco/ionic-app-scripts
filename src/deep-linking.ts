
import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getStringPropertyValue, setParsedDeepLinkConfig } from './util/helpers';
import { BuildContext, BuildState, ChangedFile, DeepLinkConfigEntry } from './util/interfaces';

import { convertDeepLinkConfigEntriesToString, getDeepLinkData, hasExistingDeepLinkConfig, updateAppNgModuleAndFactoryWithDeepLinkConfig } from './deep-linking/util';

/*
 * We want to cache a local, in-memory copy of the App's main NgModule file content.
 * Each time we do a build, a new DeepLinkConfig is generated and inserted into the
 * app's main NgModule. By keeping a copy of the original and using it to determine
 * if the developer had an existing config, we will get an accurate answer where
 * as the cached version of the App's main NgModule content will basically always
 * have a generated deep likn config in it.
*/
export let cachedUnmodifiedAppNgModuleFileContent: string = null;
export let cachedDeepLinkString: string = null;

export function deepLinking(context: BuildContext) {
  const logger = new Logger(`deeplinks`);
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
  return deepLinkingWorkerImpl(context, []);
}

export function deepLinkingWorkerImpl(context: BuildContext, changedFiles: ChangedFile[]) {
  return Promise.resolve().then(() => {
    const appNgModulePath = getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
    const appNgModuleFile = context.fileCache.get(appNgModulePath);
    if (!appNgModuleFile) {
      throw new Error(`The main app NgModule was not found at the following path: ${appNgModulePath}`);
    }
    if (!cachedUnmodifiedAppNgModuleFileContent || hasAppModuleChanged(changedFiles, appNgModulePath)) {
      cachedUnmodifiedAppNgModuleFileContent = appNgModuleFile.content;
    }

    // is there is an existing (legacy) deep link config, just move on and don't look for decorators
    const hasExisting = hasExistingDeepLinkConfig(appNgModulePath, cachedUnmodifiedAppNgModuleFileContent);
    if (hasExisting) {
      return [];
    }

    const deepLinkConfigEntries = getDeepLinkData(appNgModulePath, context.fileCache, context.runAot) || [];
    if (deepLinkConfigEntries.length) {
      const newDeepLinkString = convertDeepLinkConfigEntriesToString(deepLinkConfigEntries);
      // 1. this is the first time running this, so update the build either way
      // 2. we have an existing deep link string, and we have a new one, and they're different - so go ahead and update the config
      // 3. the app's main ngmodule has changed, so we need to rewrite the config
      if (!cachedDeepLinkString || newDeepLinkString !== cachedDeepLinkString || hasAppModuleChanged(changedFiles, appNgModulePath)) {
        cachedDeepLinkString = newDeepLinkString;
        updateAppNgModuleAndFactoryWithDeepLinkConfig(context, newDeepLinkString, changedFiles, context.runAot);
      }
    }
    return deepLinkConfigEntries;
  });
}

export function hasAppModuleChanged(changedFiles: ChangedFile[], appNgModulePath: string) {
  if (!changedFiles) {
    changedFiles = [];
  }
  for (const changedFile of changedFiles) {
    if (changedFile.filePath === appNgModulePath) {
      return true;
    }
  }
  return false;
}

export function deepLinkingUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  if (context.deepLinkState === BuildState.RequiresBuild) {
    return deepLinkingWorkerFullUpdate(context);
  } else {
    return deepLinkingUpdateImpl(changedFiles, context);
  }
}

export function deepLinkingUpdateImpl(changedFiles: ChangedFile[], context: BuildContext) {
  const tsFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
  if (tsFiles.length === 0) {
    return Promise.resolve();
  }
  const logger = new Logger('deeplinks update');
  return deepLinkingWorkerImpl(context, changedFiles).then((deepLinkConfigEntries: DeepLinkConfigEntry[]) => {
    setParsedDeepLinkConfig(deepLinkConfigEntries);
    logger.finish();
  }).catch((err: Error) => {
    Logger.warn(err.message);
    const error = new BuildError(err.message);
    throw logger.fail(error);
  });
}

export function deepLinkingWorkerFullUpdate(context: BuildContext) {
  const logger = new Logger(`deeplinks update`);
  // when a full build is required (when a template fails to update, etc), remove the cached deep link string to force a new one
  // to be inserted
  cachedDeepLinkString = null;
  return deepLinkingWorker(context).then((deepLinkConfigEntries: DeepLinkConfigEntry[]) => {
      setParsedDeepLinkConfig(deepLinkConfigEntries);
      logger.finish();
    })
    .catch((err: Error) => {
      Logger.warn(err.message);
      const error = new BuildError(err.message);
      throw logger.fail(error);
    });
}

// these functions are  purely for testing
export function reset() {
  cachedUnmodifiedAppNgModuleFileContent = null;
  cachedDeepLinkString = null;
}

export function setCachedDeepLinkString(input: string) {
  cachedDeepLinkString = input;
}
