import { join } from 'path';
import * as uglify from 'uglify-js';

import { Logger } from './logger/logger';
import { readdirSync, writeFileSync } from 'fs';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { BuildError } from './util/errors';
import { BuildContext, TaskInfo } from './util/interfaces';
import { runWorker } from './worker-client';



export function uglifyjs(context: BuildContext, configFile?: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('uglifyjs');

  return runWorker('uglifyjs', 'uglifyjsWorker', context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function uglifyjsWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // provide a full path for the config options
      context = generateContext(context);
      const files = readdirSync(context.buildDir);

      files.forEach((file) => {
        if (file.indexOf('deptree') === -1 && file.indexOf('map') === -1 && file.indexOf('sw-toolbox') === -1 && file.indexOf('polyfills') === -1) {
          const uglifyJsConfig: UglifyJsConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
          uglifyJsConfig.sourceFile = join(context.buildDir, uglifyJsConfig.sourceFile);
          uglifyJsConfig.inSourceMap = join(context.buildDir, uglifyJsConfig.inSourceMap);
          uglifyJsConfig.destFileName = join(context.buildDir, uglifyJsConfig.destFileName);

          const minifiedOutputPath = join(context.buildDir, uglifyJsConfig.outSourceMap);
          const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);


          writeFileSync(uglifyJsConfig.destFileName, minifyOutput.code);
          writeFileSync(minifiedOutputPath, minifyOutput.map);

          resolve();
        }
      });

    } catch (e) {
      reject(new BuildError(e));
    }
  });
}


function runUglifyInternal(uglifyJsConfig: UglifyJsConfig): uglify.MinifyOutput {
  return uglify.minify(uglifyJsConfig.sourceFile, {
    compress: uglifyJsConfig.compress,
    mangle: uglifyJsConfig.mangle,
    inSourceMap : uglifyJsConfig.inSourceMap,
    outSourceMap: uglifyJsConfig.outSourceMap
  });
}


export const taskInfo: TaskInfo = {
  fullArg: '--uglifyjs',
  shortArg: '-u',
  envVar: 'IONIC_UGLIFYJS',
  packageConfig: 'ionic_uglifyjs',
  defaultConfigFile: 'uglifyjs.config'
};


export interface UglifyJsConfig {
  // https://www.npmjs.com/package/uglify-js
  sourceFile: string;
  destFileName: string;
  inSourceMap: string;
  outSourceMap: string;
  mangle: boolean;
  compress: boolean;
  comments: boolean;
}
