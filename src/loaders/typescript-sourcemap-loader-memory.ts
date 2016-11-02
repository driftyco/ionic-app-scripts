import { Logger } from '../util/logger';
import { changeExtension, getContext, transformTmpPathToSrcPath} from '../util/helpers';

module.exports = function typescriptSourcemapLoaderMemory(source: string, map: string) {
  this.cacheable();
  var callback = this.async();
  const context = getContext();
  const transformedPath = transformTmpPathToSrcPath(this.resourcePath, context);
  const sourceMapPath = transformedPath + '.map';
  const sourceMapFile = context.fileCache.get(sourceMapPath);

  // get the typescript source if needed
  let sourcesContent = source;
  const isSrcFile = transformedPath !== this.resourcePath;
  if (isSrcFile) {
    Logger.debug('typescriptSourcemapLoaderMemory: attempting to use .ts instead of .js for sourcemap');
    const modifiedPath = changeExtension(transformedPath, '.ts');
    const typescriptFileObject = context.fileCache.get(modifiedPath);
    if (typescriptFileObject) {
      Logger.debug('typescriptSourcemapLoaderMemory: found the .ts file in memory, using it');
      sourcesContent = typescriptFileObject.content;
    }
  }

  if ( sourceMapFile ) {
    const sourceMapObject = JSON.parse(sourceMapFile.content);
    if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
      sourceMapObject.sourcesContent = [sourcesContent];
    }
    callback(null, source, sourceMapObject);
  } else {
    callback(null, source, map);
  }
};

