import { basename, extname } from 'path';

import * as MagicString from 'magic-string';

import { Logger } from './logger/logger';
import { fillConfigDefaults, getUserConfigFile, replacePathVars } from './util/config';
import * as Constants from './util/constants';
import { BuildError } from './util/errors';
import { changeExtension, getBooleanPropertyValue, getStringPropertyValue, webpackStatsToDependencyMap, printDependencyMap } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';
import { runWebpackFullBuild, WebpackConfig } from './webpack';
import { addPureAnnotation, purgeStaticCtorFields, purgeStaticFieldDecorators, purgeTranspiledDecorators } from './optimization/decorators';
import { calculateUnusedComponents,
        checkIfProviderIsUsedInSrc,
        getIonicModuleFilePath,
        purgeUnusedImportsAndExportsFromModuleFile,
        purgeComponentNgFactoryImportAndUsage,
        purgeProviderControllerImportAndUsage,
        purgeProviderClassNameFromIonicModuleForRoot
} from './optimization/treeshake';

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

      purgeGeneratedFiles(context, webpackConfig.output.filename);
    }).then(() => {
      return doOptimizations(context, dependencyMap);
    });
  } else {
    return Promise.resolve();
  }
}

export function purgeGeneratedFiles(context: BuildContext, fileNameSuffix: string) {
  const buildFiles = context.fileCache.getAll().filter(file => file.path.indexOf(context.buildDir) >= 0 && file.path.indexOf(fileNameSuffix) >= 0);
  buildFiles.forEach(buildFile => context.fileCache.remove(buildFile.path));
}

export function doOptimizations(context: BuildContext, dependencyMap: Map<string, Set<string>>) {
  // remove decorators
  let modifiedMap = new Map(dependencyMap);
  if (getBooleanPropertyValue(Constants.ENV_PURGE_DECORATORS)) {
    removeDecorators(context);
  }

  // remove unused component imports
  if (getBooleanPropertyValue(Constants.ENV_MANUAL_TREESHAKING)) {
    // TODO remove this in a couple versions
    // only run manual tree shaking if the module file is found
    // since there is a breaking change here
    const ionicModulePath = getIonicModuleFilePath();
    if (context.fileCache.get(ionicModulePath)) {
      // due to how the angular compiler works in angular 4, we need to check if
      modifiedMap = checkIfProviderIsUsedInSrc(context, modifiedMap);
      const results = calculateUnusedComponents(modifiedMap);
      purgeUnusedImports(context, results.purgedModules);
    }
  }

  if (getBooleanPropertyValue(Constants.ENV_PRINT_MODIFIED_DEPENDENCY_TREE)) {
    Logger.debug('Modified Dependency Map Start');
    printDependencyMap(modifiedMap);
    Logger.debug('Modified Dependency Map End');
  }

  return modifiedMap;
}

function optimizationEnabled() {
  const purgeDecorators = getBooleanPropertyValue(Constants.ENV_PURGE_DECORATORS);
  const manualTreeshaking = getBooleanPropertyValue(Constants.ENV_MANUAL_TREESHAKING);
  return purgeDecorators || manualTreeshaking;
}

function removeDecorators(context: BuildContext) {
  const jsFiles = context.fileCache.getAll().filter(file => extname(file.path) === '.js');
  jsFiles.forEach(jsFile => {
    let magicString = new MagicString(jsFile.content);
    magicString = purgeStaticFieldDecorators(jsFile.path, jsFile.content, magicString);
    magicString = purgeStaticCtorFields(jsFile.path, jsFile.content, magicString);
    magicString = purgeTranspiledDecorators(jsFile.path, jsFile.content, magicString);
    magicString = addPureAnnotation(jsFile.path, jsFile.content, magicString);
    jsFile.content = magicString.toString();
    const sourceMap = magicString.generateMap({
      source: basename(jsFile.path),
      file: basename(jsFile.path),
      includeContent: true
    });
    const sourceMapPath = jsFile.path + '.map';
    context.fileCache.set(sourceMapPath, { path: sourceMapPath, content: sourceMap.toString()});
  });
}

