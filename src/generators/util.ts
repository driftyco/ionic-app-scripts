import { basename, dirname, join, relative, sep } from 'path';
import { readdirSync } from 'fs';
import { Logger} from '../logger/logger';
import { toUnixPath } from '../util/helpers';

import * as Constants from '../util/constants';
import * as GeneratorConstants from './constants';
import { camelCase, getStringPropertyValue, mkDirpAsync, paramCase, pascalCase, readFileAsync, replaceAll, sentenceCase, upperCaseFirst, writeFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { globAll, GlobResult } from '../util/glob-util';
import { ensureSuffix, removeSuffix } from '../util/helpers';
import { appendNgModuleDeclaration, insertNamedImportIfNeeded } from '../util/typescript-utils';

export function hydrateRequest(context: BuildContext, request: GeneratorRequest) {
  const hydrated = Object.assign({ includeNgModule: true }, request) as HydratedGeneratorRequest;
  const suffix = getSuffixFromGeneratorType(context, request.type);

  hydrated.className = ensureSuffix(pascalCase(request.name), upperCaseFirst(suffix));
  hydrated.fileName = removeSuffix(paramCase(request.name), `-${paramCase(suffix)}`);

  hydrated.dirToRead = join(getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_TEMPLATE_DIR), request.type);

  const baseDir = getDirToWriteToByType(context, request.type);
  hydrated.dirToWrite = join(baseDir, hydrated.fileName);

  return hydrated;
}

export function hydrateTabRequest(context: BuildContext, request: GeneratorTabRequest) {
  const h = hydrateRequest(context, request);
  const hydrated = Object.assign({
    tabs: request.tabs,
    tabContent: '',
    tabVariables: ''
  }, h) as HydratedGeneratorRequest;

  for (let i = 0; i < request.tabs.length; i++) {
    const tabVar = `${camelCase(request.tabs[i].name)}Root`;
    hydrated.tabVariables += `  ${tabVar} = '${request.tabs[i].className}'\n`;

    // If this is the last ion-tab to insert
    // then we do not want a new line
    if (i === request.tabs.length - 1) {
      hydrated.tabContent += `    <ion-tab [root]="${tabVar}" tabTitle="${sentenceCase(request.tabs[i].name)}" tabIcon="information-circle"></ion-tab>`;
    } else {
      hydrated.tabContent += `    <ion-tab [root]="${tabVar}" tabTitle="${sentenceCase(request.tabs[i].name)}" tabIcon="information-circle"></ion-tab>\n`;
    }
  }

  return hydrated;
}

export function readTemplates(pathToRead: string): Promise<Map<string, string>> {
  const fileNames = readdirSync(pathToRead);
  const absolutePaths = fileNames.map(fileName => {
    return join(pathToRead, fileName);
  });
  const filePathToContent = new Map<string, string>();
  const promises = absolutePaths.map(absolutePath => {
    const promise = readFileAsync(absolutePath);
    promise.then((fileContent: string) => {
      filePathToContent.set(absolutePath, fileContent);
    });
    return promise;
  });
  return Promise.all(promises).then(() => {
    return filePathToContent;
  });
}

export function filterOutTemplates(request: HydratedGeneratorRequest, templates: Map<string, string>) {
  const templatesToUseMap = new Map<string, string>();
  templates.forEach((fileContent: string, filePath: string) => {
    const newFileExtension = basename(filePath, GeneratorConstants.KNOWN_FILE_EXTENSION);
    const shouldSkip = (!request.includeNgModule && newFileExtension === GeneratorConstants.NG_MODULE_FILE_EXTENSION) || (!request.includeSpec && newFileExtension === GeneratorConstants.SPEC_FILE_EXTENSION);
    if (!shouldSkip) {
      templatesToUseMap.set(filePath, fileContent);
    }
  });
  return templatesToUseMap;
}

export function applyTemplates(request: HydratedGeneratorRequest, templates: Map<string, string>) {
  const appliedTemplateMap = new Map<string, string>();
  templates.forEach((fileContent: string, filePath: string) => {
    fileContent = replaceAll(fileContent, GeneratorConstants.CLASSNAME_VARIABLE, request.className);
    fileContent = replaceAll(fileContent, GeneratorConstants.FILENAME_VARIABLE, request.fileName);
    fileContent = replaceAll(fileContent, GeneratorConstants.SUPPLIEDNAME_VARIABLE, request.name);
    fileContent = replaceAll(fileContent, GeneratorConstants.TAB_CONTENT_VARIABLE, request.tabContent);
    fileContent = replaceAll(fileContent, GeneratorConstants.TAB_VARIABLES_VARIABLE, request.tabVariables);
    appliedTemplateMap.set(filePath, fileContent);
  });
  return appliedTemplateMap;
}

export function writeGeneratedFiles(request: HydratedGeneratorRequest, processedTemplates: Map<string, string>): Promise<string[]> {
  const promises: Promise<any>[] = [];
  const createdFileList: string[] = [];
  processedTemplates.forEach((fileContent: string, filePath: string) => {
    const newFileExtension = basename(filePath, GeneratorConstants.KNOWN_FILE_EXTENSION);
    const newFileName = `${request.fileName}.${newFileExtension}`;
    const fileToWrite = join(request.dirToWrite, newFileName);
    createdFileList.push(fileToWrite);
    promises.push(createDirAndWriteFile(fileToWrite, fileContent));
  });
  return Promise.all(promises).then(() => {
    return createdFileList;
  });
}

