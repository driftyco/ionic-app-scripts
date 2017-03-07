import { basename, dirname, join, relative } from 'path';

import {
    ArrayLiteralExpression,
    CallExpression,
    Expression,
    Identifier,
    Node,
    ObjectLiteralExpression,
    PropertyAssignment,
    SourceFile
} from 'typescript';

import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { FileCache } from '../util/file-cache';
import { getStringPropertyValue, replaceAll } from '../util/helpers';
import { DeepLinkConfigEntry, File, HydratedDeepLinkConfigEntry } from '../util/interfaces';
import { getClassDeclarations, getTypescriptSourceFile, getNodeStringContent } from '../util/typescript-utils';

const LOAD_CHILDREN_SPLIT_TOKEN = '#';

/* this is a very temporary approach to extracting deeplink data since the Angular compiler API has changed a bit */

function getLinksArrayContent(appNgModuleFileContent: string) {
  const LINKS_REGEX = /links\s*?:\s*\[([\s\S]*?)}\)/igm;
  const deepLinksContentMatches = LINKS_REGEX.exec(appNgModuleFileContent.toString());
  if (deepLinksContentMatches && deepLinksContentMatches.length === 2) {
    return deepLinksContentMatches[1];
  }
  return null;
}

export function extractDeepLinkPathData(appNgModuleFileContent: string): DeepLinkConfigEntry[] {
  const linksInternalContent = getLinksArrayContent(appNgModuleFileContent);
  if (!linksInternalContent) {
    return null;
  }
  // parse into individual entries
  const results = getIndividualConfigEntries(linksInternalContent);
  // convert each long, multi-element string into it's proper fields
  const deepLinks = results.map(result => convertRawContentStringToParsedDeepLink(result));
  const valid = validateDeepLinks(deepLinks);
  if (!valid) {
    throw new Error('Each deep link entry must contain a "name" entry, and a "component" or "loadChildren" entry');
  }


  return deepLinks;
}

export function validateDeepLinks(deepLinks: DeepLinkConfigEntry[]) {
  for (const deepLink of deepLinks) {
    if (!deepLink.name || deepLink.name.length === 0) {
      return false;
    }
    const missingComponent = !deepLink.component || deepLink.component.length === 0;
    const missingModulePath = !deepLink.modulePath || deepLink.modulePath.length === 0;
    const missingNamedExport = !deepLink.namedExport || deepLink.namedExport.length === 0;

    if (missingComponent && (missingModulePath || missingNamedExport)) {
      return false;
    }
  }
  return true;
}

function convertRawContentStringToParsedDeepLink(input: string): DeepLinkConfigEntry {
  const LOAD_CHILDREN_REGEX = /loadChildren\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
  const NAME_REGEX = /name\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
  const COMPONENT_REGEX = /component\s*?:(.*?)[,}]/igm;
  const loadChildrenValue = extractContentWithKnownMatch(input, LOAD_CHILDREN_REGEX);
  const nameValue = extractContentWithKnownMatch(input, NAME_REGEX);
  const componentValue = extractContentWithKnownMatch(input, COMPONENT_REGEX);
  let modulePath: string = null;
  let namedExport: string = null;
  if (loadChildrenValue) {
    const tokens = loadChildrenValue.split(LOAD_CHILDREN_SPLIT_TOKEN);
    if (tokens.length === 2) {
      modulePath = tokens[0];
      namedExport = tokens[1];
    }
  }

  return {
    component: componentValue,
    name: nameValue,
    modulePath: modulePath,
    namedExport: namedExport
  };
}

function extractContentWithKnownMatch(input: string, regex: RegExp) {
  const result = regex.exec(input);
  if (result && result.length > 1) {
    return result[1].trim();
  }
  return null;
}

function getIndividualConfigEntries(content: string) {
  let match: RegExpExecArray = null;
  const results: string[] = [];
  const INDIVIDUAL_ENTRIES_REGEX = /({.*?})/igm;
  while ((match = INDIVIDUAL_ENTRIES_REGEX.exec(content))) {
    if (!match) {
      break;
    }
    results.push(match[1].trim());
  }
  return results;
}

