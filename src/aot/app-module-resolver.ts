import { existsSync, statSync } from 'fs';
import { join, normalize, resolve } from 'path';

import {
  CallExpression,
  ClassDeclaration,
  CompilerHost,
  ExportDeclaration,
  Identifier,
  ImportDeclaration,
  NamedExports,
  NamedImports,
  NamespaceImport,
  Node,
  Program,
  PropertyAccessExpression,
  resolveModuleName,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  SyntaxKind,
} from 'typescript';

import { FileCache } from '../util/file-cache';
import { getTypescriptSourceFile, findNodes } from '../util/typescript-utils';


function _recursiveSymbolExportLookup(sourceFile: SourceFile,
                                      symbolName: string,
                                      fileCache: FileCache,
                                      host: CompilerHost,
                                      program: Program): string | null {

  const hasSymbol = findNodes(sourceFile, sourceFile, SyntaxKind.ClassDeclaration, false)
    .some((cd: ClassDeclaration) => {
      return cd.name && cd.name.text === symbolName;
    });

  if (hasSymbol) {
    return sourceFile.fileName;
  }

  // We found the bootstrap variable, now we just need to get where it's imported.
  const exports = findNodes(sourceFile, sourceFile, SyntaxKind.ExportDeclaration, false)
    .map((node: Node) => node as ExportDeclaration);

  for (const decl of exports) {
    if (!decl.moduleSpecifier || decl.moduleSpecifier.kind !== SyntaxKind.StringLiteral) {
      continue;
    }

    const modulePath = (decl.moduleSpecifier as StringLiteral).text;
    const resolvedModule = resolveModuleName(
      modulePath, sourceFile.fileName, program.getCompilerOptions(), host);
    if (!resolvedModule.resolvedModule || !resolvedModule.resolvedModule.resolvedFileName) {
      return null;
    }

    const module = normalize(resolve(resolvedModule.resolvedModule.resolvedFileName));
    if (!decl.exportClause) {
      const file = fileCache.get(module);
      if (file) {
        const moduleSourceFile = getTypescriptSourceFile(module, file.content, ScriptTarget.Latest, false);
        const maybeModule = _recursiveSymbolExportLookup(moduleSourceFile, symbolName, fileCache, host, program);
        if (maybeModule) {
          return maybeModule;
        }
      }
    }

    const binding = decl.exportClause as NamedExports;
    for (const specifier of binding.elements) {
      if (specifier.name.text === symbolName) {
        // If it's a directory, load its index and recursively lookup.
        if (statSync(module).isDirectory()) {
          const indexModule = normalize(join(module, 'index.ts'));
          if (existsSync(indexModule)) {
            const file = fileCache.get(indexModule);
            if (file) {
              const moduleSourceFile = getTypescriptSourceFile(indexModule, file.content, ScriptTarget.Latest, false);
              const maybeModule = _recursiveSymbolExportLookup(moduleSourceFile, symbolName, fileCache, host, program);
              if (maybeModule) {
                return maybeModule;
              }
            }
          }
        }

        // Create the source and verify that the symbol is at least a class.
        const file = fileCache.get(module);
        const moduleSourceFile = getTypescriptSourceFile(module, file.content, ScriptTarget.Latest, false);
        const hasSymbol = findNodes(moduleSourceFile, moduleSourceFile, SyntaxKind.ClassDeclaration)
          .some((cd: ClassDeclaration) => {
            return cd.name && cd.name.text === symbolName;
          });

        if (hasSymbol) {
          return module;
        }
      }
    }
  }

  return null;
}

function _symbolImportLookup(sourceFile: SourceFile,
                             symbolName: string,
                             fileCache: FileCache,
                             host: CompilerHost,
                             program: Program): string | null {
  // We found the bootstrap variable, now we just need to get where it's imported.
  const imports = findNodes(sourceFile, sourceFile, SyntaxKind.ImportDeclaration)
    .map((node: Node) => node as ImportDeclaration);

  for (const decl of imports) {
    if (!decl.importClause || !decl.moduleSpecifier) {
      continue;
    }
    if (decl.moduleSpecifier.kind !== SyntaxKind.StringLiteral) {
      continue;
    }

    const resolvedModule = resolveModuleName(
      (decl.moduleSpecifier as StringLiteral).text,
      sourceFile.fileName, program.getCompilerOptions(), host);
    if (!resolvedModule.resolvedModule || !resolvedModule.resolvedModule.resolvedFileName) {
      return null;
    }

    const module = normalize(resolve(resolvedModule.resolvedModule.resolvedFileName));
    if (decl.importClause.namedBindings.kind === SyntaxKind.NamespaceImport) {
      const binding = decl.importClause.namedBindings as NamespaceImport;
      if (binding.name.text === symbolName) {
        // This is a default export.
        return module;
      }
    } else if (decl.importClause.namedBindings.kind === SyntaxKind.NamedImports) {
      const binding = decl.importClause.namedBindings as NamedImports;
      for (const specifier of binding.elements) {
        if (specifier.name.text === symbolName) {
          // Create the source and recursively lookup the import.

          const file = fileCache.get(module);
          if (file) {
            const moduleSourceFile = getTypescriptSourceFile(module, file.content, ScriptTarget.Latest, false);
            const maybeModule = _recursiveSymbolExportLookup(moduleSourceFile, symbolName, fileCache, host, program);
            if (maybeModule) {
              return maybeModule;
            }
          }
        }
      }
    }
  }
  return null;
}


export function resolveAppNgModuleFromMain(mainSourceFile: SourceFile, fileCache: FileCache, host: CompilerHost, program: Program) {

  const bootstrap = findNodes(mainSourceFile, mainSourceFile, SyntaxKind.CallExpression, false)
    .map((node: Node) => node as CallExpression)
    .filter((call: CallExpression) => {
      const access = call.expression as PropertyAccessExpression;
      return access.kind === SyntaxKind.PropertyAccessExpression
          && access.name.kind === SyntaxKind.Identifier
          && (access.name.text === 'bootstrapModule'
              || access.name.text === 'bootstrapModuleFactory');
    }).map((node: CallExpression) => node.arguments[0] as Identifier)
    .filter((node: Identifier) => node.kind === SyntaxKind.Identifier);

  if (bootstrap.length !== 1) {
    throw new Error(`Failed to find Angular bootstrapping code in ${mainSourceFile.fileName}.
                    Please update ${mainSourceFile.fileName} to match the following:
                    https://github.com/driftyco/ionic2-app-base/blob/master/src/app/main.ts`);
  }

  const bootstrapSymbolName = bootstrap[0].text;
  const module = _symbolImportLookup(mainSourceFile, bootstrapSymbolName, fileCache, host, program);
  if (module) {
    return `${module}#${bootstrapSymbolName}`;
  }

  // shrug... something bad happened and we couldn't find the import statement.
  throw new Error(`Failed to find Angular bootstrapping code in ${mainSourceFile.fileName}.
                    Please update ${mainSourceFile.fileName} to match the following:
                    https://github.com/driftyco/ionic2-app-base/blob/master/src/app/main.ts`);
}
