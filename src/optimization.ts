import { extname } from 'path';
import { Logger } from './logger/logger';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getBooleanPropertyValue } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { runWebpackFullBuild, WebpackConfig } from './webpack';
import { purgeDecorators } from './optimization/decorators';
import { calculateUnusedComponents, purgeUnusedImportsAndExportsFromIndex } from './optimization/treeshake';

export function optimization(context: BuildContext, configFile: string) {
  const logger = new Logger(`optimization`);
  return optimizationWorker(context, configFile).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      const error = new BuildError(err.message);
      error.isFatal = true;
      throw logger.fail(error);
    });
}

function optimizationWorker(context: BuildContext, configFile: string) {
  const webpackConfig = getConfig(context, configFile);
  return runWebpackFullBuild(webpackConfig).then((stats: any) => {
    const dependencyMap = processStats(context, stats);
    return doOptimizations(context, dependencyMap);
  });
}

export function doOptimizations(context: BuildContext, dependencyMap: Map<string, Set<string>>) {
  // remove decorators
  const modifiedMap = new Map(dependencyMap);
  if (getBooleanPropertyValue(Constants.ENV_EXPERIMENTAL_PURGE_DECORATORS)) {
    removeDecorators(context);
  }

  // remove unused component imports
  if (getBooleanPropertyValue(Constants.ENV_EXPERIMENTAL_MANUAL_TREESHAKING)) {
    const results = calculateUnusedComponents(modifiedMap);
    purgeUnusedImports(context, results.purgedModules);
  }

  printDependencyMap(modifiedMap);

  return modifiedMap;
}

function removeDecorators(context: BuildContext) {
  const jsFiles = context.fileCache.getAll().filter(file => extname(file.path) === '.js');
  jsFiles.forEach(jsFile => {
    jsFile.content = purgeDecorators(jsFile.path, jsFile.content);
  });
}

function purgeUnusedImports(context: BuildContext, purgeDependencyMap: Map<string, Set<string>>) {
  // for now, restrict this to components in the ionic-angular/index.js file
  const indexFilePath = process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT];
  const file = context.fileCache.get(indexFilePath);
  const modulesToPurge: string[] = [];
  purgeDependencyMap.forEach((set: Set<string>, moduleToPurge: string) => {
    modulesToPurge.push(moduleToPurge);
  });

  const updatedFileContent = purgeUnusedImportsAndExportsFromIndex(indexFilePath, file.content, modulesToPurge);
  context.fileCache.set(indexFilePath, { path: indexFilePath, content: updatedFileContent });
}

function processStats(context: BuildContext, stats: any) {
  const statsObj = stats.toJson({
    source: false,
    timings: false,
    version: false,
    errorDetails: false,
    chunks: false,
    chunkModules: false
  });
  return processStatsImpl(statsObj);
}

export function processStatsImpl(webpackStats: WebpackStats) {
  const dependencyMap = new Map<string, Set<string>>();
  if (webpackStats && webpackStats.modules) {
      webpackStats.modules.forEach(webpackModule => {
      const moduleId = purgeWebpackPrefixFromPath(webpackModule.identifier);
      const dependencySet = new Set<string>();
      webpackModule.reasons.forEach(webpackDependency => {
        const depId = purgeWebpackPrefixFromPath(webpackDependency.moduleIdentifier);
        dependencySet.add(depId);
      });
      dependencyMap.set(moduleId, dependencySet);
    });
  }

  if (getBooleanPropertyValue(Constants.ENV_PRINT_DEPENDENCY_TREE)) {
    printDependencyMap(dependencyMap);
  }

  return dependencyMap;
}

export function purgeWebpackPrefixFromPath(filePath: string) {
  return filePath.replace(process.env[Constants.ENV_OPTIMIZATION_LOADER], '').replace(process.env[Constants.ENV_WEBPACK_LOADER], '').replace('!', '');
}

function printDependencyMap(map: Map<string, Set<string>>) {
  map.forEach((dependencySet: Set<string>, filePath: string) => {
    Logger.unformattedDebug('\n\n');
    Logger.unformattedDebug(`${filePath} is imported by the following files:`);
    dependencySet.forEach((importeePath: string) => {
      Logger.unformattedDebug(`   ${importeePath}`);
    });
  });
}

export function getConfig(context: BuildContext, configFile: string): WebpackConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  let webpackConfig: WebpackConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  webpackConfig.entry = replacePathVars(context, webpackConfig.entry);
  webpackConfig.output.path = replacePathVars(context, webpackConfig.output.path);

  return webpackConfig;
}

const taskInfo: TaskInfo = {
  fullArg: '--optimization',
  shortArg: '-dt',
  envVar: 'IONIC_DEPENDENCY_TREE',
  packageConfig: 'ionic_dependency_tree',
  defaultConfigFile: 'optimization.config'
};

export interface WebpackStats {
  modules: WebpackModule[];
};

export interface WebpackModule {
  identifier: string;
  reasons: WebpackDependency[];
};

export interface WebpackDependency {
  moduleIdentifier: string;
};
