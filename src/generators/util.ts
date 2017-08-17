import { basename, dirname, extname, join, relative, sep } from 'path';
import { readdirSync, existsSync, writeFileSync, openSync, closeSync } from 'fs';
import { Logger } from '../logger/logger';
import { toUnixPath } from '../util/helpers';

import * as Constants from '../util/constants';
import * as GeneratorConstants from './constants';
import { camelCase, constantCase, getStringPropertyValue, mkDirpAsync, paramCase, pascalCase, readFileAsync, replaceAll, sentenceCase, upperCaseFirst, writeFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { globAll, GlobResult } from '../util/glob-util';
import { changeExtension, ensureSuffix, removeSuffix } from '../util/helpers';
import { appendNgModuleDeclaration, appendNgModuleExports, appendNgModuleProvider, insertNamedImportIfNeeded } from '../util/typescript-utils';

export function hydrateRequest(context: BuildContext, request: GeneratorRequest, templateDir: string = getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_TEMPLATE_DIR)) {
  const hydrated = request as HydratedGeneratorRequest;
  const suffix = getSuffixFromGeneratorType(context, request.type);

  hydrated.className = ensureSuffix(pascalCase(request.name), upperCaseFirst(suffix));
  hydrated.fileName = removeSuffix(paramCase(request.name), `-${paramCase(suffix)}`);

  if (request.type === 'pipe') hydrated.pipeName = camelCase(request.name);

  if (!!hydrated.includeNgModule) {
    if (hydrated.type === 'tabs') {
      hydrated.importStatement = `import { IonicPage, NavController } from 'ionic-angular';`;
    } else {
      hydrated.importStatement = `import { IonicPage, NavController, NavParams } from 'ionic-angular';`;
    }
    hydrated.ionicPage = '\n@IonicPage()';
  } else {

    hydrated.ionicPage = null;
    hydrated.importStatement = `import { NavController, NavParams } from 'ionic-angular';`;

  }
  hydrated.dirToRead = join(templateDir, request.type);

  const baseDir = getDirToWriteToByType(context, request.type);
  hydrated.dirToWrite = join(baseDir, hydrated.fileName);
  return hydrated;
}

export function createCommonModule(envVar: string, requestType: string) {
  let className = requestType.charAt(0).toUpperCase() + requestType.slice(1) + 's';
  let tmplt = `import { NgModule } from '@angular/core';\n@NgModule({\n\tdeclarations: [],\n\timports: [],\n\texports: []\n})\nexport class ${className}Module {}\n`;
  writeFileSync(envVar, tmplt);
}

