import { extname } from 'path';

import { scanSrcTsFiles } from './build/util';
import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getParsedDeepLinkConfig, getStringPropertyValue, readAndCacheFile, setParsedDeepLinkConfig } from './util/helpers';
import { BuildContext, BuildState, ChangedFile, DeepLinkConfigEntry } from './util/interfaces';

import {
  convertDeepLinkConfigEntriesToString,
  getDeepLinkData,
  hasExistingDeepLinkConfig
} from './deep-linking/util';

export let existingDeepLinkConfigString: string = null;

export function setExistingDeepLinkConfig(newString: string) {
  existingDeepLinkConfigString = newString;
}

export function deepLinking(context: BuildContext) {
  const logger = new Logger(`deeplinks`);

  return deepLinkingWorker(context).then((map: Map<string, DeepLinkConfigEntry>) => {
    setParsedDeepLinkConfig(map);
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

export async function deepLinkingWorkerImpl(context: BuildContext, changedFiles: ChangedFile[]): Promise<Map<string, DeepLinkConfigEntry>> {

  // get the app.module.ts content from ideally the cache, but fall back to disk if needed
  const appNgModulePath = getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
  const appNgModuleFileContent = await getAppMainNgModuleFile(appNgModulePath);

  // is there is an existing (legacy) deep link config, just move on and don't look for decorators
  const hasExisting = hasExistingDeepLinkConfig(appNgModulePath, appNgModuleFileContent);
  if (hasExisting) {
    return new Map<string, DeepLinkConfigEntry>();
  }

  // okay cool, we need to get the data from each file
  const results = getDeepLinkData(appNgModulePath, context.fileCache, context.runAot) || new Map<string, DeepLinkConfigEntry>();

  const newDeepLinkString = convertDeepLinkConfigEntriesToString(results);
  if (!existingDeepLinkConfigString || newDeepLinkString !== existingDeepLinkConfigString || hasAppModuleChanged(changedFiles, appNgModulePath)) {

    existingDeepLinkConfigString = newDeepLinkString;

    if (changedFiles) {
      changedFiles.push({
        event: 'change',
        filePath: appNgModulePath,
        ext: extname(appNgModulePath).toLowerCase()
      });
    }
  }

  return results;
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
  return deepLinkingWorkerImpl(context, changedFiles).then((map: Map<string, DeepLinkConfigEntry>) => {
    // okay, now that the existing config is updated, go ahead and reset it
    setParsedDeepLinkConfig(map);
    logger.finish();
  }).catch((err: Error) => {
    Logger.warn(err.message);
    const error = new BuildError(err.message);
    throw logger.fail(error);
  });
}

export function deepLinkingWorkerFullUpdate(context: BuildContext) {
  const logger = new Logger(`deeplinks update`);
  return deepLinkingWorker(context).then((map: Map<string, DeepLinkConfigEntry>) => {
    setParsedDeepLinkConfig(map);
    logger.finish();
  })
  .catch((err: Error) => {
    Logger.warn(err.message);
    const error = new BuildError(err.message);
    throw logger.fail(error);
  });
}

export async function getAppMainNgModuleFile(appNgModulePath: string) {
  try {
    return await readAndCacheFile(appNgModulePath);
  } catch (ex) {
    throw new Error(`The main app NgModule was not found at the following path: ${appNgModulePath}`);
  }
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
