import { mkdirpSync } from 'fs-extra';
import { dirname as pathDirname, join as pathJoin, relative as pathRelative, resolve as pathResolve } from 'path';
import { Logger } from './logger/logger';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { emit, EventType } from './util/events';
import { generateGlobTasks, globAll, GlobObject, GlobResult } from './util/glob-util';
import { copyFileAsync, getBooleanPropertyValue, rimRafAsync, unlinkAsync } from './util/helpers';
import { BuildContext, ChangedFile, TaskInfo } from './util/interfaces';
import { Watcher, copyUpdate as watchCopyUpdate } from './watch';

const copyFilePathCache = new Map<string, CopyToFrom[]>();

const FILTER_OUT_DIRS_FOR_CLEAN = ['{{WWW}}', '{{BUILD}}'];

export function copy(context: BuildContext, configFile?: string) {
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

export function copyWorker(context: BuildContext, configFile: string) {
  const copyConfig: CopyConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  const keys = Object.keys(copyConfig);
  const directoriesToCreate = new Set<string>();
  const toCopyList: CopyToFrom[] = [];
  return Promise.resolve().then(() => {
    // for each entry, make sure each glob in the list of globs has had string replacement performed on it
    cleanConfigContent(keys, copyConfig, context);
    return getFilesPathsForConfig(keys, copyConfig);
  }).then((resultMap: Map<string, GlobResult[]>) => {
    // sweet, we have the absolute path of the files in the glob, and the ability to get the relative path
    // basically, we've got a stew goin'
    return populateFileAndDirectoryInfo(resultMap, copyConfig, toCopyList, directoriesToCreate);
  }).then(() => {
    if (getBooleanPropertyValue(Constants.ENV_CLEAN_BEFORE_COPY)) {
      cleanDirectories(context, directoriesToCreate);
    }
  }).then(() => {
    // create the directories synchronously to avoid any disk locking issues
    const directoryPathList = Array.from(directoriesToCreate);
    for (const directoryPath of directoryPathList) {
      mkdirpSync(directoryPath);
    }
  }).then(() => {
    // sweet, the directories are created, so now let's stream the files
    const promises: Promise<void>[] = [];
    for (const file of toCopyList) {
      cacheCopyData(file);
      const promise = copyFileAsync(file.absoluteSourcePath, file.absoluteDestPath);
      promise.then(() => {
        Logger.debug(`Successfully copied ${file.absoluteSourcePath} to ${file.absoluteDestPath}`);
      }).catch(err => {
        Logger.warn(`Failed to copy ${file.absoluteSourcePath} to ${file.absoluteDestPath}`);
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  });
}

export function copyUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const logger = new Logger('copy update');
  const configFile = getUserConfigFile(context, taskInfo, null);
  const copyConfig: CopyConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  const keys = Object.keys(copyConfig);
  const directoriesToCreate = new Set<string>();
  const toCopyList: CopyToFrom[] = [];
  return Promise.resolve().then(() => {
    changedFiles.forEach(changedFile => Logger.debug(`copyUpdate, event: ${changedFile.event}, path: ${changedFile.filePath}`));
    // for each entry, make sure each glob in the list of globs has had string replacement performed on it
    cleanConfigContent(keys, copyConfig, context);

    return getFilesPathsForConfig(keys, copyConfig);
  }).then((resultMap: Map<string, GlobResult[]>) => {
    // sweet, we have the absolute path of the files in the glob, and the ability to get the relative path
    // basically, we've got a stew goin'
    return populateFileAndDirectoryInfo(resultMap, copyConfig, toCopyList, directoriesToCreate);
  }).then(() => {
    // first, process any deleted directories
    const promises: Promise<void>[] = [];
    const directoryDeletions = changedFiles.filter(changedFile => changedFile.event === 'unlinkDir');
    directoryDeletions.forEach(changedFile => promises.push(processRemoveDir(changedFile)));
    return Promise.all(promises);
  }).then(() => {
    // process any deleted files
    const promises: Promise<void>[] = [];
    const fileDeletions = changedFiles.filter(changedFile => changedFile.event === 'unlink');
    fileDeletions.forEach(changedFile => promises.push(processRemoveFile(changedFile)));
    return Promise.all(promises);
  }).then(() => {
    const promises: Promise<void>[] = [];
    const additions = changedFiles.filter(changedFile => changedFile.event === 'change' || changedFile.event === 'add' || changedFile.event === 'addDir');
    additions.forEach(changedFile => {
      const matchingItems = toCopyList.filter(toCopyEntry => toCopyEntry.absoluteSourcePath === changedFile.filePath);
      matchingItems.forEach(matchingItem => {
        // create the directories first (if needed)
        mkdirpSync(pathDirname(matchingItem.absoluteDestPath));
        // cache the data and copy the files
        cacheCopyData(matchingItem);
        promises.push(copyFileAsync(matchingItem.absoluteSourcePath, matchingItem.absoluteDestPath));
        emit(EventType.FileChange, additions);
      });
    });
    return Promise.all(promises);
  }).then(() => {
    logger.finish('green', true);
    Logger.newLine();
  }).catch(err => {
    throw logger.fail(err);
  });
}

function cleanDirectories(context: BuildContext, directoriesToCreate: Set<string>) {
  const filterOut = replacePathVars(context, FILTER_OUT_DIRS_FOR_CLEAN);
  const directoryPathList = Array.from(directoriesToCreate);
  // filter out any directories that we don't want to allow a clean on
  const cleanableDirectories = directoryPathList.filter(directoryPath => {
    for (const uncleanableDir of filterOut) {
      if (uncleanableDir === directoryPath) {
        return false;
      }
    }
    return true;
  });
  return deleteDirectories(cleanableDirectories);
}

function deleteDirectories(directoryPaths: string[]) {
  const promises: Promise<void>[] = [];
  for (const directoryPath of directoryPaths) {
   promises.push(rimRafAsync(directoryPath));
  }
  return Promise.all(promises);
}

function processRemoveFile(changedFile: ChangedFile) {
  // delete any destination files that match the source file
  const list = copyFilePathCache.get(changedFile.filePath) || [];
  copyFilePathCache.delete(changedFile.filePath);
  const promises: Promise<void[]>[] = [];
  const deletedFilePaths: string[] = [];
  list.forEach(copiedFile => {
    const promise = unlinkAsync(copiedFile.absoluteDestPath);
    promises.push(promise);
    promise.catch(err => {
      if (err && err.message && err.message.indexOf('ENOENT') >= 0) {
        Logger.warn(`Failed to delete ${copiedFile.absoluteDestPath} because it doesn't exist`);
        return;
      }
      throw err;
    });
    deletedFilePaths.push(copiedFile.absoluteDestPath);
  });
  emit(EventType.FileDelete, deletedFilePaths);
  return Promise.all(promises).catch(err => {
  });
}

function processRemoveDir(changedFile: ChangedFile): Promise<any> {
  // remove any files from the cache where the dirname equals the provided path
  const keysToRemove: string[] = [];
  const directoriesToRemove = new Set<string>();
  copyFilePathCache.forEach((copiedFiles: CopyToFrom[], filePath: string) => {
    if (pathDirname(filePath) === changedFile.filePath) {
      keysToRemove.push(filePath);
      copiedFiles.forEach(copiedFile => directoriesToRemove.add(pathDirname(copiedFile.absoluteDestPath)));
    }
  });
  keysToRemove.forEach(keyToRemove => copyFilePathCache.delete(keyToRemove));
  // the entries are removed from the cache, now just rim raf the directoryPath
  const promises: Promise<void>[] = [];
  directoriesToRemove.forEach(directoryToRemove => {
    promises.push(rimRafAsync(directoryToRemove));
  });
  emit(EventType.DirectoryDelete, Array.from(directoriesToRemove));
  return Promise.all(promises);
}

function cacheCopyData(copyObject: CopyToFrom) {
  let list = copyFilePathCache.get(copyObject.absoluteSourcePath);
  if (!list) {
    list = [];
  }
  list.push(copyObject);
  copyFilePathCache.set(copyObject.absoluteSourcePath, list);
}

function getFilesPathsForConfig(copyConfigKeys: string[], copyConfig: CopyConfig): Promise<Map<String, GlobResult[]>> {
  // execute the glob functions to determine what files match each glob
  const srcToResultsMap = new Map<string, GlobResult[]>();
  const promises: Promise<GlobResult[]>[] = [];
  copyConfigKeys.forEach(key => {
    const copyOptions = copyConfig[key];
    if (copyOptions && copyOptions.src) {
      const promise = globAll(copyOptions.src);
      promises.push(promise);
      promise.then(globResultList => {
        srcToResultsMap.set(key, globResultList);
      });
    }
  });

  return Promise.all(promises).then(() => {
    return srcToResultsMap;
  });
}

function populateFileAndDirectoryInfo(resultMap: Map<string, GlobResult[]>, copyConfig: CopyConfig, toCopyList: CopyToFrom[], directoriesToCreate: Set<string>) {
  resultMap.forEach((globResults: GlobResult[], dictionaryKey: string) => {
    globResults.forEach(globResult => {
      // get the relative path from the of each file from the glob
      const relativePath = pathRelative(globResult.base, globResult.absolutePath);
      // append the relative path to the dest
      const destFileName = pathResolve(pathJoin(copyConfig[dictionaryKey].dest, relativePath));
      // store the file information
      toCopyList.push({
        absoluteSourcePath: globResult.absolutePath,
        absoluteDestPath: destFileName
      });
      const directoryToCreate = pathDirname(destFileName);
      directoriesToCreate.add(directoryToCreate);
    });
  });
}

function cleanConfigContent(dictionaryKeys: string[], copyConfig: CopyConfig, context: BuildContext) {
  dictionaryKeys.forEach(key => {
    const copyOption = copyConfig[key];
    if (copyOption && copyOption.src && copyOption.src.length) {
      const cleanedUpSrc = replacePathVars(context, copyOption.src);
      copyOption.src = cleanedUpSrc;
      const cleanedUpDest = replacePathVars(context, copyOption.dest);
      copyOption.dest = cleanedUpDest;
    }
  });
}

export function copyConfigToWatchConfig(context: BuildContext): Watcher {
  if (!context) {
    context = generateContext(context);
  }
  const configFile = getUserConfigFile(context, taskInfo, '');
  const copyConfig: CopyConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  let results: GlobObject[] = [];
  for (const key of Object.keys(copyConfig)) {
    if (copyConfig[key] && copyConfig[key].src) {
      const list = generateGlobTasks(copyConfig[key].src, {});
      results = results.concat(list);
    }
  }

  const paths: string[] = [];
  let ignored: string[] = [];
  for (const result of results) {
    paths.push(result.pattern);
    if (result.opts && result.opts.ignore) {
      ignored = ignored.concat(result.opts.ignore);
    }
  }

  return {
    paths: paths,
    options: {
      ignored: ignored
    },
    callback: watchCopyUpdate
  };
}

export interface CopySrcToDestResult {
  success: boolean;
  src: string;
  dest: string;
  errorMessage: string;
}

export const taskInfo: TaskInfo = {
  fullArg: '--copy',
  shortArg: '-y',
  envVar: 'IONIC_COPY',
  packageConfig: 'ionic_copy',
  defaultConfigFile: 'copy.config'
};


export interface CopyConfig {
  [index: string]: CopyOptions;
}

export interface CopyToFrom {
  absoluteSourcePath: string;
  absoluteDestPath: string;
}

export interface CopyOptions {
  // https://www.npmjs.com/package/fs-extra
  src: string[];
  dest: string;
}