export function getDeepLinkData(appNgModuleFilePath: string, appNgModuleFileContent: string, isAot: boolean): HydratedDeepLinkConfigEntry[] {
  const deepLinkConfigList = extractDeepLinkPathData(appNgModuleFileContent);
  if (!deepLinkConfigList) {
    return [];
  }
  const appDirectory = dirname(appNgModuleFilePath);
  const absolutePathSuffix = isAot ? '.ngfactory.ts' : '.ts';
  const modulePathSuffix = isAot ? '.ngfactory' : '';
  const namedExportSuffix = isAot ? 'NgFactory' : '';
  const hydratedDeepLinks = deepLinkConfigList.map((deepLinkConfigEntry: DeepLinkConfigEntry) => {
    return Object.assign({}, deepLinkConfigEntry, {
      modulePath: deepLinkConfigEntry.modulePath ? deepLinkConfigEntry.modulePath + modulePathSuffix : null,
      namedExport: deepLinkConfigEntry.namedExport ? deepLinkConfigEntry.namedExport + namedExportSuffix : null,
      absolutePath: deepLinkConfigEntry.modulePath ? join(appDirectory, deepLinkConfigEntry.modulePath + absolutePathSuffix) : null
    }) as HydratedDeepLinkConfigEntry;
  });
  return hydratedDeepLinks;
}

interface ParsedDeepLink {
  component: string;
  name: string;
  loadChildren: string;
};



export function test(typescriptFiles: File[]) {
  typescriptFiles.forEach(file => {
    const sourceFile = getTypescriptSourceFile(file.path, file.content);
    const deepLinkDecoratorData = getDeepLinkDecoratorContentForSourceFile(sourceFile);
    if (deepLinkDecoratorData) {
      // sweet, the page has a DeepLinkDecorator, which means it meets the criteria to process that bad boy

    }

  });
}

export function getNgModulePathFromCorrespondingPage(filePath: string) {
  return join(dirname(filePath), `${basename(filePath, '.ts')}${getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX)}`);
}

export function getRelativePathToPageNgModuleFromAppNgModule(pathToAppNgModule: string, pathToPageNgModule: string) {
  return relative(dirname(pathToAppNgModule), pathToPageNgModule);
}

export function getNgModuleDataFromPage(appNgModuleFilePath: string, filePath: string, fileCache: FileCache) {
  const ngModulePath = getNgModulePathFromCorrespondingPage(filePath);
  const ngModuleFile = fileCache.get(ngModulePath);
  if (!ngModuleFile) {
    throw new Error(`File ${ngModuleFile} is not found`);
  }
  // get the class declaration out of NgModule class content
  const exportedClassName = getNgModuleClassName(ngModuleFile.path, ngModuleFile.content);
  const relativePathToAppNgModule
}

export function getNgModuleClassName(filePath: string, fileContent: string) {
  const ngModuleSourceFile = getTypescriptSourceFile(filePath, fileContent);
  const classDeclarations = getClassDeclarations(ngModuleSourceFile);
  // find the class with NgModule decorator;
  const classNameList: string[] = [];
  classDeclarations.forEach(classDeclaration => {
    if (classDeclaration && classDeclaration.decorators) {
      classDeclaration.decorators.forEach(decorator => {
        if (decorator.expression && (decorator.expression as CallExpression).expression && ((decorator.expression as CallExpression).expression as Identifier).text === NG_MODULE_DECORATOR_TEXT) {
          const className = (classDeclaration.name as Identifier).text;
          classNameList.push(className);
        }
      });
    }
  });

  if (classNameList.length === 0) {
    throw new Error(`Could not class name declaration in ${filePath}`);
  }

  if (classNameList.length > 1) {
    throw new Error(`Multiple class class declarations with NgModule in ${filePath}. Could not determine the correct one`);
  }

  return classNameList[0];
}

