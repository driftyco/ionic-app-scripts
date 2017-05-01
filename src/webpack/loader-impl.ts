import { normalize, resolve } from 'path';
import { changeExtension, getContext, readAndCacheFile} from '../util/helpers';
import { Logger } from '../logger/logger';
import { FileCache } from '../util/file-cache';

export function webpackLoader(source: string, map: any, webpackContex: any) {
  webpackContex.cacheable();
  var callback = webpackContex.async();
  const context = getContext();

  const absolutePath = resolve(normalize(webpackContex.resourcePath));
  Logger.debug(`[Webpack] webpackLoader: processing the following file: ${absolutePath}`);
  const javascriptPath = changeExtension(absolutePath, '.js');
  const sourceMapPath = javascriptPath + '.map';

  Promise.all([
    readFile(context.fileCache, javascriptPath),
    readFile(context.fileCache, sourceMapPath)
  ]).then(([javascriptFile, mapFile]) => {
    let sourceMapObject = map;
    if (mapFile) {
      try {
        sourceMapObject = JSON.parse(mapFile.content);

      } catch (ex) {
        Logger.debug(`[Webpack] loader: Attempted to parse the JSON sourcemap for ${mapFile.path} and failed -
          using the original, webpack provided source map`);
      }
      if (sourceMapObject) {
        sourceMapObject.sources = [absolutePath];
        if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
          sourceMapObject.sourcesContent = [source];
        }
      }
    }
    callback(null, javascriptFile.content, sourceMapObject);
  }).catch(err => {
    Logger.debug(`[Webpack] loader: Encountered an unexpected error: ${err.message}`);
    callback(err);
  });
}

function readFile(fileCache: FileCache, filePath: string) {
  return readAndCacheFile(filePath).then((fileContent: string) => {
    Logger.debug(`[Webpack] loader: Loaded ${filePath} successfully from disk`);
    return fileCache.get(filePath);
  }).catch(err => {
    Logger.debug(`[Webpack] loader: Failed to load ${filePath} from disk`);
    throw err;
  });
}
