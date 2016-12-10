import { execSync } from 'child_process';
import { BuildContext, TaskInfo } from './util/interfaces';
import { fillConfigDefaults, getUserConfigFile } from './util/config';
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
      throw logger.fail(err);
    });
}

export function closureWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    Logger.warn('Closer Compiler unsupported at this time.');
    resolve();
  });
}


export function isClosureSupported(context: BuildContext): boolean{
  /*const config = getClosureConfig(context, '');
  try {
    execSync(`${config.pathToJavaExecutable} --version`);
    return true;
  } catch (ex) {
    Logger.debug('[Closure] isClosureSupported: Failed to execute java command');
    return false;
  }
  */
  return false;
}

function getClosureConfig(context: BuildContext, configFile: string): ClosureConfig {
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
}
