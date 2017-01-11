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
  return readFileAsync(context.appModulePath)
    .then((fileContent: string) => {
      console.log('context.appModulePath: ', context.appModulePath);
      console.log('fileContent: ', fileContent);
      return extractDeepLinkData(context.appModulePath, fileContent);
    });
}

function extractDeepLinkData(appNgModulePath: string, fileContent: string) {
  return getDeepLinkData(appNgModulePath, fileContent);
}