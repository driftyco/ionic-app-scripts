import * as path from 'path';

import {
  CallExpression,
  ClassDeclaration,
  Decorator,
  Identifier,
  ImportClause,
  ImportDeclaration,
  ImportSpecifier,
  NamedImports,
  Node,
  NodeArray,
  ObjectLiteralElement, // tslint:disable-line: no-unused-variable
  ObjectLiteralExpression,
  PropertyAssignment,
  ArrayLiteralExpression,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  SyntaxKind,
  createSourceFile,
} from 'typescript';

import { rangeReplace, stringSplice } from './helpers';

export function getTypescriptSourceFile(filePath: string, fileContent: string, languageVersion: ScriptTarget = ScriptTarget.Latest, setParentNodes: boolean = false): SourceFile {
  return createSourceFile(filePath, fileContent, languageVersion, setParentNodes);
}

export function removeDecorators(fileName: string, source: string): string {
  const sourceFile = createSourceFile(fileName, source, ScriptTarget.Latest);
  const decorators = findNodes(sourceFile, sourceFile, SyntaxKind.Decorator, true);
  decorators.sort((a, b) => b.pos - a.pos);
  decorators.forEach(d => {
    source = source.slice(0, d.pos) + source.slice(d.end);
  });

  return source;
}

export function findNodes(sourceFile: SourceFile, node: Node, kind: SyntaxKind, keepGoing = false): Node[] {
  if (node.kind === kind && !keepGoing) {
    return [node];
  }

  return node.getChildren(sourceFile).reduce((result, n) => {
    return result.concat(findNodes(sourceFile, n, kind, keepGoing));
  }, node.kind === kind ? [node] : []);
}

export function replaceNode(filePath: string, fileContent: string, node: Node, replacement: string): string {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const startIndex = node.getStart(sourceFile);
  const endIndex = node.getEnd();
  const modifiedContent = rangeReplace(fileContent, startIndex, endIndex, replacement);
  return modifiedContent;
}

export function removeNode(filePath: string, fileContent: string, node: Node) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const startIndex = node.getStart(sourceFile);
  const endIndex = node.getEnd();
  const modifiedContent = rangeReplace(fileContent, startIndex, endIndex, '');
  return modifiedContent;
}

export function getNodeStringContent(sourceFile: SourceFile, node: Node) {
  return sourceFile.getFullText().substring(node.getStart(sourceFile), node.getEnd());
}

export function appendAfter(source: string, node: Node, toAppend: string): string {
  return stringSplice(source, node.getEnd(), 0, toAppend);
}

export function appendEmpty(source: string, position: number, toAppend: string): string {
  return stringSplice(source, position, 0, toAppend);
}

export function appendBefore(filePath: string, fileContent: string, node: Node, toAppend: string): string {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  return stringSplice(fileContent, node.getStart(sourceFile), 0, toAppend);
}

export function insertNamedImportIfNeeded(filePath: string, fileContent: string, namedImport: string, fromModule: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allImports = findNodes(sourceFile, sourceFile, SyntaxKind.ImportDeclaration);
  const maybeImports = allImports.filter((node: ImportDeclaration) => {
    return node.moduleSpecifier.kind === SyntaxKind.StringLiteral
            && (node.moduleSpecifier as StringLiteral).text === fromModule;
  }).filter((node: ImportDeclaration) => {
    // Remove import statements that are either `import 'XYZ'` or `import * as X from 'XYZ'`.
        const clause = node.importClause as ImportClause;
        if (!clause || clause.name || !clause.namedBindings) {
          return false;
        }
        return clause.namedBindings.kind === SyntaxKind.NamedImports;
  }).map((node: ImportDeclaration) => {
    return (node.importClause as ImportClause).namedBindings as NamedImports;
  });

  if (maybeImports.length) {
    // There's an `import {A, B, C} from 'modulePath'`.
    // Find if it's in either imports. If so, just return; nothing to do.
    const hasImportAlready = maybeImports.some((node: NamedImports) => {
      return node.elements.some((element: ImportSpecifier) => {
        return element.name.text === namedImport;
      });
    });
    if (hasImportAlready) {
      // it's already imported, so just return the original text
      return fileContent;
    }

    // Just pick the first one and insert at the end of its identifier list.
    fileContent = appendAfter(fileContent, maybeImports[0].elements[maybeImports[0].elements.length - 1], `, ${namedImport}`);
  } else {
    // Find the last import and insert after.
    fileContent = appendAfter(fileContent, allImports[allImports.length - 1],
        `\nimport { ${namedImport} } from '${fromModule}';`);
  }

  return fileContent;
}

