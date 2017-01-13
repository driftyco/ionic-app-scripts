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
      return extractDeepLinkData(appModulePath, fileContent);
    });
}

function extractDeepLinkData(appNgModulePath: string, fileContent: string) {
  return getDeepLinkData(appNgModulePath, fileContent);
}