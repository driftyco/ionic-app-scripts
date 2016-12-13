import { FileCache } from './util/file-cache';
import { BuildContext, BuildState, ChangedFile } from './util/interfaces';
import { BuildError } from './util/errors';
import { buildJsSourceMaps } from './bundle';
import { changeExtension } from './util/helpers';
import { EventEmitter } from 'events';
import { fork, ChildProcess } from 'child_process';
import { inlineTemplate } from './template';
import { Logger } from './logger/logger';
import { readFileSync } from 'fs';
import { runTypeScriptDiagnostics } from './logger/logger-typescript';
import { printDiagnostics, clearDiagnostics, DiagnosticsType } from './logger/logger-diagnostics';
import * as path from 'path';
import * as ts from 'typescript';


export function transpile(context: BuildContext) {

  const workerConfig: TranspileWorkerConfig = {
    configFile: getTsConfigPath(context),
    writeInMemory: true,
    sourceMaps: true,
    cache: true,
    inlineTemplate: context.inlineTemplates
  };

  const logger = new Logger('transpile');

  return transpileWorker(context, workerConfig)
    .then(() => {
      context.transpileState = BuildState.SuccessfulBuild;
      logger.finish();
    })
    .catch(err => {
      context.transpileState = BuildState.RequiresBuild;
      throw logger.fail(err);
    });
}


export function transpileUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const workerConfig: TranspileWorkerConfig = {
    configFile: getTsConfigPath(context),
    writeInMemory: true,
    sourceMaps: true,
    cache: false,
    inlineTemplate: context.inlineTemplates
  };

  const logger = new Logger('transpile update');

  const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');

  const promises: Promise<void>[] = [];
  for (const changedTypescriptFile of changedTypescriptFiles) {
    promises.push(transpileUpdateWorker(changedTypescriptFile.event, changedTypescriptFile.filePath, context, workerConfig));
  }

  return Promise.all(promises)
    .then(() => {
      context.transpileState = BuildState.SuccessfulBuild;
      logger.finish();
    })
    .catch(err => {
      context.transpileState = BuildState.RequiresBuild;
      throw logger.fail(err);
    });

}


/**
 * The full TS build for all app files.
 */
export function transpileWorker(context: BuildContext, workerConfig: TranspileWorkerConfig) {

  // let's do this
  return new Promise((resolve, reject) => {

    clearDiagnostics(context, DiagnosticsType.TypeScript);

    // get the tsconfig data
    const tsConfig = getTsConfig(context, workerConfig.configFile);

    if (workerConfig.sourceMaps === false) {
      // the worker config say, "hey, don't ever bother making a source map, because."
      tsConfig.options.sourceMap = false;

    } else {
       // build the ts source maps if the bundler is going to use source maps
      tsConfig.options.sourceMap = buildJsSourceMaps(context);
    }

    // collect up all the files we need to transpile, tsConfig itself does all this for us
    const tsFileNames = cleanFileNames(context, tsConfig.fileNames);

    // for dev builds let's not create d.ts files
    tsConfig.options.declaration = undefined;

    // let's start a new tsFiles object to cache all the transpiled files in
    const host = ts.createCompilerHost(tsConfig.options);

    const program = ts.createProgram(tsFileNames, tsConfig.options, host, cachedProgram);
    program.emit(undefined, (path: string, data: string, writeByteOrderMark: boolean, onError: Function, sourceFiles: ts.SourceFile[]) => {
      if (workerConfig.writeInMemory) {
        writeSourceFiles(context.fileCache, sourceFiles);
        writeTranspiledFilesCallback(context.fileCache, path, data, workerConfig.inlineTemplate);
      }
    });

    // cache the typescript program for later use
    cachedProgram = program;

    const tsDiagnostics = program.getSyntacticDiagnostics()
                          .concat(program.getSemanticDiagnostics())
                          .concat(program.getOptionsDiagnostics());

    const diagnostics = runTypeScriptDiagnostics(context, tsDiagnostics);

    if (diagnostics.length) {
      // darn, we've got some things wrong, transpile failed :(
      printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, true);

      reject(new BuildError());

    } else {
      // transpile success :)
      resolve();
    }
  });
}


export function canRunTranspileUpdate(event: string, filePath: string, context: BuildContext) {
  if (event === 'change' && context.fileCache) {
    return context.fileCache.has(path.resolve(filePath));
  }
  return false;
}


/**
 * Iterative build for one TS file. If it's not an existing file change, or
 * something errors out then it falls back to do the full build.
 */
