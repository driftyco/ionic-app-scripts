import { basename, dirname, extname, relative, sep } from 'path';

import {
  ArrayLiteralExpression,
  CallExpression,
  ClassDeclaration,
  createClassDeclaration,
  createIdentifier,
  createNamedImports,
  Decorator,
  Expression,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  NamedImports,
  Node,
  NodeArray,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  PropertyAssignment,
  SourceFile,
  StringLiteral,
  SyntaxKind,
  TransformationContext,
  TransformerFactory,
  updateCall,
  updateClassDeclaration,
  updateImportClause,
  updateImportDeclaration,
  updateSourceFile,
  visitEachChild,
  VisitResult
} from 'typescript';

import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { FileCache } from '../util/file-cache';
import { changeExtension, getParsedDeepLinkConfig, getStringPropertyValue, replaceAll, toUnixPath } from '../util/helpers';
import { BuildContext, ChangedFile, DeepLinkConfigEntry, DeepLinkDecoratorAndClass, DeepLinkPathInfo, File } from '../util/interfaces';
import {
  NG_MODULE_DECORATOR_TEXT,
  appendAfter,
  findNodes,
  getClassDeclarations,
  getNgModuleClassName,
  getNgModuleDecorator,
  getNgModuleObjectLiteralArg,
  getTypescriptSourceFile,
  getNodeStringContent,
  replaceNode,
} from '../util/typescript-utils';

import { transpileTsString } from '../transpile';

export function getDeepLinkData(appNgModuleFilePath: string, fileCache: FileCache, isAot: boolean): Map<string, DeepLinkConfigEntry> {
  // we only care about analyzing a subset of typescript files, so do that for efficiency
  const typescriptFiles = filterTypescriptFilesForDeepLinks(fileCache);
  const deepLinkConfigEntries = new Map<string, DeepLinkConfigEntry>();
  const segmentSet = new Set<string>();
  typescriptFiles.forEach(file => {
    const sourceFile = getTypescriptSourceFile(file.path, file.content);
    const deepLinkDecoratorData = getDeepLinkDecoratorContentForSourceFile(sourceFile);

    if (deepLinkDecoratorData) {
      // sweet, the page has a DeepLinkDecorator, which means it meets the criteria to process that bad boy
      const pathInfo = getNgModuleDataFromPage(appNgModuleFilePath, file.path, deepLinkDecoratorData.className, fileCache, isAot);
      const deepLinkConfigEntry = Object.assign({}, deepLinkDecoratorData, pathInfo);

      if (deepLinkConfigEntries.has(deepLinkConfigEntry.name)) {
        // gadzooks, it's a duplicate name
        throw new Error(`There are multiple entries in the deeplink config with the name of ${deepLinkConfigEntry.name}`);
      }

      if (segmentSet.has(deepLinkConfigEntry.segment)) {
        // gadzooks, it's a duplicate segment
        throw new Error(`There are multiple entries in the deeplink config with the segment of ${deepLinkConfigEntry.segment}`);
      }

      segmentSet.add(deepLinkConfigEntry.segment);
      deepLinkConfigEntries.set(deepLinkConfigEntry.name, deepLinkConfigEntry);
    }
  });
  return deepLinkConfigEntries;
}

export function filterTypescriptFilesForDeepLinks(fileCache: FileCache): File[] {
  return fileCache.getAll().filter(file => isDeepLinkingFile(file.path));
}

export function isDeepLinkingFile(filePath: string) {
  const deepLinksDir = getStringPropertyValue(Constants.ENV_VAR_DEEPLINKS_DIR) + sep;
  const moduleSuffix = getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
  const result = extname(filePath) === '.ts' && filePath.indexOf(moduleSuffix) === -1 && filePath.indexOf(deepLinksDir) >= 0;
  return result;
}

export function getNgModulePathFromCorrespondingPage(filePath: string) {
  const newExtension = getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
  return changeExtension(filePath, newExtension);
}

export function getRelativePathToPageNgModuleFromAppNgModule(pathToAppNgModule: string, pathToPageNgModule: string) {
  return relative(dirname(pathToAppNgModule), pathToPageNgModule);
}

