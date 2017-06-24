import { join } from 'path';
import { spawn } from 'cross-spawn';

import { fillConfigDefaults, getUserConfigFile } from './util/config';
import { BuildContext, TaskInfo } from './util/interfaces';
import { Logger } from './logger/logger';

export function babili(context: BuildContext, configFile?: string) {

  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('babili - experimental');

  return babiliWorker(context, configFile).then(() => {
    logger.finish();
  })
  .catch(err => {
    return logger.fail(err);
  });
}


export function babiliWorker(context: BuildContext, configFile: string) {
  fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  // TODO - figure out source maps??
  return runBabili(context);
}

export function runBabili(context: BuildContext) {
  // TODO - is there a better way to run this?
  return new Promise((resolve, reject) => {
    if (!context.nodeModulesDir) {
      return reject(new Error('Babili failed because the context passed did not have a rootDir'));
    }
    const babiliPath = join(context.nodeModulesDir, '.bin', 'babili');
    const command = spawn(babiliPath, [context.buildDir, '--out-dir', context.buildDir]);
    command.on('close', (code: number) => {
      if (code !== 0) {
        return reject(new Error('Babili failed with a non-zero status code'));
      }
      return resolve();
    });
  });
}

export const taskInfo: TaskInfo = {
  fullArg: '--babili',
  shortArg: null,
  envVar: 'IONIC_USE_EXPERIMENTAL_BABILI',
  packageConfig: 'ionic_use_experimental_babili',
  defaultConfigFile: 'babili.config'
};


export interface BabiliConfig {
  // https://www.npmjs.com/package/uglify-js
  sourceFile: string;
  destFileName: string;
}