function createDirAndWriteFile(filePath: string, fileContent: string) {
  const directory = dirname(filePath);
  return mkDirpAsync(directory).then(() => {
    return writeFileAsync(filePath, fileContent);
  });
}

export function getNgModules(context: BuildContext, types: string[]): Promise<GlobResult[]> {
  const ngModuleSuffix = getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
  const patterns = types.map((type) => join(getDirToWriteToByType(context, type), '**', `*${ngModuleSuffix}`));
  return globAll(patterns);
}

function getSuffixFromGeneratorType(context: BuildContext, type: string) {
  if (type === Constants.COMPONENT) {
    return 'Component';
  } else if (type === Constants.DIRECTIVE) {
    return 'Directive';
  } else if (type === Constants.PAGE || type === Constants.TABS) {
    return 'Page';
  } else if (type === Constants.PIPE) {
    return 'Pipe';
  } else if (type === Constants.PROVIDER) {
    return 'Provider';
  }
  throw new Error(`Unknown Generator Type: ${type}`);
}

export function getDirToWriteToByType(context: BuildContext, type: string) {
  if (type === Constants.COMPONENT) {
    return context.componentsDir;
  } else if (type === Constants.DIRECTIVE) {
    return context.directivesDir;
  } else if (type === Constants.PAGE || type === Constants.TABS) {
    return context.pagesDir;
  } else if (type === Constants.PIPE) {
    return context.pipesDir;
  } else if (type === Constants.PROVIDER) {
    return context.providersDir;
  }
  throw new Error(`Unknown Generator Type: ${type}`);
}

export function nonPageFileManipulation(context: BuildContext, name: string, ngModulePath: string, type: string) {
  const hydratedRequest = hydrateRequest(context, { type, name });
  let fileContent: string;
  return readFileAsync(ngModulePath).then((content) => {
    fileContent = content;
    return generateTemplates(context, hydratedRequest);
  }).then(() => {
    const importPath = toUnixPath(`${relative(dirname(ngModulePath), hydratedRequest.dirToWrite)}${sep}${hydratedRequest.fileName}`);

    fileContent = insertNamedImportIfNeeded(ngModulePath, fileContent, hydratedRequest.className, importPath);
    if (type === 'provider') {
      fileContent = appendNgModuleDeclaration(ngModulePath, fileContent, hydratedRequest.className, type);
    } else {
      fileContent = appendNgModuleDeclaration(ngModulePath, fileContent, hydratedRequest.className);
    }
    return writeFileAsync(ngModulePath, fileContent);
  });
}

export function tabsModuleManipulation(tabs: string[][], hydratedRequest: HydratedGeneratorRequest, tabHydratedRequests: HydratedGeneratorRequest[]): Promise<any> {
  const ngModulePath = tabs[0].find((element: any): boolean => {
    return element.indexOf('module') !== -1;
  });
  const tabsNgModulePath = `${hydratedRequest.dirToWrite}${sep}${hydratedRequest.fileName}.module.ts`;
  const importPath = toUnixPath(relative(dirname(tabsNgModulePath), ngModulePath.replace('.module.ts', '')));

  return readFileAsync(tabsNgModulePath).then((content) => {
    let fileContent = content;
    fileContent = insertNamedImportIfNeeded(tabsNgModulePath, fileContent, tabHydratedRequests[0].className, importPath);
    fileContent = appendNgModuleDeclaration(tabsNgModulePath, fileContent, tabHydratedRequests[0].className);

    return writeFileAsync(tabsNgModulePath, fileContent);
  });
}

export function generateTemplates(context: BuildContext, request: HydratedGeneratorRequest): Promise<string[]> {
  Logger.debug('[Generators] generateTemplates: Reading templates ...');
  return readTemplates(request.dirToRead).then((map: Map<string, string>) => {
    Logger.debug('[Generators] generateTemplates: Filtering out NgModule and Specs if needed ...');
    return filterOutTemplates(request, map);
  }).then((filteredMap: Map<string, string>) => {
    Logger.debug('[Generators] generateTemplates: Applying templates ...');
    const appliedTemplateMap = applyTemplates(request, filteredMap);
    Logger.debug('[Generators] generateTemplates: Writing generated files to disk ...');
    return writeGeneratedFiles(request, appliedTemplateMap);
  });
}

export interface GeneratorOption {
  type: string;
  multiple: boolean;
}

export interface GeneratorRequest {
  type?: string;
  name?: string;
  includeSpec?: boolean;
  includeNgModule?: boolean;
}

export interface GeneratorTabRequest extends GeneratorRequest {
  tabs?: HydratedGeneratorRequest[];
}

export interface HydratedGeneratorRequest extends GeneratorRequest {
  fileName?: string;
  className?: string;
  tabContent?: string;
  tabVariables?: string;
  dirToRead?: string;
  dirToWrite?: string;
}
