import { BuildContext, BuildOptions, fillConfigDefaults, generateContext, Logger, replacePathVars, TaskInfo } from './util';
import { copy as fsCopy } from 'fs-extra';


export function copy(context?: BuildContext, copyConfig?: CopyConfig) {
  context = generateContext(context);
  copyConfig = fillConfigDefaults(context, copyConfig, COPY_TASK_INFO);

  const logger = new Logger('copy');

  return runCopy(context, copyConfig).then(() => {
    return logger.finish();
  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}


export function copyUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  Logger.debug(`copyUpdate, event: ${event}, path: ${path}`);

  const copyConfig = fillConfigDefaults(context, null, COPY_TASK_INFO);
  return runCopy(context, copyConfig);
}


function runCopy(context: BuildContext, copyConfig: CopyConfig) {
  const promises: Promise<any>[] = [];

  copyConfig.include.forEach(copyOptions => {
    promises.push(
      copySrcToDest(context, copyOptions.src, copyOptions.dest, copyOptions.filter)
    );
  });

  return Promise.all(promises);
}


function copySrcToDest(context: BuildContext, src: string, dest: string, filter?: any) {
  src = replacePathVars(context, src);
  dest = replacePathVars(context, dest);
  const opts = {
    filter: filter
  };

  return new Promise((resolve: any, reject: any) => {
    fsCopy(src, dest, opts, (err) => {
      if (err) {
        const msg = `Error copying "${src}" to "${dest}": ${err}`;

        if (msg.indexOf('ENOENT') < 0 && msg.indexOf('EEXIST') < 0) {
          reject(new Error(`Error copying "${src}" to "${dest}": ${err}`));
          return;
        }
      }
      resolve();
    });
  });
}


const COPY_TASK_INFO: TaskInfo = {
  fullArgConfig: '--copy',
  shortArgConfig: '-y',
  envConfig: 'ionic_copy',
  defaultConfigFilename: 'copy.config'
};

export interface CopyConfig {
  include: CopyOptions[];
}


export interface CopyOptions {
  // https://www.npmjs.com/package/fs-extra
  src: string;
  dest: string;
  filter: any;
}