export function getNgModuleDataFromPage(appNgModuleFilePath: string, filePath: string, className: string, fileCache: FileCache, isAot: boolean): DeepLinkPathInfo {
  const ngModulePath = getNgModulePathFromCorrespondingPage(filePath);
  let ngModuleFile = fileCache.get(ngModulePath);
  if (!ngModuleFile) {
    throw new Error(`${filePath} has a @IonicPage decorator, but it does not have a corresponding "NgModule" at ${ngModulePath}`);
  }
  // get the class declaration out of NgModule class content
  const exportedClassName = getNgModuleClassName(ngModuleFile.path, ngModuleFile.content);
  const relativePathToAppNgModule = getRelativePathToPageNgModuleFromAppNgModule(appNgModuleFilePath, ngModulePath);

  const absolutePath = isAot ? changeExtension(ngModulePath, '.ngfactory.js') : changeExtension(ngModulePath, '.ts');
  const userlandModulePath = isAot ? changeExtension(relativePathToAppNgModule, '.ngfactory') : changeExtension(relativePathToAppNgModule, '');
  const namedExport = isAot ? `${exportedClassName}NgFactory` : exportedClassName;

  return {
    absolutePath: absolutePath,
    userlandModulePath: toUnixPath(userlandModulePath),
    className: namedExport
  };
}

export function getDeepLinkDecoratorContentForSourceFile(sourceFile: SourceFile): DeepLinkDecoratorAndClass {
  const classDeclarations = getClassDeclarations(sourceFile);
  const defaultSegment = basename(changeExtension(sourceFile.fileName, ''));
  const list: DeepLinkDecoratorAndClass[] = [];

  classDeclarations.forEach(classDeclaration => {
    if (classDeclaration.decorators) {
      classDeclaration.decorators.forEach(decorator => {
        const className = (classDeclaration.name as Identifier).text;
        if (decorator.expression && (decorator.expression as CallExpression).expression && ((decorator.expression as CallExpression).expression as Identifier).text === DEEPLINK_DECORATOR_TEXT) {

          const deepLinkArgs = (decorator.expression as CallExpression).arguments;
          let deepLinkObject: ObjectLiteralExpression = null;
          if (deepLinkArgs && deepLinkArgs.length) {
            deepLinkObject = deepLinkArgs[0] as ObjectLiteralExpression;
          }
          let propertyList: Node[] = [];
          if (deepLinkObject && deepLinkObject.properties) {
            propertyList = deepLinkObject.properties as any as Node[]; // TODO this typing got jacked up
          }

          const deepLinkName = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, className, DEEPLINK_DECORATOR_NAME_ATTRIBUTE);
          const deepLinkSegment = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, defaultSegment, DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE);
          const deepLinkPriority = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, 'low', DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE);
          const deepLinkDefaultHistory = getArrayValueFromDeepLinkDecorator(sourceFile, propertyList, [], DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE);
          const rawStringContent = getNodeStringContent(sourceFile, decorator.expression);
          list.push({
            name: deepLinkName,
            segment: deepLinkSegment,
            priority: deepLinkPriority,
            defaultHistory: deepLinkDefaultHistory,
            rawString: rawStringContent,
            className: className
          });
        }
      });
    }
  });

  if (list.length > 1) {
    throw new Error('Only one @IonicPage decorator is allowed per file.');
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
    Logger.error(`Failed to parse the @IonicPage decorator. The ${identifierToLookFor} must be an array of strings`);
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
    Logger.error(`Failed to parse the @IonicPage decorator. The ${identifierToLookFor} must be an array of strings`);
    throw ex;
  }
}

