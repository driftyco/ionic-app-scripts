import { basename, dirname, join, relative } from 'path';
import { emptyDirSync, mkdirpSync, writeFileSync } from 'fs-extra';

import { Logger } from './logger/logger';
import * as Constants from './util/constants';
import { getBooleanPropertyValue } from './util/helpers';
import { BuildContext } from './util/interfaces';
import { updateIndexHtml } from './core/inject-scripts';
import { purgeSourceMapsIfNeeded } from './util/source-maps';
import { removeUnusedFonts } from './optimization/remove-unused-fonts';


export function postprocess(context: BuildContext) {
  const logger = new Logger(`postprocess`);
  return postprocessWorker(context).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      throw logger.fail(err);
    });
}


function postprocessWorker(context: BuildContext) {
  const promises: Promise<any>[] = [];
  promises.push(purgeSourceMapsIfNeeded(context));
  promises.push(updateIndexHtml(context));

  if (getBooleanPropertyValue(Constants.ENV_AOT_WRITE_TO_DISK)) {
    promises.push(writeFilesToDisk(context));
  }

  if (context.optimizeJs && getBooleanPropertyValue(Constants.ENV_PURGE_UNUSED_FONTS)) {
    promises.push(removeUnusedFonts(context));
  }

  return Promise.all(promises);
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
  return Promise.resolve();
}
