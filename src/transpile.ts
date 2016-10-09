// Ported from 'rollup-plugin-typescript':
// https://github.com/rollup/rollup-plugin-typescript
// MIT Licenced

import { endsWith, objectAssign } from './util/helpers';
import { fixExportClass, helpersId, helperImports } from './util/typescript-helpers';
import { join } from 'path';
import { Logger } from './util/logger';
import { readFileSync, statSync } from 'fs';
import * as ts from 'typescript';


export function transpile(sourceText: string, sourcePath: string, compilerOptions: ts.CompilerOptions, reportDiagnostics: boolean): TransformedOutput {
  Logger.debug(`transpile: ${sourcePath}`);

  if (sourceText.indexOf(ION_COMPILER_COMMENT) > -1) {
    Logger.debug(`file already transpiled: ${sourcePath}`);
    return null;
  }

  const transformed = ts.transpileModule(
    fixExportClass(sourceText, sourcePath),
    {
      fileName: sourcePath,
      reportDiagnostics: reportDiagnostics,
      compilerOptions
    }
  );

  // All errors except `Cannot compile modules into 'es6' when targeting 'ES5' or lower.`
  const diagnostics = transformed.diagnostics ? transformed.diagnostics.filter(diagnostic => diagnostic.code !== 1204) : [];

  let fatalError = false;

  diagnostics.forEach(diagnostic => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      Logger.error(`${diagnostic.file.fileName}(${line + 1},${character + 1}): error TS${diagnostic.code}: ${message}` );

    } else {
      Logger.error(`Error: ${message}` );
    }

    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      fatalError = true;
    }
  });

  if (fatalError) {
    throw new Error(`There were TypeScript errors transpiling`);
  }

  return {
    // always append an import for the helpers
    code: ION_COMPILER_COMMENT + '\n' +
          transformed.outputText + '\n' +
          helperImports,

    // rollup expects `map` to be an object so we must parse the string
    map: transformed.sourceMapText ? JSON.parse(transformed.sourceMapText) : null
  };
}


export function resolveId(importee: string, importer: string, compilerOptions: ts.CompilerOptions) {
  // Handle the special `typescript-helpers` import itself.
  if (importee === helpersId) {
    return helpersId;
  }

  if (!importer) {
    return null;
  }

  importer = importer.split('\\').join('/');

  const result = ts.nodeModuleNameResolver(importee, importer, compilerOptions, resolveHost);

  if (result.resolvedModule && result.resolvedModule.resolvedFileName) {
    if (endsWith(result.resolvedModule.resolvedFileName, '.d.ts')) {
      return null;
    }

    return result.resolvedModule.resolvedFileName;
  }

  return null;
}


export function getTsConfig(rootDir: string) {
  let config: TsConfig = null;
  const tsConfigPath = join(rootDir, 'tsconfig.json');

  try {
    const tsConfigFile = ts.readConfigFile(tsConfigPath, path => readFileSync(path, 'utf8'));

    if (!tsConfigFile) {
      throw new Error(`tsconfig error: invalid tsconfig file, "${tsConfigPath}"`);

    } else if (tsConfigFile.error && tsConfigFile.error.messageText) {
      throw new Error(`tsconfig error: ${tsConfigFile.error.messageText}`);

    } else if (!tsConfigFile.config) {
      throw new Error(`tsconfig error: invalid config, "${tsConfigPath}""`);

    } else if (!tsConfigFile.config.compilerOptions) {
      throw new Error(`tsconfig error: invalid compilerOptions, "${tsConfigPath}""`);

    } else {
      config = tsConfigFile.config;
      setCompilerOptionDefaults(config.compilerOptions);
    }

  } catch (e) {
    throw new Error(`tsconfig error: error reading tsconfig file "${tsConfigPath}", ${e}`);
  }

  return config;
}


export function getCompilerOptions(rootDir: string): ts.CompilerOptions {
  const config = getTsConfig(rootDir);
  if (config && config.compilerOptions) {
    // convert to typescripts actual typed compiler options
    const tsCompilerOptions: ts.CompilerOptions = objectAssign({}, config.compilerOptions);

    if (config.compilerOptions.module === 'es2015' || config.compilerOptions.module === 'es6') {
      tsCompilerOptions.module = ts.ModuleKind.ES2015;
    } else if (config.compilerOptions.module === 'commonjs') {
      tsCompilerOptions.module = ts.ModuleKind.CommonJS;
    }

    if (config.compilerOptions.target === 'es5') {
      tsCompilerOptions.target = ts.ScriptTarget.ES5;
    } else if (config.compilerOptions.target === 'es6' || config.compilerOptions.target === 'es2015') {
      tsCompilerOptions.target = ts.ScriptTarget.ES2015;
    } else if (config.compilerOptions.target === 'latest') {
      tsCompilerOptions.target = ts.ScriptTarget.Latest;
    }

    return tsCompilerOptions;
  }
  return null;
}


function setCompilerOptionDefaults(compilerOptions: TsCompilerOptions) {
  compilerOptions.target = 'es5';
  compilerOptions.module = 'es2015';
}


const resolveHost: any = {
  directoryExists (dirPath: string) {
    try {
      return statSync( dirPath ).isDirectory();
    } catch ( err ) {
      return false;
    }
  },
  fileExists (filePath: string) {
    try {
      return statSync( filePath ).isFile();
    } catch ( err ) {
      return false;
    }
  }
};


export interface TransformedOutput {
  code: string;
  map: any;
}


export interface TsConfig {
  // https://www.typescriptlang.org/docs/handbook/compiler-options.html
  compilerOptions: TsCompilerOptions;
  include: string[];
  exclude: string[];
}

export interface TsCompilerOptions {
  module: string;
  noEmitOnError: boolean;
  outDir: string;
  removeComments: boolean;
  target: string;
  baseUrl: string;
}

const ION_COMPILER_COMMENT = '/* ion-compiler */';