export function hasExistingDeepLinkConfig(appNgModuleFilePath: string, appNgModuleFileContent: string) {
  const sourceFile = getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
  const decorator = getNgModuleDecorator(appNgModuleFilePath, sourceFile);
  const functionCall = getIonicModuleForRootCall(decorator);

  if (functionCall.arguments.length <= 2) {
    return false;
  }

  const deepLinkConfigArg = functionCall.arguments[2];
  if (deepLinkConfigArg.kind === SyntaxKind.NullKeyword || deepLinkConfigArg.kind === SyntaxKind.UndefinedKeyword) {
    return false;
  }

  if (deepLinkConfigArg.kind === SyntaxKind.ObjectLiteralExpression) {
    return true;
  }

  if ((deepLinkConfigArg as Identifier).text && (deepLinkConfigArg as Identifier).text.length > 0) {
    return true;
  }
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

export function convertDeepLinkConfigEntriesToString(entries: Map<string, DeepLinkConfigEntry>) {
  const individualLinks: string[] = [];
  entries.forEach(entry => {
    individualLinks.push(convertDeepLinkEntryToJsObjectString(entry));
  });
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
  const segmentString = entry.segment ? `'${entry.segment}'` : null;
  return `{ loadChildren: '${entry.userlandModulePath}${LOAD_CHILDREN_SEPARATOR}${entry.className}', name: '${entry.name}', segment: ${segmentString}, priority: '${entry.priority}', defaultHistory: [${defaultHistoryWithQuotes.join(', ')}] }`;
}

export function updateAppNgModuleWithDeepLinkConfig(context: BuildContext, deepLinkString: string, changedFiles: ChangedFile[]) {
  const appNgModulePath = getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
  const appNgModuleFile = context.fileCache.get(appNgModulePath);

  if (!appNgModuleFile) {
    throw new Error(`App NgModule ${appNgModulePath} not found in cache`);
  }

  const updatedAppNgModuleContent = getUpdatedAppNgModuleContentWithDeepLinkConfig(appNgModulePath, appNgModuleFile.content, deepLinkString);
  context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: updatedAppNgModuleContent});

  if (changedFiles) {
    changedFiles.push({
      event: 'change',
      filePath: appNgModulePath,
      ext: extname(appNgModulePath).toLowerCase()
    });
  }
}

export function getUpdatedAppNgModuleContentWithDeepLinkConfig(appNgModuleFilePath: string, appNgModuleFileContent: string, deepLinkStringContent: string) {
  let sourceFile = getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
  let decorator = getNgModuleDecorator(appNgModuleFilePath, sourceFile);
  let functionCall = getIonicModuleForRootCall(decorator);

  if (functionCall.arguments.length === 1) {
    appNgModuleFileContent = addDefaultSecondArgumentToAppNgModule(appNgModuleFileContent, functionCall);
    sourceFile = getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
    decorator = getNgModuleDecorator(appNgModuleFilePath, sourceFile);
    functionCall = getIonicModuleForRootCall(decorator);
  }

  if (functionCall.arguments.length === 2) {
    // we need to add the node
    return addDeepLinkArgumentToAppNgModule(appNgModuleFileContent, functionCall, deepLinkStringContent);
  }
  // we need to replace whatever node exists here with the deeplink config
  return replaceNode(appNgModuleFilePath, appNgModuleFileContent, functionCall.arguments[2], deepLinkStringContent);
}

export function getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig(appNgModuleFactoryFileContent: string, deepLinkStringContent: string) {
  // tried to do this with typescript API, wasn't clear on how to do it
  const regex = /this.*?DeepLinkConfigToken.*?=([\s\S]*?);/g;
  const results = regex.exec(appNgModuleFactoryFileContent);
  if (results && results.length === 2) {
    const actualString = results[0];
    const chunkToReplace = results[1];
    const fullStringToReplace = actualString.replace(chunkToReplace, deepLinkStringContent);
    return appNgModuleFactoryFileContent.replace(actualString, fullStringToReplace);
  }

  throw new Error('The RegExp to find the DeepLinkConfigToken did not return valid data');
}

export function addDefaultSecondArgumentToAppNgModule(appNgModuleFileContent: string, ionicModuleForRoot: CallExpression) {
  const argOneNode = ionicModuleForRoot.arguments[0];
  const updatedFileContent = appendAfter(appNgModuleFileContent, argOneNode, ', {}');
  return updatedFileContent;
}

export function addDeepLinkArgumentToAppNgModule(appNgModuleFileContent: string, ionicModuleForRoot: CallExpression, deepLinkString: string) {
  const argTwoNode = ionicModuleForRoot.arguments[1];
  const updatedFileContent = appendAfter(appNgModuleFileContent, argTwoNode, `, ${deepLinkString}`);
  return updatedFileContent;
}

export function generateDefaultDeepLinkNgModuleContent(pageFilePath: string, className: string) {
  const importFrom = basename(pageFilePath, '.ts');

  return `
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ${className} } from './${importFrom}';

@NgModule({
  declarations: [
    ${className},
  ],
  imports: [
    IonicPageModule.forChild(${className})
  ]
})
export class ${className}Module {}

`;
}