export function hydrateTabRequest(context: BuildContext, request: GeneratorTabRequest) {
  const h = hydrateRequest(context, request);
  const hydrated = Object.assign({
    tabs: request.tabs,
    tabContent: '',
    tabVariables: '',
    tabsImportStatement: '',
  }, h) as HydratedGeneratorRequest;

  if (hydrated.includeNgModule) {
    hydrated.tabsImportStatement += `import { IonicPage, NavController } from 'ionic-angular';`;
  } else {
    hydrated.tabsImportStatement += `import { NavController } from 'ionic-angular';`;
  }

  for (let i = 0; i < request.tabs.length; i++) {
    const tabVar = `${camelCase(request.tabs[i].name)}Root`;

    if (hydrated.includeNgModule) {
      hydrated.tabVariables += `  ${tabVar} = '${request.tabs[i].className}'\n`;
    } else {
      hydrated.tabVariables += `  ${tabVar} = ${request.tabs[i].className}\n`;
    }

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
    fileContent = replaceAll(fileContent, GeneratorConstants.PIPENAME_VARIABLE, request.pipeName);
    fileContent = replaceAll(fileContent, GeneratorConstants.IMPORTSTATEMENT_VARIABLE, request.importStatement);
    fileContent = replaceAll(fileContent, GeneratorConstants.IONICPAGE_VARIABLE, request.ionicPage);
    fileContent = replaceAll(fileContent, GeneratorConstants.FILENAME_VARIABLE, request.fileName);
    fileContent = replaceAll(fileContent, GeneratorConstants.SUPPLIEDNAME_VARIABLE, request.name);
    fileContent = replaceAll(fileContent, GeneratorConstants.TAB_CONTENT_VARIABLE, request.tabContent);
    fileContent = replaceAll(fileContent, GeneratorConstants.TAB_VARIABLES_VARIABLE, request.tabVariables);
    fileContent = replaceAll(fileContent, GeneratorConstants.TABS_IMPORTSTATEMENT_VARIABLE, request.tabsImportStatement);
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

export async function nonPageFileManipulation(context: BuildContext, name: string, ngModulePath: string, type: string) {
  const hydratedRequest = hydrateRequest(context, { type, name });
  const envVar = getStringPropertyValue(`IONIC_${hydratedRequest.type.toUpperCase()}S_NG_MODULE_PATH`);
  let importPath;
  let fileContent: string;
  let templatesArray: string[] = await generateTemplates(context, hydratedRequest, false);
  if (hydratedRequest.type === 'pipe' || hydratedRequest.type === 'component' || hydratedRequest.type === 'directive') {
    if (!existsSync(envVar)) createCommonModule(envVar, hydratedRequest.type);
  }
  const typescriptFilePath = changeExtension(templatesArray.filter(path => extname(path) === '.ts')[0], '');


  readFileAsync(ngModulePath).then((content) => {
    importPath = type === 'pipe' || type === 'component' || type === 'directive'
      // Insert `./` if it's a pipe component or directive
      // Since these will go in a common module.
      ? toUnixPath(`./${relative(dirname(ngModulePath), hydratedRequest.dirToWrite)}${sep}${hydratedRequest.fileName}`)
      : toUnixPath(`${relative(dirname(ngModulePath), hydratedRequest.dirToWrite)}${sep}${hydratedRequest.fileName}`);

    content = insertNamedImportIfNeeded(ngModulePath, content, hydratedRequest.className, importPath);
    if (type === 'pipe' || type === 'component' || type === 'directive') {
      content = appendNgModuleDeclaration(ngModulePath, content, hydratedRequest.className);
      content = appendNgModuleExports(ngModulePath, content, hydratedRequest.className);
    }
    if (type === 'provider') {
      content = appendNgModuleProvider(ngModulePath, content, hydratedRequest.className);
    }
    return writeFileAsync(ngModulePath, content);
  });
}

export function tabsModuleManipulation(tabs: string[][], hydratedRequest: HydratedGeneratorRequest, tabHydratedRequests: HydratedGeneratorRequest[]): Promise<any> {

  tabHydratedRequests.forEach((tabRequest, index) => {
    tabRequest.generatedFileNames = tabs[index];
  });
  const ngModulePath = tabs[0].find((element: any): boolean => element.indexOf('module') !== -1);

  if (!ngModulePath) {
    // Static imports
    const tabsPath = join(hydratedRequest.dirToWrite, `${hydratedRequest.fileName}.ts`);

    let modifiedContent: string = null;
    return readFileAsync(tabsPath).then(content => {
      tabHydratedRequests.forEach((tabRequest) => {
        const typescriptFilePath = changeExtension(tabRequest.generatedFileNames.filter(path => extname(path) === '.ts')[0], '');
        const importPath = toUnixPath(relative(dirname(tabsPath), typescriptFilePath));
        modifiedContent = insertNamedImportIfNeeded(tabsPath, content, tabRequest.className, importPath);
        content = modifiedContent;
      });
      return writeFileAsync(tabsPath, modifiedContent);
    });
  }

}

export function generateTemplates(context: BuildContext, request: HydratedGeneratorRequest, includePageConstants?: boolean): Promise<string[]> {
  Logger.debug('[Generators] generateTemplates: Reading templates ...');

  let pageConstantFile = join(context.pagesDir, 'pages.constants.ts');
  if (includePageConstants && !existsSync(pageConstantFile)) createPageConstants(context);

  return readTemplates(request.dirToRead).then((map: Map<string, string>) => {

    Logger.debug('[Generators] generateTemplates: Filtering out NgModule and Specs if needed ...');
    return filterOutTemplates(request, map);

  }).then((filteredMap: Map<string, string>) => {

    Logger.debug('[Generators] generateTemplates: Applying templates ...');
    const appliedTemplateMap = applyTemplates(request, filteredMap);

    Logger.debug('[Generators] generateTemplates: Writing generated files to disk ...');

    // Adding const to gets some type completion
    if (includePageConstants) createConstStatments(pageConstantFile, request);

    return writeGeneratedFiles(request, appliedTemplateMap);
  });
}

export function createConstStatments(pageConstantFile: string, request: HydratedGeneratorRequest) {
  readFileAsync(pageConstantFile).then((content) => {
    content += `\nexport const ${constantCase(request.className)} = '${request.className}';`;
    writeFileAsync(pageConstantFile, content);
  });
}

export function createPageConstants(context: BuildContext) {
  let pageConstantFile = join(context.pagesDir, 'pages.constants.ts');
  writeFileAsync(pageConstantFile, '//Constants for getting type references');
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
  importStatement?: string;
  ionicPage?: string;
  className?: string;
  tabContent?: string;
  tabVariables?: string;
  tabsImportStatement?: string;
  dirToRead?: string;
  dirToWrite?: string;
  generatedFileNames?: string[];
  pipeName?: string;
}