function transpileUpdateWorker(event: string, filePath: string, context: BuildContext, workerConfig: TranspileWorkerConfig) {
  try {
    clearDiagnostics(context, DiagnosticsType.TypeScript);

    filePath = path.normalize(path.resolve(filePath));

    // an existing ts file we already know about has changed
    // let's "TRY" to do a single module build for this one file
    if (!cachedTsConfig) {
      cachedTsConfig = getTsConfig(context, workerConfig.configFile);
    }

    // build the ts source maps if the bundler is going to use source maps
    cachedTsConfig.options.sourceMap = buildJsSourceMaps(context);

    const transpileOptions: ts.TranspileOptions = {
      compilerOptions: cachedTsConfig.options,
      fileName: filePath,
      reportDiagnostics: true
    };

    // let's manually transpile just this one ts file
    // since it is an update, it's in memory already
    const sourceText = context.fileCache.get(filePath).content;

    // transpile this one module
    const transpileOutput = ts.transpileModule(sourceText, transpileOptions);

    const diagnostics = runTypeScriptDiagnostics(context, transpileOutput.diagnostics);

    if (diagnostics.length) {
      printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, false, true);

      // darn, we've got some errors with this transpiling :(
      // but at least we reported the errors like really really fast, so there's that
      Logger.debug(`transpileUpdateWorker: transpileModule, diagnostics: ${diagnostics.length}`);

      throw new BuildError(`Failed to transpile file - ${filePath}`);
    } else {
      // convert the path to have a .js file extension for consistency
      const newPath = changeExtension(filePath, '.js');

      const sourceMapFile = { path: newPath + '.map', content: transpileOutput.sourceMapText };
      let jsContent: string = transpileOutput.outputText;
      if (workerConfig.inlineTemplate) {
        // use original path for template inlining
        jsContent = inlineTemplate(transpileOutput.outputText, filePath);
      }
      const jsFile = { path: newPath, content: jsContent };
      const tsFile = { path: filePath, content: sourceText };

      context.fileCache.set(sourceMapFile.path, sourceMapFile);
      context.fileCache.set(jsFile.path, jsFile);
      context.fileCache.set(tsFile.path, tsFile);
    }

    return Promise.resolve();
  } catch (ex) {
    return Promise.reject(ex);
  }
}


export function transpileDiagnosticsOnly(context: BuildContext) {
  return new Promise(resolve => {
    workerEvent.once('DiagnosticsWorkerDone', () => {
      resolve();
    });

    runDiagnosticsWorker(context);
  });
}

const workerEvent = new EventEmitter();
let diagnosticsWorker: ChildProcess = null;

function runDiagnosticsWorker(context: BuildContext) {
  if (!diagnosticsWorker) {
    const workerModule = path.join(__dirname, 'transpile-worker.js');
    diagnosticsWorker = fork(workerModule, [], { env: { FORCE_COLOR: true } });

    Logger.debug(`diagnosticsWorker created, pid: ${diagnosticsWorker.pid}`);

    diagnosticsWorker.on('error', (err: any) => {
      Logger.error(`diagnosticsWorker error, pid: ${diagnosticsWorker.pid}, error: ${err}`);
      workerEvent.emit('DiagnosticsWorkerDone');
    });

    diagnosticsWorker.on('exit', (code: number) => {
      Logger.debug(`diagnosticsWorker exited, pid: ${diagnosticsWorker.pid}`);
      diagnosticsWorker = null;
    });

    diagnosticsWorker.on('message', (msg: TranspileWorkerMessage) => {
      workerEvent.emit('DiagnosticsWorkerDone');
    });
  }

  const msg: TranspileWorkerMessage = {
    rootDir: context.rootDir,
    buildDir: context.buildDir,
    configFile: getTsConfigPath(context)
  };
  diagnosticsWorker.send(msg);
}


export interface TranspileWorkerMessage {
  rootDir?: string;
  buildDir?: string;
  configFile?: string;
  transpileSuccess?: boolean;
}


function cleanFileNames(context: BuildContext, fileNames: string[]) {
  // make sure we're not transpiling the prod when dev and stuff
  return fileNames;
}

function writeSourceFiles(fileCache: FileCache, sourceFiles: ts.SourceFile[]) {
  for (const sourceFile of sourceFiles) {
    const fileName = path.normalize(path.resolve(sourceFile.fileName));
    fileCache.set(fileName, { path: fileName, content: sourceFile.text });
  }
}

function writeTranspiledFilesCallback(fileCache: FileCache, sourcePath: string, data: string, shouldInlineTemplate: boolean) {
  sourcePath = path.normalize(path.resolve(sourcePath));

  if (sourcePath.endsWith('.js')) {
    let file = fileCache.get(sourcePath);
    if (!file) {
      file = { content: '', path: sourcePath };
    }

    if (shouldInlineTemplate) {
      file.content = inlineTemplate(data, sourcePath);
    } else {
      file.content = data;
    }

    fileCache.set(sourcePath, file);

  } else if (sourcePath.endsWith('.js.map')) {

    let file = fileCache.get(sourcePath);
    if (!file) {
      file = { content: '', path: sourcePath };
    }
    file.content = data;

    fileCache.set(sourcePath, file);
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

    const diagnostics = runTypeScriptDiagnostics(context, parsedConfig.errors);

    if (diagnostics.length) {
      printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, true);
      throw new BuildError();
    }

    config = {
      options: parsedConfig.options,
      fileNames: parsedConfig.fileNames,
      raw: parsedConfig.raw
    };
  }

  return config;
}


let cachedProgram: ts.Program = null;
let cachedTsConfig: TsConfig = null;

export function getTsConfigPath(context: BuildContext) {
  return path.join(context.rootDir, 'tsconfig.json');
}

export interface TsConfig {
  options: ts.CompilerOptions;
  fileNames: string[];
  raw: any;
}

export interface TranspileWorkerConfig {
  configFile: string;
  writeInMemory: boolean;
  sourceMaps: boolean;
  cache: boolean;
  inlineTemplate: boolean;
}
