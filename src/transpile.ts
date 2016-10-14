import { BuildContext, TsFiles } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { buildJsSourceMaps } from './bundle';
import { endsWith } from './util/helpers';
import { generateContext } from './util/config';
import { inlineTemplate } from './template';
import { join, normalize } from 'path';
import { readFileSync } from 'fs';
import { runDiagnostics, printDiagnostic } from './util/logger-typescript';
import * as ts from 'typescript';


export function transpile(context?: BuildContext) {
  context = generateContext(context);
  const configFile = getTsConfigPath(context);

  const logger = new Logger('transpile');

  return transpileWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function transpileUpdate(event: string, path: string, context: BuildContext) {
  if (path.endsWith('.ts')) {
    cachedTsFiles = null;
  }

  if (cachedTsFiles) {
    context.tsFiles = cachedTsFiles;
    return Promise.resolve();
  }

  const configFile = getTsConfigPath(context);
  const logger = new Logger('transpile update');

  return transpileWorker(context, configFile)
    .then(tsFiles => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function transpileWorker(context: BuildContext, configFile: string) {
  context.tsFiles = null;

  return new Promise((resolve, reject) => {
    const tsConfig = getTsConfig(context, configFile);

    // force it to save in the src directory
    // however, it's only in memory and won't actually write to disk
    tsConfig.options.outDir = context.rootDir;
    tsConfig.options.sourceMap = buildJsSourceMaps(context);
    tsConfig.options.declaration = false;
    const tsFileNames = cleanFileNames(context, tsConfig.fileNames);

    const tsFiles: TsFiles = {};
    const host = ts.createCompilerHost(tsConfig.options);

    Logger.debug(`ts.createProgram, cachedProgram: ${!!cachedProgram}`);

    const program = ts.createProgram(tsFileNames, tsConfig.options, host, cachedProgram);
    program.emit(undefined, (path: string, data: string) => {
      writeCallback(tsFiles, path, data);
    });

    const hasDiagnostics = runDiagnostics(context, program);

    if (hasDiagnostics) {
      // transpile failed :(
      cachedProgram = cachedTsFiles = null;
      reject(new BuildError());

    } else {
      // transpile success :)
      // cache the typescript program for later use
      cachedProgram = program;
      cachedTsFiles = tsFiles;
      context.tsFiles = tsFiles;

      resolve();
    }
  });
}


function cleanFileNames(context: BuildContext, fileNames: string[]) {
  let removeFileName = 'main.prod.ts';
  if (context.isProd) {
    removeFileName = 'main.dev.ts';
  }
  return fileNames.filter(f => {
    return (f.indexOf(removeFileName) === -1);
  });
}


function writeCallback(tsFiles: TsFiles, sourcePath: string, data: string) {
  sourcePath = normalize(sourcePath);

  if (endsWith(sourcePath, '.js')) {
    sourcePath = sourcePath.substring(0, sourcePath.length - 3) + '.ts';

    let file = tsFiles[sourcePath];
    if (!file) {
      file = tsFiles[sourcePath] = {};
    }
    file.output = inlineTemplate(data, sourcePath);

  } else if (endsWith(sourcePath, '.js.map')) {
    sourcePath = sourcePath.substring(0, sourcePath.length - 7) + '.ts';

    let file = tsFiles[sourcePath];
    if (!file) {
      file = tsFiles[sourcePath] = {};
    }
    file.map = data;
  }
}


export function getTsConfig(context: BuildContext, tsConfigPath?: string): TsConfig {
  let config: TsConfig = null;
  tsConfigPath = tsConfigPath || getTsConfigPath(context);

  const tsConfigFile = ts.readConfigFile(tsConfigPath, path => readFileSync(path, 'utf8'));

  if (!tsConfigFile) {
    throw new BuildError(`tsconfig: invalid tsconfig file, "${tsConfigPath}"`);

  } else if (tsConfigFile.error && tsConfigFile.error.messageText) {
    throw new BuildError(`tsconfig: ${tsConfigFile.error.messageText}`);

  } else if (!tsConfigFile.config) {
    throw new BuildError(`tsconfig: invalid config, "${tsConfigPath}""`);

  } else {
    const parsedConfig = ts.parseJsonConfigFileContent(
                                tsConfigFile.config,
                                ts.sys, context.rootDir,
                                {}, tsConfigPath);

    if (parsedConfig.errors && parsedConfig.errors.length) {
      parsedConfig.errors.forEach(d => {
        printDiagnostic(context, d);
      });
      throw new BuildError();
    }

    config = {
      options: parsedConfig.options,
      fileNames: parsedConfig.fileNames,
      typingOptions: parsedConfig.typingOptions,
      raw: parsedConfig.raw
    };
  }

  return config;
}


let cachedProgram: ts.Program = null;
let cachedTsFiles: TsFiles = null;


export function getTsConfigPath(context: BuildContext) {
  return join(context.rootDir, 'tsconfig.json');
}


export interface TsConfig {
  options: ts.CompilerOptions;
  fileNames: string[];
  typingOptions: ts.TypingOptions;
  raw: any;
}
