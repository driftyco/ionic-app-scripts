import { extname, normalize, resolve } from 'path';
import { changeExtension, getContext, isSrcOrIonicOrIonicDeps } from '../util/helpers';
import { Logger } from '../logger/logger';

/* This loader is purely for caching stuff */

export function optimizationLoader(source: string, map: any, webpackContex: any) {
  const context = getContext();
  var callback = webpackContex.async();

  const absolutePath = resolve(normalize(webpackContex.resourcePath));
  if (extname(absolutePath) === '.ts') {
    const jsFilePath = changeExtension(absolutePath, '.js');
    const jsFile = context.fileCache.get(jsFilePath);
    source = jsFile.content;
  }

  Logger.debug(`[Webpack] optimization: processing the following file: ${absolutePath}`);

  if (isSrcOrIonicOrIonicDeps(absolutePath)) {
    Logger.debug(`[Webpack] optimization: Caching the following file: ${absolutePath}`);
    context.fileCache.set(webpackContex.resourcePath, { path: webpackContex.resourcePath, content: source});
  }
  return callback(null, source, map);
}