export function purgeDeepLinkDecoratorTSTransform(): TransformerFactory<SourceFile> {
  return purgeDeepLinkDecoratorTSTransformImpl;
}

export function purgeDeepLinkDecoratorTSTransformImpl(transformContext: TransformationContext) {
  function visitClassDeclaration(classDeclaration: ClassDeclaration) {
    let hasDeepLinkDecorator = false;
    const diffDecorators: Decorator[] = [];
    for (const decorator of classDeclaration.decorators || []) {
      if (decorator.expression && (decorator.expression as CallExpression).expression
        && ((decorator.expression as CallExpression).expression as Identifier).text === DEEPLINK_DECORATOR_TEXT) {
        hasDeepLinkDecorator = true;
      } else {
        diffDecorators.push(decorator);
      }
    }

    if (hasDeepLinkDecorator) {
      return updateClassDeclaration(
        classDeclaration,
        diffDecorators,
        classDeclaration.modifiers,
        classDeclaration.name,
        classDeclaration.typeParameters,
        classDeclaration.heritageClauses,
        classDeclaration.members
      );

    }

    return classDeclaration;
  }

  function visitImportDeclaration(importDeclaration: ImportDeclaration, sourceFile: SourceFile): ImportDeclaration {

    if (importDeclaration.moduleSpecifier
        && (importDeclaration.moduleSpecifier as StringLiteral).text === 'ionic-angular'
        && importDeclaration.importClause
        && importDeclaration.importClause.namedBindings
        && (importDeclaration.importClause.namedBindings as NamedImports).elements
    ) {
      // loop over each import and store it
      const importSpecifiers: ImportSpecifier[] = [];
      (importDeclaration.importClause.namedBindings as NamedImports).elements.forEach((importSpecifier: ImportSpecifier) => {

        if (importSpecifier.name.text !== DEEPLINK_DECORATOR_TEXT) {
          importSpecifiers.push(importSpecifier);
        }
      });
      const emptyNamedImports = createNamedImports(importSpecifiers);
      const newImportClause = updateImportClause(importDeclaration.importClause, importDeclaration.importClause.name, emptyNamedImports);

      return updateImportDeclaration(
        importDeclaration,
        importDeclaration.decorators,
        importDeclaration.modifiers,
        newImportClause,
        importDeclaration.moduleSpecifier
      );
    }

    return importDeclaration;
  }

  function visit(node: Node, sourceFile: SourceFile): VisitResult<Node> {
    switch (node.kind) {

      case SyntaxKind.ClassDeclaration:
        return visitClassDeclaration(node as ClassDeclaration);

      case SyntaxKind.ImportDeclaration:
        return visitImportDeclaration(node as ImportDeclaration, sourceFile);
      default:
        return visitEachChild(node, (node) => {
          return visit(node, sourceFile);
        }, transformContext);
    }
  }

  return (sourceFile: SourceFile) => {
    return visit(sourceFile, sourceFile) as SourceFile;
  };
}

export function purgeDeepLinkDecorator(inputText: string): string {
  const sourceFile = getTypescriptSourceFile('', inputText);
  const classDeclarations = getClassDeclarations(sourceFile);
  const toRemove: Node[] = [];
  let toReturn: string = inputText;
  for (const classDeclaration of classDeclarations) {
    for (const decorator of classDeclaration.decorators || []) {
      if (decorator.expression && (decorator.expression as CallExpression).expression
        && ((decorator.expression as CallExpression).expression as Identifier).text === DEEPLINK_DECORATOR_TEXT) {
        toRemove.push(decorator);
      }
    }
  }
  toRemove.forEach(node => {
    toReturn = replaceNode('', inputText, node, '');
  });

  toReturn = purgeDeepLinkImport(toReturn);
  return toReturn;
}

