import { normalize, resolve } from 'path';
import * as Constants from '../util/constants';
import { changeExtension, getBooleanPropertyValue, getContext, readAndCacheFile} from '../util/helpers';
import { Logger } from '../logger/logger';
import { FileCache } from '../util/file-cache';

export function cacheLoader(source: string, map: any, webpackContex: any) {
  webpackContex.cacheable();
  const callback = webpackContex.async();
  try {
    const context = getContext();

    if (getBooleanPropertyValue(Constants.ENV_AOT_WRITE_TO_DISK)) {
      const jsPath = changeExtension(resolve(normalize(webpackContex.resourcePath)), '.js');
      const newSourceFile = { path: jsPath, content: source};
      context.fileCache.set(jsPath, newSourceFile);

      const mapPath = changeExtension(jsPath, '.js.map');
      const newMapFile = { path: mapPath, content: JSON.stringify(map)};
      context.fileCache.set(mapPath, newMapFile);
    }
    callback(null, source, map);
  } catch (ex) {
    callback(ex);
  }
}
