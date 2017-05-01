import { emptyDirSync, mkdirpSync, writeFileSync } from 'fs-extra';
import { basename, dirname, join, relative } from 'path';

import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getBooleanPropertyValue } from './util/helpers';
import { BuildContext, ChangedFile } from './util/interfaces';
import { optimization } from './optimization';
import { deepLinking, deepLinkingUpdate } from './deep-linking';

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
  const deepLinksPromise = getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS) ? deepLinking(context) : Promise.resolve();
  return deepLinksPromise
    .then(() => {
      if (context.optimizeJs) {
        return optimization(context, null);
      }
    }).then(() => {
      if (getBooleanPropertyValue(Constants.ENV_AOT_WRITE_TO_DISK)) {
        writeFilesToDisk(context);
      }
    });
}

export function writeFilesToDisk(context: BuildContext) {
  emptyDirSync(context.tmpDir);
  const files = context.fileCache.getAll();
  files.forEach(file => {
    const dirName = dirname(file.path);
    const relativePath = relative(process.cwd(), dirName);
    const tmpPath = join(context.tmpDir, relativePath);
    const fileName = basename(file.path);
    const fileToWrite = join(tmpPath, fileName);
    mkdirpSync(tmpPath);
    writeFileSync(fileToWrite, file.content);
  });

}

export function preprocessUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  if (getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS)) {
    return deepLinkingUpdate(changedFiles, context);
  }
  return Promise.resolve();
}
