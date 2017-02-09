import { basename, dirname, join, relative } from 'path';
import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { changeExtension, escapeStringForRegex } from '../util/helpers';
import { TreeShakeCalcResults } from '../util/interfaces';

export function calculateUnusedComponents(dependencyMap: Map<string, Set<string>>): TreeShakeCalcResults {
  return calculateUnusedComponentsImpl(dependencyMap, process.env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT]);
}

export function calculateUnusedComponentsImpl(dependencyMap: Map<string, Set<string>>, importee: string): any {
  const filteredMap = filterMap(dependencyMap);
  processImportTree(filteredMap, importee);
  calculateUnusedIonicProviders(filteredMap);
  return generateResults(filteredMap);
}

function generateResults(dependencyMap: Map<string, Set<string>>) {
  const toPurgeMap = new Map<string, Set<string>>();
  const updatedMap = new Map<string, Set<string>>();
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if ((importeeSet && importeeSet.size > 0) || requiredModule(modulePath)) {
      updatedMap.set(modulePath, importeeSet);
    } else {
      toPurgeMap.set(modulePath, importeeSet);
    }
  });
  return {
    updatedDependencyMap: updatedMap,
    purgedModules: toPurgeMap
  };
}

function requiredModule(modulePath: string) {
  const mainJsFile = changeExtension(process.env[Constants.ENV_APP_ENTRY_POINT], '.js');
  const appModule = changeExtension(process.env[Constants.ENV_APP_NG_MODULE_PATH], '.js');
  const appModuleNgFactory = getAppModuleNgFactoryPath();
  return modulePath === mainJsFile || modulePath === appModule || modulePath === appModuleNgFactory;
}

function filterMap(dependencyMap: Map<string, Set<string>>) {
  const filteredMap = new Map<string, Set<string>>();
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
     if (isIonicComponentOrAppSource(modulePath)) {
       filteredMap.set(modulePath, importeeSet);
     }
  });
  return filteredMap;
}

function processImportTree(dependencyMap: Map<string, Set<string>>, importee: string) {
  const importees: string[] = [];
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if (importeeSet && importeeSet.has(importee)) {
      importeeSet.delete(importee);
      // if it importer by an `ngfactory` file, we probably aren't going to be able to purge it
      let ngFactoryImportee = false;
      const importeeList = Array.from(importeeSet);
      for (const entry of importeeList) {
        if (isNgFactory(entry)) {
          ngFactoryImportee = true;
          break;
        }
      }
      if (!ngFactoryImportee) {
        importees.push(modulePath);
      }
    }
  });
  importees.forEach(importee => processImportTree(dependencyMap, importee));
}

function calculateUnusedIonicProviders(dependencyMap: Map<string, Set<string>>) {
  const actionSheetController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet-controller.js');
  const actionSheetComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet-component.ngfactory.js');
  const alertController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert-controller.js');
  const alertComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert-component.ngfactory.js');
  const loadingController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading-controller.js');
  const loadingComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading-component.ngfactory.js');
  const modalController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal-controller.js');
  const modalComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal-component.ngfactory.js');
  const pickerController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker-controller.js');
  const pickerComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker-component.ngfactory.js');
  const popoverController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover-controller.js');
  const popoverComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover-component.ngfactory.js');
  const toastController = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast-controller.js');
  const toastComponentFactory = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast-component.ngfactory.js');

  processIonicProviders(dependencyMap, actionSheetController);
  processIonicProviders(dependencyMap, alertController);
  processIonicProviders(dependencyMap, loadingController);
  processIonicProviders(dependencyMap, modalController);
  processIonicProviders(dependencyMap, pickerController);
  processIonicProviders(dependencyMap, popoverController);
  processIonicProviders(dependencyMap, toastController);

  // check if the controllers were deleted, if so, purge the component too
  processIonicProviderComponents(dependencyMap, actionSheetController, actionSheetComponentFactory);
  processIonicProviderComponents(dependencyMap, alertController, alertComponentFactory);
  processIonicProviderComponents(dependencyMap, loadingController, loadingComponentFactory);
  processIonicProviderComponents(dependencyMap, modalController, modalComponentFactory);
  processIonicProviderComponents(dependencyMap, pickerController, pickerComponentFactory);
  processIonicProviderComponents(dependencyMap, popoverController, popoverComponentFactory);
  processIonicProviderComponents(dependencyMap, toastController, toastComponentFactory);
}