export function getDeepLinkDecoratorContentForSourceFile(sourceFile: SourceFile): DeepLinkDecoratorAndClass {
  const classDeclarations = getClassDeclarations(sourceFile);

  const list: DeepLinkDecoratorAndClass[] = [];

  classDeclarations.forEach(classDeclaration => {
    const className = (classDeclaration.name as Identifier).text;
    classDeclaration.decorators.forEach(decorator => {
      if (decorator.expression && (decorator.expression as CallExpression).expression && ((decorator.expression as CallExpression).expression as Identifier).text === DEEPLINK_DECORATOR_TEXT) {
        const deepLinkArgs = (decorator.expression as CallExpression).arguments;
        let deepLinkObject: ObjectLiteralExpression = null;
        if (deepLinkArgs && deepLinkArgs.length) {
          deepLinkObject = deepLinkArgs[0] as ObjectLiteralExpression;
        }
        let propertyList: Node[] = [];
        if (deepLinkObject && deepLinkObject.properties) {
          propertyList = deepLinkObject.properties;
        }

        const deepLinkName = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, className, DEEPLINK_DECORATOR_NAME_ATTRIBUTE);
        const deepLinkSegment = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, null, DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE);
        const deepLinkPriority = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, 'low', DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE);
        const deepLinkDefaultHistory = getArrayValueFromDeepLinkDecorator(sourceFile, propertyList, [], DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE);
        const rawStringContent = getNodeStringContent(sourceFile, decorator.expression);
        list.push({
          name: deepLinkName,
          segment: deepLinkSegment,
          priority: deepLinkPriority,
          defaultHistory: deepLinkDefaultHistory,
          rawString: rawStringContent
        });
      }
    });
  });

  if (list.length > 1) {
    throw new Error('Only one @DeepLink decorator is allowed per file.');
  }

  if (list.length === 1) {
    return list[0];
  }
  return null;
}

function getStringValueFromDeepLinkDecorator(sourceFile: SourceFile, propertyNodeList: Node[], defaultValue: string, identifierToLookFor: string) {
  try {
    let valueToReturn = defaultValue;
    Logger.debug(`[DeepLinking util] getNameValueFromDeepLinkDecorator: Setting default deep link ${identifierToLookFor} to ${defaultValue}`);
    propertyNodeList.forEach(propertyNode => {
      if (propertyNode && (propertyNode as PropertyAssignment).name && ((propertyNode as PropertyAssignment).name as Identifier).text === identifierToLookFor) {
        const initializer = ((propertyNode as PropertyAssignment).initializer as Expression);
        let stringContent = getNodeStringContent(sourceFile, initializer);
        stringContent = replaceAll(stringContent, '\'', '');
        stringContent = replaceAll(stringContent, '`', '');
        stringContent = replaceAll(stringContent, '"', '');
        stringContent = stringContent.trim();
        valueToReturn = stringContent;
      }
    });
    Logger.debug(`[DeepLinking util] getNameValueFromDeepLinkDecorator: DeepLink ${identifierToLookFor} set to ${valueToReturn}`);
    return valueToReturn;
  } catch (ex) {
    Logger.error(`Failed to parse the @DeepLink decorator. The ${identifierToLookFor} must be an array of strings`);
    throw ex;
  }
}

function getArrayValueFromDeepLinkDecorator(sourceFile: SourceFile, propertyNodeList: Node[], defaultValue: string[], identifierToLookFor: string) {
  try {
    let valueToReturn = defaultValue;
    Logger.debug(`[DeepLinking util] getArrayValueFromDeepLinkDecorator: Setting default deep link ${identifierToLookFor} to ${defaultValue}`);
    propertyNodeList.forEach(propertyNode => {
      if (propertyNode && (propertyNode as PropertyAssignment).name && ((propertyNode as PropertyAssignment).name as Identifier).text === identifierToLookFor) {
        const initializer = ((propertyNode as PropertyAssignment).initializer as ArrayLiteralExpression);
        if (initializer && initializer.elements) {
          const stringArray = initializer.elements.map((element: Identifier)  => {
            let elementText = element.text;
            elementText = replaceAll(elementText, '\'', '');
            elementText = replaceAll(elementText, '`', '');
            elementText = replaceAll(elementText, '"', '');
            elementText = elementText.trim();
            return elementText;
          });
          valueToReturn = stringArray;
        }
      }
    });
    Logger.debug(`[DeepLinking util] getNameValueFromDeepLinkDecorator: DeepLink ${identifierToLookFor} set to ${valueToReturn}`);
    return valueToReturn;
  } catch (ex) {
    Logger.error(`Failed to parse the @DeepLink decorator. The ${identifierToLookFor} must be an array of strings`);
    throw ex;
  }
}

const DEEPLINK_DECORATOR_TEXT = 'DeepLink';
const NG_MODULE_DECORATOR_TEXT = 'NgModule';
const DEEPLINK_DECORATOR_NAME_ATTRIBUTE = 'name';
const DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE = 'segment';
const DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE = 'priority';
const DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE = 'defaultHistory';

export interface DeepLinkDecoratorAndClass {
  name: string;
  segment: string;
  defaultHistory: string[];
  priority: string;
  rawString: string;
};
