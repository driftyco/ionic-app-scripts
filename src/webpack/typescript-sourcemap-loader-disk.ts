import { Logger } from '../logger/logger';
import { changeExtension, readFileAsync } from '../util/helpers';

module.exports = function typescriptSourcemapLoaderDisk(source: string, map: string) {
  this.cacheable();
  var callback = this.async();

  if ( this.resourcePath.indexOf('node_modules') > -1) {
    // it's not a source file, so use the default
    callback(null, source, map);
  } else {
    // it's a src file
    loadBetterSourceMap(this.resourcePath, callback, source, map);
  }
};

function loadBetterSourceMap(javascriptFilePath: string, callback: Function, originalSource: any, originalMap: any) {
  const sourceMapPath = javascriptFilePath + '.map';
  const tsFilePath = changeExtension(javascriptFilePath, '.ts');

  let sourceMapContent: string = null;
  let typescriptFileContent: string = null;

  const readSourceMapPromise = readFileAsync(sourceMapPath);
  readSourceMapPromise.then((content: string) => {
    sourceMapContent = content;
  });

  const readTsFilePromise = readFileAsync(tsFilePath);
  readTsFilePromise.then((content: string) => {
    typescriptFileContent = content;
  });

  let promises: Promise<any>[] = [];
  promises.push(readSourceMapPromise);
  promises.push(readTsFilePromise);

  Promise.all(promises)
    .then(() => {
      if (!sourceMapContent || !sourceMapContent.length) {
        throw new Error('Failed to read sourcemap file');
      } else if (!typescriptFileContent || !typescriptFileContent.length) {
        throw new Error('Failed to read typescript file');
      } else {
        return JSON.parse(sourceMapContent);
      }
    }).then((sourceMapObject: any) => {
      if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
        Logger.debug(`loadBetterSourceMap: Assigning Typescript content to source map for ${javascriptFilePath}`);
        sourceMapObject.sourcesContent = [typescriptFileContent];
      }
      callback(null, originalSource, sourceMapObject);
    }).catch((err: Error) => {
      Logger.debug(`Failed to generate typescript sourcemaps for ${javascriptFilePath}: ${err.message}`);
      // just use the default
      callback(null, originalSource, originalMap);
    });

}