function processIonicProviderComponents(dependencyMap: Map<string, Set<string>>, providerPath: string, componentPath: string) {
  const importeeSet = dependencyMap.get(providerPath);
  if (importeeSet && importeeSet.size === 0) {
    processIonicProviders(dependencyMap, componentPath);
  }
}

function getAppModuleNgFactoryPath() {
  const appNgModulePath = process.env[Constants.ENV_APP_NG_MODULE_PATH];
  const directory = dirname(appNgModulePath);
  const extensionlessFileName = basename(appNgModulePath, '.js');
  const ngFactoryFileName = extensionlessFileName + '.ngfactory.js';
  return join(directory, ngFactoryFileName);
}

function processIonicProviders(dependencyMap: Map<string, Set<string>>, providerPath: string) {
  const importeeSet = dependencyMap.get(providerPath);
  const appModuleNgFactoryPath = getAppModuleNgFactoryPath();
  if (importeeSet && importeeSet.has(appModuleNgFactoryPath)) {
    importeeSet.delete(appModuleNgFactoryPath);
    // loop over the dependency map and remove this provider from importee sets
    processImportTreeForProviders(dependencyMap, providerPath);
  }
}

function processImportTreeForProviders(dependencyMap: Map<string, Set<string>>, importee: string) {
  const importees: string[] = [];
  dependencyMap.forEach((importeeSet: Set<string>, modulePath: string) => {
    if (importeeSet.has(importee)) {
      importeeSet.delete(importee);
      importees.push(modulePath);
    }
  });
  importees.forEach(importee => processImportTreeForProviders(dependencyMap, importee));
}

export function isIonicComponentOrAppSource(modulePath: string) {
  // for now, just use a simple filter of if a file is in ionic-angular/components
  const ionicAngularComponentDir = join(process.env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components');
  const srcDir = process.env[Constants.ENV_VAR_SRC_DIR];
  return modulePath.indexOf(ionicAngularComponentDir) >= 0 || modulePath.indexOf(srcDir) >= 0;
}

export function isNgFactory(modulePath: string) {
  return modulePath.indexOf('.ngfactory.') >= 0;
}

export function purgeUnusedImportsAndExportsFromIndex(indexFilePath: string, indexFileContent: string, modulePathsToPurge: string[] ) {
  for (const modulePath of modulePathsToPurge) {
    // I cannot get the './' prefix to show up when using path api
    Logger.debug(`[treeshake] purgeUnusedImportsFromIndex: Removing ${modulePath} from ${indexFilePath}`);
    const extensionless = changeExtension(modulePath, '');
    const importPath = './' + relative(dirname(indexFilePath), extensionless);
    const importRegex = generateImportRegex(importPath);
    const results = importRegex.exec(indexFileContent);
    if (results) {
      let namedImports: string = null;
      if (results.length >= 2) {
        namedImports = results[1];
      }
      indexFileContent = indexFileContent.replace(importRegex, '');
      const exportRegex = generateExportRegex(importPath);
      const exportResults = exportRegex.exec(indexFileContent);
      if (exportResults) {
        indexFileContent = indexFileContent.replace(exportRegex, '');
      }
    }
  }
  return indexFileContent;
}

function generateImportRegex(relativeImportPath: string) {
  const cleansedString = escapeStringForRegex(relativeImportPath);
  return new RegExp(`import.*?{(.+)}.*?from.*?'${cleansedString}';`);
}

function generateExportRegex(relativeExportPath: string) {
  const cleansedString = escapeStringForRegex(relativeExportPath);
  return new RegExp(`export.*?{(.+)}.*?from.*?'${cleansedString}';`);
}
