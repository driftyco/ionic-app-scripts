import { readdirSync } from 'fs';
import { extname, join } from 'path';

import * as uglify from 'uglify-js';

import { Logger } from './logger/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
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
  const uglifyJsConfig: UglifyJsConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  if (!context) {
    context = generateContext(context);
  }
  return uglifyjsWorkerImpl(context, uglifyJsConfig);
}

export function uglifyjsWorkerImpl(context: BuildContext, uglifyJsConfig: UglifyJsConfig) {
  return Promise.resolve().then(() => {
    // provide a full path for the config options
    const files = readdirSync(context.buildDir);
    const promises: Promise<any>[] = [];
    for (const file of files) {
      if (extname(file) === '.js' && file.indexOf('polyfills') === -1 && file.indexOf('sw-toolbox') === -1 && file.indexOf('.map') === -1) {
        uglifyJsConfig.sourceFile = join(context.buildDir, file);
        uglifyJsConfig.inSourceMap = join(context.buildDir, file + '.map');
        uglifyJsConfig.destFileName = join(context.buildDir, file);
        uglifyJsConfig.outSourceMap = join(context.buildDir, file + '.map');

        const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);

        promises.push(writeFileAsync(uglifyJsConfig.destFileName, minifyOutput.code.toString()));
        promises.push(writeFileAsync(uglifyJsConfig.outSourceMap, minifyOutput.map.toString()));
      }
    }

    return Promise.all(promises);
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
  sourceFile?: string;
  destFileName?: string;
  inSourceMap?: string;
  outSourceMap?: string;
  mangle?: boolean;
  compress?: boolean;
  comments?: boolean;
}
