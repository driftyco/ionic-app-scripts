import { changeExtension, getContext} from '../util/helpers';

module.exports = function typescriptSourcemapLoaderMemory(source: string, map: any) {
  this.cacheable();
  var callback = this.async();
  const context = getContext();

  const javascriptPath = changeExtension(this.resourcePath, '.js');
  const javascriptFile = context.fileCache.get(javascriptPath);
  const sourceMapPath = javascriptPath + '.map';
  const sourceMapFile = context.fileCache.get(sourceMapPath);

  let sourceMapObject = map;
  if (sourceMapFile) {
    sourceMapObject = JSON.parse(sourceMapFile.content);
    if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
      sourceMapObject.sourcesContent = [source];
    }
  }

  callback(null, javascriptFile.content, sourceMapObject);
};

