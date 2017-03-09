import { extname, join } from 'path';
import { Logger } from './logger/logger';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { getBooleanPropertyValue, webpackStatsToDependencyMap, printDependencyMap, unlinkAsync } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { runWebpackFullBuild, WebpackConfig } from './webpack';
import { purgeDecorators } from './optimization/decorators';
import { getAppModuleNgFactoryPath, calculateUnusedComponents, purgeUnusedImportsAndExportsFromIndex, purgeComponentNgFactoryImportAndUsage, purgeProviderControllerImportAndUsage, purgeProviderClassNameFromIonicModuleForRoot } from './optimization/treeshake';

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

function optimizationWorker(context: BuildContext, configFile: string): Promise<any> {
  const webpackConfig = getConfig(context, configFile);
  let dependencyMap: Map<string, Set<string>> = null;
  if (optimizationEnabled()) {
    return runWebpackFullBuild(webpackConfig).then((stats: any) => {
      dependencyMap = webpackStatsToDependencyMap(context, stats);
      if (getBooleanPropertyValue(Constants.ENV_PRINT_ORIGINAL_DEPENDENCY_TREE)) {
        Logger.debug('Original Dependency Map Start');
        printDependencyMap(dependencyMap);
        Logger.debug('Original Dependency Map End');
      }
      return deleteOptimizationJsFile(join(webpackConfig.output.path, webpackConfig.output.filename));
    }).then(() => {
      return doOptimizations(context, dependencyMap);
    });
  } else {
    return Promise.resolve();
  }
}

export function deleteOptimizationJsFile(fileToDelete: string) {
  return unlinkAsync(fileToDelete);
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

  if (getBooleanPropertyValue(Constants.ENV_PRINT_MODIFIED_DEPENDENCY_TREE)) {
    Logger.debug('Modified Dependency Map Start');
    printDependencyMap(modifiedMap);
    Logger.debug('Modified Dependency Map End');
  }

  return modifiedMap;
}

function optimizationEnabled() {
  const purgeDecorators = getBooleanPropertyValue(Constants.ENV_EXPERIMENTAL_PURGE_DECORATORS);
  const manualTreeshaking = getBooleanPropertyValue(Constants.ENV_EXPERIMENTAL_MANUAL_TREESHAKING);
  return purgeDecorators || manualTreeshaking;
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
  if (!file) {
    throw new Error(`Could not find ionic-angular index file ${indexFilePath}`);
  }
  const modulesToPurge: string[] = [];
  purgeDependencyMap.forEach((set: Set<string>, moduleToPurge: string) => {
    modulesToPurge.push(moduleToPurge);
  });

  const updatedFileContent = purgeUnusedImportsAndExportsFromIndex(indexFilePath, file.content, modulesToPurge);
  context.fileCache.set(indexFilePath, { path: indexFilePath, content: updatedFileContent });

  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_ACTION_SHEET_CONTROLLER_PATH], process.env[Constants.ENV_ACTION_SHEET_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_ACTION_SHEET_CONTROLLER_CLASSNAME]);
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_ALERT_CONTROLLER_PATH], process.env[Constants.ENV_ALERT_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_ALERT_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_ALERT_CONTROLLER_CLASSNAME]);
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_LOADING_CONTROLLER_PATH], process.env[Constants.ENV_LOADING_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_LOADING_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_LOADING_CONTROLLER_CLASSNAME]);
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_MODAL_CONTROLLER_PATH], process.env[Constants.ENV_MODAL_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_MODAL_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_MODAL_CONTROLLER_CLASSNAME]);
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_PICKER_CONTROLLER_PATH], process.env[Constants.ENV_PICKER_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_PICKER_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_PICKER_CONTROLLER_CLASSNAME]);
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_POPOVER_CONTROLLER_PATH], process.env[Constants.ENV_POPOVER_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_POPOVER_CONTROLLER_CLASSNAME]);
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, process.env[Constants.ENV_TOAST_CONTROLLER_PATH], process.env[Constants.ENV_TOAST_VIEW_CONTROLLER_PATH], process.env[Constants.ENV_TOAST_COMPONENT_FACTORY_PATH], process.env[Constants.ENV_TOAST_CONTROLLER_CLASSNAME]);
}

function attemptToPurgeUnusedProvider(context: BuildContext, dependencyMap: Map<string, Set<string>>, providerPath: string, providerComponentPath: string, providerComponentFactoryPath: string, providerClassName: string) {
  if (dependencyMap.has(providerPath)) {
    // awwww yissssssss

    // first, get the content of the app module ngfactory file
    const appModuleNgFactoryPath = getAppModuleNgFactoryPath();
    const file = context.fileCache.get(appModuleNgFactoryPath);
    if (!file) {
      return;
    }

    let updatedContent = purgeComponentNgFactoryImportAndUsage(file.path, file.content, providerComponentFactoryPath);
    updatedContent = purgeProviderControllerImportAndUsage(file.path, updatedContent, providerPath);
    context.fileCache.set(appModuleNgFactoryPath, { path: appModuleNgFactoryPath, content: updatedContent});

    // purge the provider name from the forRoot method providers list
    const indexFilePath = process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT];
    const ionicIndexFile = context.fileCache.get(indexFilePath);
    let newIndexFileContent = purgeProviderClassNameFromIonicModuleForRoot(ionicIndexFile.content, providerClassName);

    // purge the component from the index file
    context.fileCache.set(indexFilePath, { path: indexFilePath, content: newIndexFileContent});
  }
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


