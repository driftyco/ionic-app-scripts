import * as Uglify from 'uglify-es';

import { Logger } from './logger/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { BuildError } from './util/errors';
import { readFileAsync, writeFileAsync } from './util/helpers';
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

export async function uglifyjsWorkerImpl(context: BuildContext, uglifyJsConfig: UglifyJsConfig) {
  try {
    const jsFilePaths = context.bundledFilePaths.filter(bundledFilePath => bundledFilePath.endsWith('.js'));
    const promises = jsFilePaths.map(filePath => {
      const sourceMapPath = filePath + '.map';
      return runUglifyInternal(filePath, filePath, sourceMapPath, sourceMapPath, uglifyJsConfig);
    });
    return await Promise.all(promises);
  } catch (ex) {
    // uglify has it's own strange error format
    const errorString = `${ex.message} in ${ex.filename} at line ${ex.line}, col ${ex.col}, pos ${ex.pos}`;
    throw new BuildError(new Error(errorString));
  }
}

async function runUglifyInternal(sourceFilePath: string, destFilePath: string, sourceMapPath: string, destMapPath: string, configObject: any): Promise<any> {
  const sourceFileContentPromise = readFileAsync(sourceFilePath);
  const [sourceFileContent, sourceMapContent] = await Promise.all([readFileAsync(sourceFilePath), readFileAsync(sourceMapPath)]);
  const uglifyConfig = Object.assign({}, configObject, {
    sourceMap: {
        content: sourceMapContent
    }
  });
  const result = Uglify.minify(sourceFileContent, uglifyConfig) as any;
  if (result.error) {
    throw new BuildError(`Uglify failed: ${result.error.message}`);
  }
  return Promise.all([writeFileAsync(destFilePath, result.code), writeFileAsync(destMapPath, result.map)]);
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

export interface UglifyResponse {
  code?: string;
  map?: any;
}
