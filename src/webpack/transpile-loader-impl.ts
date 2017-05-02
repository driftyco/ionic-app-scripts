import { normalize, resolve } from 'path';

import { Logger } from '../logger/logger';
import { transpileTsString } from '../transpile';
import * as Constants from '../util/constants';
import { getBooleanPropertyValue, getContext, isSrcOrIonicOrIonicDeps } from '../util/helpers';

export function transpileLoader(source: string, map: any, webpackContex: any) {
  const callback = webpackContex.async();
  webpackContex.cacheable();
  try {
    const context = getContext();
    const absolutePath = resolve(normalize(webpackContex.resourcePath));
    Logger.debug(`[Webpack] transpileLoader: processing the following file: ${absolutePath}`);

    // we only really care about transpiling stuff that is not ionic-angular, angular, rxjs, or the users app
    // so third party deps that may be es2015 or something
    if (! isSrcOrIonicOrIonicDeps(absolutePath) && context.isProd && getBooleanPropertyValue(Constants.ENV_BUILD_TO_ES5)) {
      const transpiledOutput = transpileTsString(context, absolutePath, source);
      const sourceMapObject = JSON.parse(transpiledOutput.sourceMapText);
      return callback(null, transpiledOutput.outputText, sourceMapObject);
    }
    return callback(null, source, map);
  } catch (ex) {
    callback(ex);
  }
}
