import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { emit, EventType } from './util/events';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars } from './util/config';
import * as fs from 'fs-extra';
import { join as pathJoin, resolve as pathResolve, sep as pathSep } from 'path';

export function copy(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('copy');

  return copyWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function copyUpdate(event: string, filePath: string, context: BuildContext) {
  const configFile = getUserConfigFile(context, taskInfo, null);

  Logger.debug(`copyUpdate, event: ${event}, path: ${filePath}`);

  if (event === 'change' || event === 'add' || event === 'addDir') {
    // figure out which copy option(s) this one file/directory belongs to
    const copyConfig: CopyConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
    const fileCopyOptions = findFileCopyOptions(context, copyConfig, filePath);
    if (fileCopyOptions.length) {
      const promises = fileCopyOptions.map(copyOptions => {

        return copySrcToDest(context, copyOptions.src, copyOptions.dest, copyOptions.filter, true);
      });
      return Promise.all(promises).then((copySrcToDestResults: CopySrcToDestResult[]) => {
        printCopyErrorMessages('copy', copySrcToDestResults);
        const destFiles = copySrcToDestResults.map(copySrcToDestResult => copySrcToDestResult.dest);
        emit(EventType.FileChange, destFiles);
      });
    }

  } else if (event === 'unlink' || event === 'unlinkDir') {
    return new Promise((resolve, reject) => {
      const destFile = pathJoin(context.rootDir, filePath);
      fs.remove(destFile, (err) => {
        if (err) {
          reject(new BuildError(err));

        } else {
          if (event === 'unlink') {
            emit(EventType.FileDelete, destFile);
          } else if (event === 'unlinkDir') {
            emit(EventType.DirectoryDelete, destFile);
          }

          resolve();
        }
      });
    });
  }

  return copyWorker(context, configFile);
}


export function copyWorker(context: BuildContext, configFile: string) {
  const copyConfig: CopyConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);

  const promises = copyConfig.include.map(copyOptions => {
    return copySrcToDest(context, copyOptions.src, copyOptions.dest, copyOptions.filter, true);
  });

  return Promise.all(promises).then((copySrcToDestResults: CopySrcToDestResult[]) => {
    printCopyErrorMessages('copy', copySrcToDestResults);
  });
}

function printCopyErrorMessages(prefix: string, copyResults: CopySrcToDestResult[]) {
   copyResults.forEach(copyResult => {
    if (!copyResult.success) {
      Logger.warn(`${prefix}: ${copyResult.errorMessage}`);
    }
  });
}

export function findFileCopyOptions(context: BuildContext, copyConfig: CopyConfig, filePath: string) {
  const copyOptions: CopyOptions[] = [];

  if (!copyConfig || !copyConfig.include || !context.rootDir) {
    return copyOptions;
  }

  filePath = pathJoin(context.rootDir, filePath);

  const filePathSegments = filePath.split(pathSep);
  let srcPath: string;
  let srcLookupPath: string;
  let destCopyOption: string;
  let destPath: string;

  while (filePathSegments.length > 1) {
    srcPath = filePathSegments.join(pathSep);


    for (var i = 0; i < copyConfig.include.length; i++) {
      srcLookupPath = pathResolve(replacePathVars(context, copyConfig.include[i].src));

      if (srcPath === srcLookupPath) {
        destCopyOption = pathResolve(replacePathVars(context, copyConfig.include[i].dest));
        destPath = filePath.replace(srcLookupPath, destCopyOption);

        copyOptions.push({
          src: filePath,
          dest: destPath,
          filter: copyConfig.include[i].filter
        });
      }
    }

    if (srcPath.length < context.rootDir.length) {
      break;
    }

    filePathSegments.pop();
  }

  return copyOptions;
}


function copySrcToDest(context: BuildContext, src: string, dest: string, filter: any, clobber: boolean): Promise<CopySrcToDestResult> {
  return new Promise((resolve, reject) => {
    src = pathResolve(replacePathVars(context, src));
    dest = pathResolve(replacePathVars(context, dest));

    const opts = {
      filter: filter,
      clobber: clobber
    };

    fs.copy(src, dest, opts, (err) => {
      if (err) {
        if (err.message && err.message.indexOf('ENOENT') > -1) {
          resolve({ success: false, src: src, dest: dest, errorMessage: `Error copying "${src}" to "${dest}": File not found`});
        } else {
          resolve({ success: false, src: src, dest: dest, errorMessage: `Error copying "${src}" to "${dest}"`});
        }
        return;
      }
      resolve({ success: true, src: src, dest: dest});
    });
  });
}

interface CopySrcToDestResult {
  success: boolean;
  src: string;
  dest: string;
  errorMessage: string;
}

const taskInfo: TaskInfo = {
  fullArg: '--copy',
  shortArg: '-y',
  envVar: 'IONIC_COPY',
  packageConfig: 'ionic_copy',
  defaultConfigFile: 'copy.config'
};


export interface CopyConfig {
  include: CopyOptions[];
}


export interface CopyOptions {
  // https://www.npmjs.com/package/fs-extra
  src: string;
  dest: string;
  filter?: any;
}