export function purgeDeepLinkImport(inputText: string): string {
  const sourceFile = getTypescriptSourceFile('', inputText);
  const importDeclarations = findNodes(sourceFile, sourceFile, SyntaxKind.ImportDeclaration) as ImportDeclaration[];

  importDeclarations.forEach(importDeclaration => {
    if (importDeclaration.moduleSpecifier
        && (importDeclaration.moduleSpecifier as StringLiteral).text === 'ionic-angular'
        && importDeclaration.importClause
        && importDeclaration.importClause.namedBindings
        && (importDeclaration.importClause.namedBindings as NamedImports).elements
    ) {
      // loop over each import and store it
      let decoratorIsImported = false;
      const namedImportStrings: string[] = [];
      (importDeclaration.importClause.namedBindings as NamedImports).elements.forEach((importSpecifier: ImportSpecifier) => {

        if (importSpecifier.name.text === DEEPLINK_DECORATOR_TEXT) {
          decoratorIsImported = true;
        } else {
          namedImportStrings.push(importSpecifier.name.text as string);
        }
      });

      // okay, cool. If namedImportStrings is empty, then just remove the entire import statement
      // otherwise, just replace the named imports with the namedImportStrings separated by a comma
      if (decoratorIsImported) {
        if (namedImportStrings.length) {
          // okay cool, we only want to remove some of these homies
          const stringRepresentation = namedImportStrings.join(', ');
          const namedImportString = `{ ${stringRepresentation} }`;
          inputText = replaceNode('', inputText, importDeclaration.importClause.namedBindings, namedImportString);
        } else {
          // remove the entire import statement
          inputText = replaceNode('', inputText, importDeclaration, '');
        }
      }
    }
  });

  return inputText;
}

export function getInjectDeepLinkConfigTypescriptTransform() {
  const deepLinkString = convertDeepLinkConfigEntriesToString(getParsedDeepLinkConfig());
  const appNgModulePath = toUnixPath(getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH));
  return injectDeepLinkConfigTypescriptTransform(deepLinkString, appNgModulePath);
}

export function injectDeepLinkConfigTypescriptTransform(deepLinkString: string, appNgModuleFilePath: string): TransformerFactory<SourceFile> {

  function visitDecoratorNode(decorator: Decorator, sourceFile: SourceFile): Decorator {
    if (decorator.expression && (decorator.expression as CallExpression).expression && ((decorator.expression as CallExpression).expression as Identifier).text === NG_MODULE_DECORATOR_TEXT) {

      // okay cool, we have the ng module
      let functionCall = getIonicModuleForRootCall(decorator);

      const updatedArgs: any[] = functionCall.arguments as any as any[];

      if (updatedArgs.length === 1) {
        updatedArgs.push(createIdentifier('{ }'));
      }

      if (updatedArgs.length === 2) {
        updatedArgs.push(createIdentifier(deepLinkString));
      }

      functionCall = updateCall(
        functionCall,
        functionCall.expression,
        functionCall.typeArguments,
        updatedArgs
      );

      // loop over the parent elements and replace the IonicModule expression with ours'

      for (let i = 0; i < ((functionCall.parent as any).elements || []).length; i++) {
        const element = (functionCall.parent as any).elements[i];
        if (element.king === SyntaxKind.CallExpression
            && element.expression
            && element.expression.expression
            && element.expression.expression.escapedText === 'IonicModule'
        ) {
          (functionCall.parent as any).elements[i] = functionCall;
        }
      }
    }

    return decorator;
  }

  return (transformContext: TransformationContext) => {

    function visit(node: Node, sourceFile: SourceFile, sourceFilePath: string): VisitResult<Node> {
      if (sourceFilePath !== appNgModuleFilePath) {
        return node;
      }

      switch (node.kind) {
        case SyntaxKind.Decorator:
          return visitDecoratorNode(node as Decorator, sourceFile);

        default:
          return visitEachChild(node, (node) => {
            return visit(node, sourceFile, sourceFilePath);
          }, transformContext);
      }

    }

    return (sourceFile: SourceFile) => {
      return visit(sourceFile, sourceFile, sourceFile.fileName) as SourceFile;
    };
  };
}

const DEEPLINK_DECORATOR_TEXT = 'IonicPage';
const DEEPLINK_DECORATOR_NAME_ATTRIBUTE = 'name';
const DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE = 'segment';
const DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE = 'priority';
const DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE = 'defaultHistory';

const NG_MODULE_IMPORT_DECLARATION = 'imports';
const IONIC_MODULE_NAME = 'IonicModule';
const FOR_ROOT_METHOD = 'forRoot';
const LOAD_CHILDREN_SEPARATOR = '#';
