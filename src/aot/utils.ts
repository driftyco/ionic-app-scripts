import { basename, dirname, join, normalize, relative, resolve } from 'path';
import {
  CallExpression,
  Identifier,
  PropertyAccessExpression,
  SyntaxKind,
  ScriptTarget
} from 'typescript';

import { appendBefore, checkIfFunctionIsCalled, getTypescriptSourceFile, findNodes, insertNamedImportIfNeeded, replaceImportModuleSpecifier, replaceNamedImport, replaceNode } from '../util/typescript-utils';

export function getFallbackMainContent() {
  return `
import { platformBrowser } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';

import { AppModuleNgFactory } from './app.module.ngfactory';

enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);`;
}

function getBootstrapNodes(allCalls: CallExpression[]) {
  return allCalls
    .filter(call => call.expression.kind === SyntaxKind.PropertyAccessExpression)
    .map(call => call.expression as PropertyAccessExpression)
    .filter(access => {
      return access.name.kind === SyntaxKind.Identifier
          && access.name.text === 'bootstrapModule';
    });
}

function replaceNgModuleClassName(filePath: string, fileContent: string, className: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allCalls = findNodes(sourceFile, sourceFile, SyntaxKind.CallExpression, true) as CallExpression[];
  const bootstraps = getBootstrapNodes(allCalls);
  let modifiedContent = fileContent;
  allCalls.filter(call => bootstraps.some(bs => bs === call.expression)).forEach((call: CallExpression) => {
    modifiedContent = replaceNode(filePath, modifiedContent, call.arguments[0], className + 'NgFactory');
  });
  return modifiedContent;
}

function replacePlatformBrowser(filePath: string, fileContent: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allCalls = findNodes(sourceFile, sourceFile, SyntaxKind.CallExpression, true) as CallExpression[];
  const bootstraps = getBootstrapNodes(allCalls);
  const calls: CallExpression[] = bootstraps.reduce((previous, access) => {
      const expressions = findNodes(sourceFile, access, SyntaxKind.CallExpression, true) as CallExpression[];
      return previous.concat(expressions);
    }, [])
    .filter((call: CallExpression) => {
      return call.expression.kind === SyntaxKind.Identifier
          && (call.expression as Identifier).text === 'platformBrowserDynamic';
    });
  let modifiedContent = fileContent;
  calls.forEach(call => {
    modifiedContent = replaceNode(filePath, modifiedContent, call.expression, 'platformBrowser');
  });
  return modifiedContent;
}

function checkForPlatformDynamicBrowser(filePath: string, fileContent: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allCalls = findNodes(sourceFile, sourceFile, SyntaxKind.CallExpression, true) as CallExpression[];
  const bootstraps = getBootstrapNodes(allCalls);
  const calls: CallExpression[] = bootstraps.reduce((previous, access) => {
      const expressions = findNodes(sourceFile, access, SyntaxKind.CallExpression, true) as CallExpression[];
      return previous.concat(expressions);
    }, [])
    .filter((call: CallExpression) => {
      return call.expression.kind === SyntaxKind.Identifier
          && (call.expression as Identifier).text === 'platformBrowserDynamic';
    });
  return calls && calls.length;
}

function replaceBootstrapModuleFactory(filePath: string, fileContent: string) {
  const sourceFile = getTypescriptSourceFile(filePath, fileContent, ScriptTarget.Latest, false);
  const allCalls = findNodes(sourceFile, sourceFile, SyntaxKind.CallExpression, true) as CallExpression[];
  const bootstraps = getBootstrapNodes(allCalls);
  let modifiedContent = fileContent;
  bootstraps.forEach((bs: PropertyAccessExpression) => {
    modifiedContent = replaceNode(filePath, modifiedContent, bs.name, 'bootstrapModuleFactory');
  });
  return modifiedContent;
}

function getPlatformBrowserFunctionNode(filePath: string, fileContent: string) {
  let modifiedFileContent = fileContent;
  const sourceFile = getTypescriptSourceFile(filePath, modifiedFileContent, ScriptTarget.Latest, false);
  const allCalls = findNodes(sourceFile, sourceFile, SyntaxKind.CallExpression, true) as CallExpression[];
  const callsToPlatformBrowser = allCalls.filter(call => call.expression && call.expression.kind === SyntaxKind.Identifier && (call.expression as Identifier).text === 'platformBrowser');
  const toAppend = `enableProdMode();\n`;
  if (callsToPlatformBrowser.length) {
    modifiedFileContent = appendBefore(filePath, modifiedFileContent, callsToPlatformBrowser[0].expression, toAppend);
  } else {
    // just throw it at the bottom
    modifiedFileContent += toAppend;
  }
  return modifiedFileContent;
}

function importAndEnableProdMode(filePath: string, fileContent: string) {
  let modifiedFileContent = fileContent;
  modifiedFileContent = insertNamedImportIfNeeded(filePath, modifiedFileContent, 'enableProdMode', '@angular/core');

  const isCalled = checkIfFunctionIsCalled(filePath, modifiedFileContent, 'enableProdMode');
  if (!isCalled) {
    // go ahead and insert this
    modifiedFileContent = getPlatformBrowserFunctionNode(filePath, modifiedFileContent);
  }

  return modifiedFileContent;
}

export function replaceBootstrap(filePath: string, fileContent: string, appNgModulePath: string, appNgModuleClassName: string) {
  if (!fileContent.match(/\bbootstrapModule\b/)) {
    throw new Error(`Could not find bootstrapModule in ${filePath}`);
  }

  const withoutExtension = join(dirname(appNgModulePath), basename(appNgModulePath, '.ts'));
  const appModuleAbsoluteFileName = normalize(resolve(withoutExtension));
  const withNgFactory = appModuleAbsoluteFileName + '.ngfactory';
  const originalImport = './' + relative(dirname(filePath), appModuleAbsoluteFileName);
  const ngFactryImport = './' + relative(dirname(filePath), withNgFactory);

  if (!checkForPlatformDynamicBrowser(filePath, fileContent)) {
    throw new Error(`Could not find any references to "platformBrowserDynamic" in ${filePath}`);
  }

  let modifiedFileContent = fileContent;
  modifiedFileContent = replaceNgModuleClassName(filePath, modifiedFileContent, appNgModuleClassName);
  modifiedFileContent = replacePlatformBrowser(filePath, modifiedFileContent);
  modifiedFileContent = replaceBootstrapModuleFactory(filePath, modifiedFileContent);

  modifiedFileContent = replaceNamedImport(filePath, modifiedFileContent, 'platformBrowserDynamic', 'platformBrowser');
  modifiedFileContent = replaceNamedImport(filePath, modifiedFileContent, appNgModuleClassName, appNgModuleClassName + 'NgFactory');
  modifiedFileContent = replaceImportModuleSpecifier(filePath, modifiedFileContent, '@angular/platform-browser-dynamic', '@angular/platform-browser');
  modifiedFileContent = replaceImportModuleSpecifier(filePath, modifiedFileContent, originalImport, ngFactryImport);

  // check if prod mode is imported and enabled
  modifiedFileContent = importAndEnableProdMode(filePath, modifiedFileContent);

  return modifiedFileContent;
}
