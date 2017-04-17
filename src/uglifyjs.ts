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
    .catch((err: BuildError) => {
      throw logger.fail(new BuildError(err));
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
    const jsFilePaths = context.bundledFilePaths.filter(bundledFilePath => bundledFilePath.endsWith('.js'));
    const promises: Promise<any>[] = [];
    jsFilePaths.forEach(bundleFilePath => {
      uglifyJsConfig.sourceFile = bundleFilePath;
      uglifyJsConfig.inSourceMap = bundleFilePath + '.map';
      uglifyJsConfig.destFileName = bundleFilePath;
      uglifyJsConfig.outSourceMap = bundleFilePath + '.map';

      const minifyOutput: uglify.MinifyOutput = runUglifyInternal(uglifyJsConfig);
      promises.push(writeFileAsync(uglifyJsConfig.destFileName, minifyOutput.code.toString()));
      if (minifyOutput.map) {
        promises.push(writeFileAsync(uglifyJsConfig.outSourceMap, minifyOutput.map.toString()));
      }
    });
    return Promise.all(promises);
  }).catch((err: any) => {
    // uglify has it's own strange error format
    const errorString = `${err.message} in ${err.filename} at line ${err.line}, col ${err.col}, pos ${err.pos}`;
    throw new BuildError(new Error(errorString));
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
