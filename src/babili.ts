import { join } from 'path';
import { spawn } from 'child_process';
//import { spawn } from 'cross-spawn';

import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { BuildContext, TaskInfo } from './util/interfaces';
import { Logger } from './logger/logger';
import { runWorker } from './worker-client';
import { writeFileAsync } from './util/helpers';

export function babili(context: BuildContext, configFile?: string) {

  configFile = getUserConfigFile(context, taskInfo, configFile);
  const logger = new Logger('babili - experimental');

  //return runWorker('babili', 'babiliWorker', context, configFile)
    return babiliWorker(context, configFile).then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function babiliWorker(context: BuildContext, configFile: string): Promise<any> {
  context = generateContext(context);
  const babiliConfig: BabiliConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  // TODO - figure out source maps??
  return runBabili(context, babiliConfig).then((minifiedCode: string) => {
    // write the file back to disk
    const fileToWrite = join(context.buildDir, babiliConfig.destFileName);
    return writeFileAsync(fileToWrite, minifiedCode);
  });
}

function runBabili(context: BuildContext, config: BabiliConfig) {
  const babiliPath = join(context.rootDir, 'node_modules', '.bin', 'babili');
  const bundlePath = join(context.buildDir, config.sourceFile);
  return runBabiliImpl(babiliPath, bundlePath);
}

function runBabiliImpl(pathToBabili: string, pathToBundle: string) {
  // TODO - is there a better way to run this?
  let toReturn: string = '';
  return new Promise((resolve, reject) => {
    const command = spawn(pathToBabili, [pathToBundle]);
    command.stdout.on('data', (buffer: Buffer) => {
      const stringRepresentation = buffer.toString();
      Logger.debug(`[Babili] ${stringRepresentation}`);
      toReturn = `${toReturn} + ${stringRepresentation}`;
    });

    command.stderr.on('data', (buffer: Buffer) => {
      Logger.warn(`[Babili] ${buffer.toString()}`);
    });

    command.on('close', (code: number) => {
      if (code === 0 && !toReturn) {
        return reject(new Error('An Unknown error occurred while running babili'));
      } else if ( code !== 0) {
        return reject(new Error('Babili failed with a non-zero status code'));
      }
      return resolve(toReturn);
    });


    /*exec(`${pathToBabili} ${pathToBundle}`, (err: Error, stdout: string, stderr: string) => {
      console.log('err: ', err.message);
      console.log('stdout: ', stdout);
      console.log('stderr: ', stderr);
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
    */
  });
}

export const taskInfo: TaskInfo = {
  fullArg: '--babili',
  shortArg: null,
  envVar: 'IONIC_EXP_BABILI',
  packageConfig: 'ionic_exp_babili',
  defaultConfigFile: 'babili.config'
};


export interface BabiliConfig {
  // https://www.npmjs.com/package/uglify-js
  sourceFile: string;
  destFileName: string;
}
