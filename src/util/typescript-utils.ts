import { Logger } from '../logger/logger';

import {
  CallExpression,
  ClassDeclaration,
  createSourceFile,
  Identifier,
  ImportClause,
  ImportDeclaration,
  ImportSpecifier,
  NamedImports,
  Node,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  SyntaxKind
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
      };
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
  const classDeclarations = findNodes(sourceFile, sourceFile, SyntaxKind.ClassDeclaration, true) as ClassDeclaration[];
  if (classDeclarations.length > 1) {
    Logger.warn(`The following file has multiple class declarations in it:
${sourceFile}
In general, it's considered a best practice to have at most one class declaration per file.`);
  }
  return classDeclarations;
}