export function replaceNamedImport(filePath: string, fileContent: string, namedImportOriginal: string, namedImportReplacement: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allImports = findNodes(sourceFile, sourceFile, SyntaxKind.ImportDeclaration);
  let modifiedContent = fileContent;
  allImports.filter((node: ImportDeclaration) => {
    if (node.importClause && node.importClause.namedBindings) {
      return node.importClause.namedBindings.kind === SyntaxKind.NamedImports;
    }
  }).map((importDeclaration: ImportDeclaration) => {
    return (importDeclaration.importClause as ImportClause).namedBindings as NamedImports;
  }).forEach((namedImport: NamedImports) => {
    return namedImport.elements.forEach((element: ImportSpecifier) => {
      if (element.name.text === namedImportOriginal) {
        modifiedContent = replaceNode(filePath, modifiedContent, element, namedImportReplacement);
      }
    });
  });

  return modifiedContent;
}

export function replaceImportModuleSpecifier(filePath: string, fileContent: string, moduleSpecifierOriginal: string, moduleSpecifierReplacement: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allImports = findNodes(sourceFile, sourceFile, SyntaxKind.ImportDeclaration);
  let modifiedContent = fileContent;
  allImports.forEach((node: ImportDeclaration) => {
    if (node.moduleSpecifier.kind === SyntaxKind.StringLiteral && (node.moduleSpecifier as StringLiteral).text === moduleSpecifierOriginal ) {
      modifiedContent = replaceNode(filePath, modifiedContent, node.moduleSpecifier, `'${moduleSpecifierReplacement}'`);
    }
  });
  return modifiedContent;
}

export function checkIfFunctionIsCalled(filePath: string, fileContent: string, functionName: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allCalls = findNodes(sourceFile, sourceFile, SyntaxKind.CallExpression, true) as CallExpression[];
  const functionCallList = allCalls.filter(call => call.expression && call.expression.kind === SyntaxKind.Identifier && (call.expression as Identifier).text === functionName);
  return functionCallList.length > 0;
}

export function getClassDeclarations(sourceFile: SourceFile) {
  return findNodes(sourceFile, sourceFile, SyntaxKind.ClassDeclaration, true) as ClassDeclaration[];
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

export function getNgModuleDecorator(fileName: string, sourceFile: SourceFile) {
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
    throw new Error(`Could not find an "NgModule" decorator in ${fileName}`);
  }

  if (ngModuleDecorators.length > 1) {
    throw new Error(`Multiple "NgModule" decorators found in ${fileName}. The correct one to use could not be determined`);
  }

  return ngModuleDecorators[0];
}

export function getNgModuleObjectLiteralArg(decorator: Decorator) {
  const ngModuleArgs = (decorator.expression as CallExpression).arguments;
  if (!ngModuleArgs || ngModuleArgs.length === 0 || ngModuleArgs.length > 1) {
    throw new Error(`Invalid NgModule Argument`);
  }
  return ngModuleArgs[0] as ObjectLiteralExpression;
}

export function findObjectLiteralElementByName(properties: NodeArray<ObjectLiteralElement>, identifierToLookFor: string) {
  return properties.filter((propertyNode) => {
    return propertyNode && (propertyNode as PropertyAssignment).name && ((propertyNode as PropertyAssignment).name as Identifier).text === identifierToLookFor;
  })[0];
}

export function appendNgModuleDeclaration(filePath: string, fileContent: string, declaration: string, type?: string): string {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const decorator = getNgModuleDecorator(path.basename(filePath), sourceFile);
  const obj = getNgModuleObjectLiteralArg(decorator);
  if (type === 'provider') {
    const properties = (findObjectLiteralElementByName(obj.properties, 'providers') as PropertyAssignment);
    const declarations = (properties.initializer as ArrayLiteralExpression).elements;
    if (declarations.length === 0) {
      return appendEmpty(fileContent, declarations['end'], declaration);
    } else {
      return appendAfter(fileContent, declarations[declarations.length - 1], `,\n    ${declaration}`);
    }
  } else {
    const properties = (findObjectLiteralElementByName(obj.properties, 'declarations') as PropertyAssignment);
    const declarations = (properties.initializer as ArrayLiteralExpression).elements;
    return appendAfter(fileContent, declarations[declarations.length - 1], `,\n    ${declaration}`);
  }
}

const NG_MODULE_DECORATOR_TEXT = 'NgModule';
