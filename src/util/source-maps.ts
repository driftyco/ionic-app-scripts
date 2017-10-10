import { join, relative, basename } from 'path';
import { ensureDir, mkdirpSync } from 'fs-extra';
import * as Constants from './constants';
import { copyFileAsync, getBooleanPropertyValue, mkDirpAsync, readDirAsync, unlinkAsync } from './helpers';
import { BuildContext } from './interfaces';

export async function copySourcemaps(context: BuildContext, shouldPurge: boolean) {
  const copyBeforePurge = getBooleanPropertyValue(Constants.ENV_VAR_MOVE_SOURCE_MAPS);
  if (copyBeforePurge) {
    await mkDirpAsync(context.sourcemapDir);
  }

  const fileNames = await readDirAsync(context.buildDir);

  // only include js source maps
  const sourceMaps = fileNames.filter(fileName => fileName.endsWith('.map'));

  const toCopy = sourceMaps.filter(fileName => fileName.indexOf('vendor.js') < 0 && fileName.endsWith('.js.map'));
  const toCopyFullPaths = toCopy.map(fileName => join(context.buildDir, fileName));

  const toPurge = sourceMaps.map(sourceMap => join(context.buildDir, sourceMap));

  const copyFilePromises: Promise<any>[] = [];
  if (copyBeforePurge) {
    for (const fullPath of toCopyFullPaths) {
      const fileName = basename(fullPath);
      copyFilePromises.push(copyFileAsync(fullPath, join(context.sourcemapDir, fileName)));
    }
  }

  await Promise.all(copyFilePromises);

  // okay cool, all of the files have been copied over, so go ahead and blow them all away
  const purgeFilePromises: Promise<any>[] = [];
  if (shouldPurge) {
    for (const fullPath of toPurge) {
      purgeFilePromises.push(unlinkAsync(fullPath));
    }
  }

  return await Promise.all(purgeFilePromises);
}

export function purgeSourceMapsIfNeeded(context: BuildContext): Promise<any> {
  if (getBooleanPropertyValue(Constants.ENV_VAR_GENERATE_SOURCE_MAP)) {
    // keep the source maps and just return
    return copySourcemaps(context, false);
  }
  return copySourcemaps(context, true);
}
