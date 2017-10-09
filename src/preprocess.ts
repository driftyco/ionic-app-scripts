import { join } from 'path';

import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { GlobResult, globAll } from './util/glob-util';
import { getBooleanPropertyValue, getStringPropertyValue } from './util/helpers';
import { BuildContext, ChangedFile } from './util/interfaces';
import { bundleCoreComponents } from './core/bundle-components';


export function preprocess(context: BuildContext) {
  const logger = new Logger(`preprocess`);
  return preprocessWorker(context).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}

function preprocessWorker(context: BuildContext) {
  const bundlePromise = bundleCoreComponents(context);

  return Promise.all([bundlePromise]);
}

export function preprocessUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const promises: Promise<any>[] = [];

  if (changedFiles.some(cf => cf.ext === '.scss')) {
    promises.push(bundleCoreComponents(context));
  }

  return Promise.all(promises);
}
