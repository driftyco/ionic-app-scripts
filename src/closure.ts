import { join } from 'path';
import { spawn } from 'cross-spawn';

import * as Constants from './util/constants';
import { copyFileAsync, getBooleanPropertyValue, generateRandomHexString, unlinkAsync } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { Logger } from './logger/logger';
import { runWorker } from './worker-client';


export function closure(context: BuildContext, configFile?: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('closure');

  return runWorker('closure', 'closureWorker', context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      console.log('err: ', err);
      throw logger.fail(err);
    });
}

export function closureWorker(context: BuildContext, configFile: string): Promise<any> {
  context = generateContext(context);
  const tempFileName = generateRandomHexString(10) + '.js';
  const tempFilePath = join(context.buildDir, tempFileName);
  const closureConfig = getClosureConfig(context, configFile);
  const bundleFilePath = join(context.buildDir, process.env[Constants.ENV_OUTPUT_JS_FILE_NAME]);
  return runClosure(closureConfig, bundleFilePath, tempFilePath, context.buildDir, closureConfig.debug)
  .then(() => {
    const promises: Promise<any>[] = [];
    promises.push(copyFileAsync(tempFilePath, bundleFilePath));
    promises.push(copyFileAsync(tempFilePath + '.map', bundleFilePath + '.map'));
    return Promise.all(promises);
  }).then(() => {
    // delete the temp bundle either way
    const promises: Promise<any>[] = [];
    promises.push(unlinkAsync(tempFilePath));
    promises.push(unlinkAsync(tempFilePath + '.map'));
    return Promise.all(promises);
  }).catch(err => {
    // delete the temp bundle either way
    unlinkAsync(tempFilePath);
    unlinkAsync(tempFilePath + '.map');
    throw err;
  });
}

function checkIfJavaIsAvailable(closureConfig: ClosureConfig) {
  return new Promise((resolve, reject) => {
    const command = spawn(`${closureConfig.pathToJavaExecutable}`, ['-version']);

     command.stdout.on('data', (buffer: Buffer) => {
      Logger.debug(`[Closure]: ${buffer.toString()}`);
    });

    command.stderr.on('data', (buffer: Buffer) => {
      Logger.warn(`[Closure]: ${buffer.toString()}`);
    });

    command.on('close', (code: number) => {
      if (code === 0) {
        return resolve();
      }
      reject();
    });
  });
}

function runClosure(closureConfig: ClosureConfig, nonMinifiedBundlePath: string, minifiedBundleFileName: string, outputDir: string, isDebug: boolean) {
  return new Promise((resolve, reject) => {
    const closureArgs = ['-jar', `${closureConfig.pathToClosureJar}`,
                        '--js', `${nonMinifiedBundlePath}`,
                        '--js_output_file', `${minifiedBundleFileName}`,
                        `--language_out=${closureConfig.languageOut}`,
                        '--language_in', `${closureConfig.languageIn}`,
                        '--compilation_level', `${closureConfig.optimization}`,
                        `--create_source_map=%outname%.map`,
                        `--variable_renaming_report=${outputDir}/variable_renaming_report`,
                        `--property_renaming_report=${outputDir}/property_renaming_report`,
                        `--rewrite_polyfills=false`,
                      ];

    if (isDebug) {
      closureArgs.push('--debug');
    }
    const closureCommand = spawn(`${closureConfig.pathToJavaExecutable}`, closureArgs);

    closureCommand.stdout.on('data', (buffer: Buffer) => {
      Logger.debug(`[Closure] ${buffer.toString()}`);
    });

    closureCommand.stderr.on('data', (buffer: Buffer) => {
      Logger.debug(`[Closure] ${buffer.toString()}`);
    });

    closureCommand.on('close', (code: number) => {
      if (code === 0) {
        return resolve();
      }
      reject(new Error('Closure failed with a non-zero status code'));
    });
  });
}


export function isClosureSupported(context: BuildContext): Promise<boolean> {
  if (!getBooleanPropertyValue(Constants.ENV_USE_EXPERIMENTAL_CLOSURE)) {
    return Promise.resolve(false);
  }
  Logger.debug('[Closure] isClosureSupported: Checking if Closure Compiler is available');
  const config = getClosureConfig(context);
  return checkIfJavaIsAvailable(config).then(() => {
    return Promise.resolve(true);
  }).catch(() => {
    Logger.warn(`Closure Compiler support is enabled but Java cannot be started. Try running the build again with the "--debug" argument for more information.`);
    return Promise.resolve(false);
  });
}

function getClosureConfig(context: BuildContext, configFile?: string): ClosureConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  return fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
}

const taskInfo: TaskInfo = {
  fullArg: '--closure',
  shortArg: '-l',
  envVar: 'IONIC_CLOSURE',
  packageConfig: 'ionic_closure',
  defaultConfigFile: 'closure.config'
};


export interface ClosureConfig {
  // https://developers.google.com/closure/compiler/docs/gettingstarted_app
  pathToJavaExecutable: string;
  pathToClosureJar: string;
  optimization: string;
  languageOut: string;
  languageIn: string;
  debug: boolean;
}
