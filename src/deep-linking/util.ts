import { dirname, extname, relative } from 'path';

import {
    ArrayLiteralExpression,
    CallExpression,
    Decorator,
    Expression,
    Identifier,
    Node,
    ObjectLiteralExpression,
    PropertyAccessExpression,
    PropertyAssignment,
    SourceFile,
    SyntaxKind
} from 'typescript';

import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { FileCache } from '../util/file-cache';
import { changeExtension, getStringPropertyValue, replaceAll } from '../util/helpers';
import { DeepLinkConfigEntry, DeepLinkDecoratorAndClass, DeepLinkPathInfo } from '../util/interfaces';
import { getClassDeclarations, getTypescriptSourceFile, getNodeStringContent } from '../util/typescript-utils';

export function getDeepLinkData(appNgModuleFilePath: string, fileCache: FileCache, isAot: boolean): DeepLinkConfigEntry[] {
  const typescriptFiles = fileCache.getAll().filter(file => extname(file.path) === '.ts');
  const deepLinkConfigEntries: DeepLinkConfigEntry[] = [];
  typescriptFiles.forEach(file => {
    const sourceFile = getTypescriptSourceFile(file.path, file.content);
    const deepLinkDecoratorData = getDeepLinkDecoratorContentForSourceFile(sourceFile);

    if (deepLinkDecoratorData) {
      // sweet, the page has a DeepLinkDecorator, which means it meets the criteria to process that bad boy
      const pathInfo = getNgModuleDataFromPage(appNgModuleFilePath, file.path, fileCache, isAot);
      const deepLinkConfigEntry = Object.assign({}, deepLinkDecoratorData, pathInfo);
      deepLinkConfigEntries.push(deepLinkConfigEntry);
    }
  });
  return deepLinkConfigEntries;
}

export function getNgModulePathFromCorrespondingPage(filePath: string) {
  const newExtension = getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
  return changeExtension(filePath, newExtension);
}

export function getRelativePathToPageNgModuleFromAppNgModule(pathToAppNgModule: string, pathToPageNgModule: string) {
  return relative(dirname(pathToAppNgModule), pathToPageNgModule);
}

