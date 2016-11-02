import { BuildContext, File } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { buildJsSourceMaps } from './bundle';
import { changeExtension, endsWith } from './util/helpers';
import { generateContext } from './util/config';
import { inlineTemplate } from './template';
import { join, normalize, resolve } from 'path';
import { lintUpdate } from './lint';
import { readFileSync } from 'fs';
import { runDiagnostics } from './util/logger-typescript';
import { runWorker } from './worker-client';
import * as ts from 'typescript';


export function transpile(context?: BuildContext) {
  context = generateContext(context);

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
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function transpileUpdate(event: string, filePath: string, context: BuildContext) {
  if (!filePath.endsWith('.ts') && cachedTsFiles) {
    // however this ran, the changed file wasn't a .ts file
    // so if we already have tsFiles then make sure the context
    // has them and carry on
    context.fileCache = cachedTsFiles;
    return Promise.resolve();
  }

  const workerConfig: TranspileWorkerConfig = {
    configFile: getTsConfigPath(context),
    writeInMemory: true,
    sourceMaps: true,
    cache: false,
    inlineTemplate: context.inlineTemplates
  };

  const logger = new Logger('transpile update');

  return transpileUpdateWorker(event, filePath, context, workerConfig)
    .then(tsFiles => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


/**
 * The full TS build for all app files.
 */
export function transpileWorker(context: BuildContext, workerConfig: TranspileWorkerConfig) {
  // forget any tsFiles we've already cached
  if (workerConfig.writeInMemory) {
    context.fileCache = null;
  }

  // let's do this
  return new Promise((resolve, reject) => {

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

    const cache = new Map<string, File>();

    const program = ts.createProgram(tsFileNames, tsConfig.options, host, cachedProgram);
    program.emit(undefined, (path: string, data: string, writeByteOrderMark: boolean, onError: Function, sourceFiles: ts.SourceFile[]) => {
      if (workerConfig.writeInMemory) {
        writeSourceFiles(cache, sourceFiles);
        writeTranspiledFilesCallback(cache, path, data, workerConfig.inlineTemplate);
      }
    });

    const tsDiagnostics = program.getSyntacticDiagnostics()
                          .concat(program.getSemanticDiagnostics())
                          .concat(program.getOptionsDiagnostics());

    const hasDiagnostics = runDiagnostics(context, tsDiagnostics);

    if (hasDiagnostics) {
      // transpile failed :(
      cachedProgram = cachedTsFiles = null;
      reject(new BuildError());

    } else {
      // transpile success :)
      // cache the typescript program for later use
      cachedProgram = program;

      if (workerConfig.writeInMemory) {
        context.fileCache = cache;
      }

      if (workerConfig.cache) {
        cachedTsFiles = cache;
      }

      resolve();
    }
  });
}


/**
 * Iterative build for one TS file. If it's not an existing file change, or
 * something errors out then it falls back to do the full build.
 */
function transpileUpdateWorker(event: string, filePath: string, context: BuildContext, workerConfig: TranspileWorkerConfig) {
  filePath = resolve(filePath);

  // let's run tslint on this one file too, but run it in another
  // processor core and don't let it's results hang anything up
  lintUpdate(event, filePath, context);

  let file: File = null;
  if (context.fileCache) {
    file = context.fileCache.get(filePath);
  }
  if (event === 'change' && file) {
    try {
      // an existing ts file we already know about has changed
      // let's "TRY" to do a single module build for this one file
      const tsConfig = getTsConfig(context, workerConfig.configFile);

      // build the ts source maps if the bundler is going to use source maps
      tsConfig.options.sourceMap = buildJsSourceMaps(context);

      const transpileOptions: ts.TranspileOptions = {
        compilerOptions: tsConfig.options,
        fileName: filePath,
        reportDiagnostics: true
      };

      // let's manually transpile just this one ts file
      // load up the source text for this one module
      const sourceText = readFileSync(filePath, 'utf8');

      // transpile this one module
      const transpileOutput = ts.transpileModule(sourceText, transpileOptions);

      const hasDiagnostics = runDiagnostics(context, transpileOutput.diagnostics);

      if (hasDiagnostics) {
        // darn, we've got some errors with this transpiling :(
        // but at least we reported the errors like really really fast, so there's that
        Logger.debug(`transpileUpdateWorker: transpileModule, diagnostics: ${transpileOutput.diagnostics.length}`);
        return Promise.reject(new BuildError());

      } else if (!transpileOutput.outputText) {
        // derp, not sure how there's no output text, just do a full build
        Logger.debug(`transpileUpdateWorker: transpileModule, missing output text`);

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
        const tsFile = { path: filePath, content: sourceText};

        context.fileCache.set(sourceMapFile.path, sourceMapFile);
        context.fileCache.set(jsFile.path, jsFile);
        context.fileCache.set(tsFile.path, tsFile);

        // cool, the lil transpiling went through, but
        // let's still do the big transpiling (on another processor core)
        // and if there's anything wrong it'll print out messages
        // however, it doesn't hang anything up
        // also make sure it does a little as possible
        const fullBuildWorkerConfig: TranspileWorkerConfig = {
          configFile: workerConfig.configFile,
          writeInMemory: false,
          sourceMaps: false,
          cache: false,
          inlineTemplate: false
        };
        runWorker('transpile', 'transpileWorker', context, fullBuildWorkerConfig);

        return Promise.resolve();
      }

    } catch (e) {
      // umm, oops. Yeah let's just do a full build then
      Logger.debug(`transpileModule error: ${e}`);
      throw new BuildError(e);
    }
  }

  // do a full build if it wasn't an existing file that changed
  // or we haven't transpiled the whole thing yet
  // or there were errors trying to transpile just the one module
  Logger.debug(`transpileUpdateWorker: full build, context.tsFiles ${!!context.fileCache}, event: ${event}, file: ${filePath}`);
  return transpileWorker(context, workerConfig);
}


function cleanFileNames(context: BuildContext, fileNames: string[]) {
  // make sure we're not transpiling the prod when dev and stuff
  const removeFileName = (context.isProd) ? 'main.dev.ts' : 'main.prod.ts';
  return fileNames.filter(f => (f.indexOf(removeFileName) === -1));
}

function writeSourceFiles(fileCache: Map<String, File>, sourceFiles: ts.SourceFile[]) {
  for (const sourceFile of sourceFiles) {
    fileCache.set(sourceFile.fileName, { path: sourceFile.fileName, content: sourceFile.text });
  }
}

function writeTranspiledFilesCallback(fileCache: Map<String, File>, sourcePath: string, data: string, shouldInlineTemplate: boolean) {
  sourcePath = normalize(sourcePath);

  if (endsWith(sourcePath, '.js')) {
    sourcePath = sourcePath.substring(0, sourcePath.length - 3) + '.js';

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

  } else if (endsWith(sourcePath, '.js.map')) {

    sourcePath = sourcePath.substring(0, sourcePath.length - 7) + '.js.map';
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

    const hasDiagnostics = runDiagnostics(context, parsedConfig.errors);

    if (hasDiagnostics) {
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
let cachedTsFiles: Map<string, File> = null;

export function getTsConfigPath(context: BuildContext) {
  return join(context.rootDir, 'tsconfig.json');
}

export interface TsConfig {
  options: ts.CompilerOptions;
  fileNames: string[];
  typingOptions: ts.TypingOptions;
  raw: any;
}

export interface TranspileWorkerConfig {
  configFile: string;
  writeInMemory: boolean;
  sourceMaps: boolean;
  cache: boolean;
  inlineTemplate: boolean;
}