function purgeUnusedImports(context: BuildContext, purgeDependencyMap: Map<string, Set<string>>) {
  // for now, restrict this to components in the ionic-angular/index.js file
  const indexFilePath = getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT);
  const moduleFilePath = getIonicModuleFilePath();
  const file = context.fileCache.get(indexFilePath);
  if (!file) {
    throw new Error(`Could not find ionic-angular index file ${indexFilePath}`);
  }
  const moduleFile = context.fileCache.get(moduleFilePath);
  if (!moduleFile) {
    throw new Error(`Could not find ionic-angular module file ${moduleFilePath}`);
  }
  const modulesToPurge: string[] = [];
  purgeDependencyMap.forEach((set: Set<string>, moduleToPurge: string) => {
    modulesToPurge.push(moduleToPurge);
  });

  const updatedFileContent = purgeUnusedImportsAndExportsFromModuleFile(moduleFilePath, moduleFile.content, modulesToPurge);
  context.fileCache.set(moduleFilePath, { path: moduleFilePath, content: updatedFileContent });

  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_ACTION_SHEET_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_ACTION_SHEET_CONTROLLER_CLASSNAME));
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_ALERT_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_ALERT_CONTROLLER_CLASSNAME));
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_LOADING_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_LOADING_CONTROLLER_CLASSNAME));
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_MODAL_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_MODAL_CONTROLLER_CLASSNAME));
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_PICKER_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_PICKER_CONTROLLER_CLASSNAME));
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_POPOVER_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_POPOVER_CONTROLLER_CLASSNAME));
  attemptToPurgeUnusedProvider(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_TOAST_CONTROLLER_PATH), getStringPropertyValue(Constants.ENV_TOAST_CONTROLLER_CLASSNAME));

  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_ACTION_SHEET_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_ALERT_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_ALERT_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_LOADING_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_LOADING_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_MODAL_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_MODAL_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_PICKER_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_PICKER_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_POPOVER_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_TOAST_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_TOAST_COMPONENT_FACTORY_PATH));
  attemptToPurgeUnusedEntryComponents(context, purgeDependencyMap, getStringPropertyValue(Constants.ENV_SELECT_POPOVER_COMPONENT_PATH), getStringPropertyValue(Constants.ENV_SELECT_POPOVER_COMPONENT_FACTORY_PATH));
}

function attemptToPurgeUnusedProvider(context: BuildContext, dependencyMap: Map<string, Set<string>>, providerPath: string, providerClassName: string) {
  if (dependencyMap.has(providerPath)) {
    const ngModuleFactoryFiles = context.fileCache.getAll().filter(file => file.path.endsWith(changeExtension(getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX), '.ngfactory.js')));
    ngModuleFactoryFiles.forEach(ngModuleFactoryFile => {
      const newContent = purgeProviderControllerImportAndUsage(ngModuleFactoryFile.path, ngModuleFactoryFile.content, providerPath);
      context.fileCache.set(ngModuleFactoryFile.path, { path: ngModuleFactoryFile.path, content: newContent});
    });

    const moduleFilePath = getIonicModuleFilePath();
    const ionicModuleFile = context.fileCache.get(moduleFilePath);
    const newModuleFileContent = purgeProviderClassNameFromIonicModuleForRoot(ionicModuleFile.content, providerClassName);

    // purge the component from the module file
    context.fileCache.set(moduleFilePath, { path: moduleFilePath, content: newModuleFileContent});
  }
}

function attemptToPurgeUnusedEntryComponents(context: BuildContext, dependencyMap: Map<string, Set<string>>, entryComponentPath: string, entryComponentFactoryPath: string) {
  if (dependencyMap.has(entryComponentPath)) {
    const ngModuleFactoryFiles = context.fileCache.getAll().filter(file => file.path.endsWith(changeExtension(getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX), '.ngfactory.js')));
    ngModuleFactoryFiles.forEach(ngModuleFactoryFile => {
      const updatedContent = purgeComponentNgFactoryImportAndUsage(ngModuleFactoryFile.path, ngModuleFactoryFile.content, entryComponentFactoryPath);
      context.fileCache.set(ngModuleFactoryFile.path, { path: ngModuleFactoryFile.path, content: updatedContent});
    });
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