export function getNgModuleDataFromPage(appNgModuleFilePath: string, filePath: string, fileCache: FileCache, isAot: boolean): DeepLinkPathInfo {
  const ngModulePath = getNgModulePathFromCorrespondingPage(filePath);
  const ngModuleFile = fileCache.get(ngModulePath);
  if (!ngModuleFile) {
    throw new Error(`${filePath} has a @DeepLink decorator, but it does not have a corresponding "NgModule" at ${ngModulePath}`);
  }
  // get the class declaration out of NgModule class content
  const exportedClassName = getNgModuleClassName(ngModuleFile.path, ngModuleFile.content);
  const relativePathToAppNgModule = getRelativePathToPageNgModuleFromAppNgModule(appNgModuleFilePath, ngModulePath);

  const absolutePath = isAot ? changeExtension(ngModulePath, '.ngfactory.ts') : ngModulePath;
  const userlandModulePath = isAot ? changeExtension(relativePathToAppNgModule, '.ngfactory') : changeExtension(relativePathToAppNgModule, '');
  const namedExport = isAot ? `${exportedClassName}NgFactory` : exportedClassName;

  return {
    absolutePath: absolutePath,
    userlandModulePath: userlandModulePath,
    className: namedExport
  };
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
    throw new Error(`Could not find a class declaration in ${filePath}`);
  }

  if (classNameList.length > 1) {
    throw new Error(`Multiple class declarations with NgModule in ${filePath}. The correct class to use could not be determined.`);
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

export function hasExistingDeepLinkConfig(appNgModuleFilePath: string, appNgModuleFileContent: string) {
  const sourceFile = getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
  const decorator = getAppNgModuleDecorator(appNgModuleFilePath, sourceFile);
  const functionCall = getIonicModuleForRootCall(decorator);

  if (functionCall.arguments.length <= 2) {
    return false;
  }

  const deepLinkConfigArg = functionCall.arguments[2];
  return deepLinkConfigArg.kind === SyntaxKind.ObjectLiteralExpression;
}

function getAppNgModuleDecorator(appNgModuleFilePath: string, sourceFile: SourceFile) {
  const ngModuleDecorators: Decorator[] = [];
  const classDeclarations = getClassDeclarations(sourceFile);
  classDeclarations.forEach(classDeclaration => {
    if (classDeclaration && classDeclaration.decorators) {
      classDeclaration.decorators.forEach(decorator => {
        if (decorator.expression && (decorator.expression as CallExpression).expression && ((decorator.expression as CallExpression).expression as Identifier).text === NG_MODULE_DECORATOR_TEXT) {
          ngModuleDecorators.push(decorator);
        }
      });
    }
  });

  if (ngModuleDecorators.length === 0) {
    throw new Error(`Could not find an "NgModule" decorator in ${appNgModuleFilePath}`);
  }

  if (ngModuleDecorators.length > 1) {
    throw new Error(`Multiple "NgModule" decorators found in ${appNgModuleFilePath}. The correct one to use could not be determined`);
  }

  return ngModuleDecorators[0];
}

function getNgModuleObjectLiteralArg(decorator: Decorator) {
  const ngModuleArgs = (decorator.expression as CallExpression).arguments;
  if (!ngModuleArgs || ngModuleArgs.length === 0 || ngModuleArgs.length > 1) {
    throw new Error(`Invalid NgModule Argument`);
  }
  return ngModuleArgs[0] as ObjectLiteralExpression;
}

function getIonicModuleForRootCall(decorator: Decorator) {
  const argument = getNgModuleObjectLiteralArg(decorator);
  const properties = argument.properties.filter((property: PropertyAssignment) => {
    return (property.name as Identifier).text === NG_MODULE_IMPORT_DECLARATION;
  });

  if (properties.length === 0) {
    throw new Error('Could not find "import" property in NgModule arguments');
  }

  if (properties.length > 1) {
    throw new Error('Found multiple "import" properties in NgModule arguments. Only one is allowed');
  }

  const property = properties[0] as PropertyAssignment;
  const importArrayLiteral = property.initializer as ArrayLiteralExpression;
  const functionsInImport = importArrayLiteral.elements.filter(element => {
    return element.kind === SyntaxKind.CallExpression;
  });

  const ionicModuleFunctionCalls = functionsInImport.filter((functionNode: CallExpression) => {

    return (functionNode.expression
      && (functionNode.expression as PropertyAccessExpression).name
      && (functionNode.expression as PropertyAccessExpression).name.text === FOR_ROOT_METHOD
      && ((functionNode.expression as PropertyAccessExpression).expression as Identifier)
      && ((functionNode.expression as PropertyAccessExpression).expression as Identifier).text === IONIC_MODULE_NAME);
  });

  if (ionicModuleFunctionCalls.length === 0) {
    throw new Error('Could not find IonicModule.forRoot call in "imports"');
  }

  if (ionicModuleFunctionCalls.length > 1) {
    throw new Error('Found multiple IonicModule.forRoot calls in "imports". Only one is allowed');
  }

  return ionicModuleFunctionCalls[0] as CallExpression;
}

export function convertDeepLinkConfigEntriesToString(entries: DeepLinkConfigEntry[]) {
  const individualLinks = entries.map(entry => convertDeepLinkEntryToJsObjectString(entry));
  const deepLinkConfigString =
`
{
  links: [
    ${individualLinks.join(',\n    ')}
  ]
}`;
  return deepLinkConfigString;
}

export function convertDeepLinkEntryToJsObjectString(entry: DeepLinkConfigEntry) {
  const defaultHistoryWithQuotes = entry.defaultHistory.map(defaultHistoryEntry => `'${defaultHistoryEntry}'`);
  const segmentString = entry.segment && entry.segment.length ? `'${entry.segment}'` : null;
  return `{ loadChildren: '${entry.userlandModulePath}${LOAD_CHILDREN_SEPARATOR}${entry.className}', name: '${entry.name}', segment: ${segmentString}, priority: '${entry.priority}', defaultHistory: [${defaultHistoryWithQuotes.join(', ')}] }`;
}

const DEEPLINK_DECORATOR_TEXT = 'DeepLink';
const NG_MODULE_DECORATOR_TEXT = 'NgModule';
const DEEPLINK_DECORATOR_NAME_ATTRIBUTE = 'name';
const DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE = 'segment';
const DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE = 'priority';
const DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE = 'defaultHistory';

const NG_MODULE_IMPORT_DECLARATION = 'imports';
const IONIC_MODULE_NAME = 'IonicModule';
const FOR_ROOT_METHOD = 'forRoot';
const LOAD_CHILDREN_SEPARATOR = '#';
