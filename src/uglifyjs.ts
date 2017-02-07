import { join } from 'path';
import * as uglify from 'uglify-js';

import { Logger } from './logger/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { BuildError } from './util/errors';
import { writeFileAsync } from './util/helpers';
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
      const uglifyJsConfig: UglifyJsConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
      uglifyJsConfig.sourceFile = join(context.buildDir, uglifyJsConfig.sourceFile);
      uglifyJsConfig.inSourceMap = join(context.buildDir, uglifyJsConfig.inSourceMap);
      uglifyJsConfig.destFileName = join(context.buildDir, uglifyJsConfig.destFileName);

      const minifiedOutputPath = join(context.buildDir, uglifyJsConfig.outSourceMap);
      const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);

      const writeFilePromises = [
        writeFileAsync(uglifyJsConfig.destFileName, minifyOutput.code),
        writeFileAsync(minifiedOutputPath, minifyOutput.map)
      ];

      return Promise.all(writeFilePromises).then(() => {
        resolve();
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
