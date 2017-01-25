import { BuildContext, BuildState, ChangedFile, TaskInfo } from './util/interfaces';
import { BuildError, IgnorableError } from './util/errors';
import { emit, EventType } from './util/events';
import { join } from 'path';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import { Logger } from './logger/logger';
import * as webpackApi from 'webpack';

import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();
const INCREMENTAL_BUILD_FAILED = 'incremental_build_failed';
const INCREMENTAL_BUILD_SUCCESS = 'incremental_build_success';

/*
 * Due to how webpack watch works, sometimes we start an update event
 * but it doesn't affect the bundle at all, for example adding a new typescript file
 * not imported anywhere or adding an html file not used anywhere.
 * In this case, we'll be left hanging and have screwed up logging when the bundle is modified
 * because multiple promises will resolve at the same time (we queue up promises waiting for an event to occur)
 * To mitigate this, store pending "webpack watch"/bundle update promises in this array and only resolve the
 * the most recent one. reject all others at that time with an IgnorableError.
 */
let pendingPromises: Promise<any>[] = [];

export function webpack(context: BuildContext, configFile: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('webpack');

  return webpackWorker(context, configFile)
    .then(() => {
      context.bundleState = BuildState.SuccessfulBuild;
      logger.finish();
    })
    .catch(err => {
      context.bundleState = BuildState.RequiresBuild;
      throw logger.fail(err);
    });
}


export function webpackUpdate(changedFiles: ChangedFile[], context: BuildContext, configFile?: string) {
  const logger = new Logger('webpack update');
  const webpackConfig = getWebpackConfig(context, configFile);
  Logger.debug('webpackUpdate: Starting Incremental Build');
  const promisetoReturn = runWebpackIncrementalBuild(false, context, webpackConfig);
  emit(EventType.WebpackFilesChanged, null);
  return promisetoReturn.then((stats: any) => {
      // the webpack incremental build finished, so reset the list of pending promises
      pendingPromises = [];
      Logger.debug('webpackUpdate: Incremental Build Done, processing Data');
      return webpackBuildComplete(stats, context, webpackConfig);
    }).then(() => {
      context.bundleState = BuildState.SuccessfulBuild;
      return logger.finish();
    }).catch(err => {
      context.bundleState = BuildState.RequiresBuild;
      if (err instanceof IgnorableError) {
        throw err;
      }

      throw logger.fail(err);
    });
}


export function webpackWorker(context: BuildContext, configFile: string): Promise<any> {
  const webpackConfig = getWebpackConfig(context, configFile);

  let promise: Promise<any> = null;
  if (context.isWatch) {
    promise = runWebpackIncrementalBuild(!context.webpackWatch, context, webpackConfig);
  } else {
    promise = runWebpackFullBuild(webpackConfig);
  }

  return promise
    .then((stats: any) => {
      return webpackBuildComplete(stats, context, webpackConfig);
    });
}

function webpackBuildComplete(stats: any, context: BuildContext, webpackConfig: WebpackConfig) {
  // set the module files used in this bundle
  // this reference can be used elsewhere in the build (sass)
  const files = stats.compilation.modules.map((webpackObj: any) => {
    if (webpackObj.resource) {
      return webpackObj.resource;
    } else {
      return webpackObj.context;
    }
  }).filter((path: string) => {
    // just make sure the path is not null
    return path && path.length > 0;
  });

  context.moduleFiles = files;

  return Promise.resolve();
}

function runWebpackFullBuild(config: WebpackConfig) {
  return new Promise((resolve, reject) => {
    const callback = (err: Error, stats: any) => {
      if (err) {
        reject(new BuildError(err));
      } else {
        resolve(stats);
      }
    };

    const compiler = webpackApi(config);
    compiler.run(callback);
  });
}

function runWebpackIncrementalBuild(initializeWatch: boolean, context: BuildContext, config: WebpackConfig) {
  const promise = new Promise((resolve, reject) => {
    // start listening for events, remove listeners once an event is received
    eventEmitter.on(INCREMENTAL_BUILD_FAILED, (err: Error) => {
      Logger.debug('Webpack Bundle Update Failed');
      eventEmitter.removeAllListeners();
      handleWebpackBuildFailure(resolve, reject, err, promise, pendingPromises);
    });

    eventEmitter.on(INCREMENTAL_BUILD_SUCCESS, (stats: any) => {
      Logger.debug('Webpack Bundle Updated');
      eventEmitter.removeAllListeners();
      handleWebpackBuildSuccess(resolve, reject, stats, promise, pendingPromises);
    });

    if (initializeWatch) {
      startWebpackWatch(context, config);
    }
  });

  pendingPromises.push(promise);

  return promise;
}

function handleWebpackBuildFailure(resolve: Function, reject: Function, error: Error, promise: Promise<any>, pendingPromises: Promise<void>[]) {
  // check if the promise if the last promise in the list of pending promises
  if (pendingPromises.length > 0 && pendingPromises[pendingPromises.length - 1] === promise) {
    // reject this one with a build error
    reject(new BuildError(error));
    return;
  }
  // for all others, reject with an ignorable error
  reject(new IgnorableError());
}

function handleWebpackBuildSuccess(resolve: Function, reject: Function, stats: any, promise: Promise<any>, pendingPromises: Promise<void>[]) {
  // check if the promise if the last promise in the list of pending promises
  if (pendingPromises.length > 0 && pendingPromises[pendingPromises.length - 1] === promise) {
    Logger.debug('handleWebpackBuildSuccess: Resolving with Webpack data');
    resolve(stats);
    return;
  }
  // for all others, reject with an ignorable error
  Logger.debug('handleWebpackBuildSuccess: Rejecting with ignorable error');
  reject(new IgnorableError());
}

function startWebpackWatch(context: BuildContext, config: WebpackConfig) {
  Logger.debug('Starting Webpack watch');
  const compiler = webpackApi(config);
  context.webpackWatch = compiler.watch({}, (err: Error, stats: any) => {
    if (err) {
      eventEmitter.emit(INCREMENTAL_BUILD_FAILED, err);
    } else {
      eventEmitter.emit(INCREMENTAL_BUILD_SUCCESS, stats);
    }
  });
}

export function getWebpackConfig(context: BuildContext, configFile: string): WebpackConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  let webpackConfig: WebpackConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  webpackConfig.entry = replacePathVars(context, webpackConfig.entry);
  webpackConfig.output.path = replacePathVars(context, webpackConfig.output.path);

  return webpackConfig;
}


export function getOutputDest(context: BuildContext) {
  const webpackConfig = getWebpackConfig(context, null);
  return join(webpackConfig.output.path, webpackConfig.output.filename);
}

const taskInfo: TaskInfo = {
  fullArg: '--webpack',
  shortArg: '-w',
  envVar: 'IONIC_WEBPACK',
  packageConfig: 'ionic_webpack',
  defaultConfigFile: 'webpack.config'
};


export interface WebpackConfig {
  // https://www.npmjs.com/package/webpack
  devtool: string;
  entry: string | { [key: string]: any };
  output: WebpackOutputObject;
  resolve: WebpackResolveObject;
}

export interface WebpackOutputObject {
  path: string;
  filename: string;
}

export interface WebpackResolveObject {
  extensions: string[];
  modules: string[];
}
