import { readFileSync } from 'fs-extra';
import { extname, normalize, resolve } from 'path';

import 'reflect-metadata';

import {
  CompilerHost,
  CompilerOptions,
  DiagnosticCategory,
  ParsedCommandLine,
  Program,
  transpileModule,
  TranspileOptions,
  TranspileOutput,
  createProgram
} from 'typescript';

import { HybridFileSystem } from '../util/hybrid-file-system';
import { getInstance as getHybridFileSystem } from '../util/hybrid-file-system-factory';
import { getFileSystemCompilerHostInstance } from './compiler-host-factory';
import { FileSystemCompilerHost } from './compiler-host';
import { getFallbackMainContent, replaceBootstrapImpl } from './utils';
import { Logger } from '../logger/logger';
import { printDiagnostics, clearDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTypeScriptDiagnostics } from '../logger/logger-typescript';
import { getTsConfig, TsConfig } from '../transpile';
import { BuildError } from '../util/errors';
import { changeExtension, readFileAsync } from '../util/helpers';
import { BuildContext, CodegenOptions, File, SemverVersion } from '../util/interfaces';

export async function runAot(context: BuildContext, options: AotOptions) {
  const tsConfig = getTsConfig(context);

  const angularCompilerOptions = Object.assign({}, {
    basePath: options.rootDir,
    genDir: options.rootDir,
    entryPoint: options.entryPoint
  });

  const aggregateCompilerOption = Object.assign(tsConfig.options, angularCompilerOptions);

  const fileSystem = getHybridFileSystem(false);
  const compilerHost = getFileSystemCompilerHostInstance(tsConfig.options);
  // todo, consider refactoring at some point
  const tsProgram = createProgram(tsConfig.fileNames, tsConfig.options, compilerHost);

  clearDiagnostics(context, DiagnosticsType.TypeScript);

  if (isNg5(context.angularVersion)) {
    await runNg5Aot(context, tsConfig, aggregateCompilerOption, compilerHost);
  } else {
    await runNg4Aot({
      angularCompilerOptions: aggregateCompilerOption,
      cliOptions: {
        i18nFile: undefined,
        i18nFormat: undefined,
        locale: undefined,
        basePath: options.rootDir,
        missingTranslation: null
      },
      program: tsProgram,
      compilerHost: compilerHost,
      compilerOptions: tsConfig.options
    });
  }

  errorCheckProgram(context, tsConfig, compilerHost, tsProgram);

  // update bootstrap in main.ts
  const mailFilePath = isNg5(context.angularVersion) ? changeExtension(options.entryPoint, '.js') : options.entryPoint;
  const mainFile = context.fileCache.get(mailFilePath);
  const modifiedBootstrapContent = replaceBootstrap(mainFile, options.appNgModulePath, options.appNgModuleClass, options);
  mainFile.content = modifiedBootstrapContent;

  if (isTranspileRequired(context.angularVersion)) {
    transpileFiles(context, tsConfig, fileSystem);
  }
}

function errorCheckProgram(context: BuildContext, tsConfig: TsConfig, compilerHost: FileSystemCompilerHost, cachedProgram: Program) {
  // Create a new Program, based on the old one. This will trigger a resolution of all
  // transitive modules, which include files that might just have been generated.
  const program = createProgram(tsConfig.fileNames, tsConfig.options, compilerHost, cachedProgram);
  const globalDiagnostics = program.getGlobalDiagnostics();
  const tsDiagnostics = program.getSyntacticDiagnostics()
                    .concat(program.getSemanticDiagnostics())
                    .concat(program.getOptionsDiagnostics());

  if (globalDiagnostics.length) {
    const diagnostics = runTypeScriptDiagnostics(context, globalDiagnostics);
    printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, false);
    throw new BuildError(new Error('Failed to transpile TypeScript'));
  }
  if (tsDiagnostics.length) {
    const diagnostics = runTypeScriptDiagnostics(context, tsDiagnostics);
    printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, false);
    throw new BuildError(new Error('Failed to transpile TypeScript'));
  }
  return program;
}

function replaceBootstrap(mainFile: File, appNgModulePath: string, appNgModuleClass: string, options: AotOptions) {
  if (!mainFile) {
    throw new BuildError(new Error(`Could not find entry point (bootstrap file) ${options.entryPoint}`));
  }
  let modifiedFileContent: string = null;
  try {
    Logger.debug('[AotCompiler] compile: Dynamically changing entry point content to AOT mode content');
    modifiedFileContent = replaceBootstrapImpl(mainFile.path, mainFile.content, appNgModulePath, appNgModuleClass);
  } catch (ex) {
    Logger.debug(`Failed to parse bootstrap: `, ex.message);
    Logger.warn(`Failed to parse and update ${options.entryPoint} content for AoT compilation.
                For now, the default fallback content will be used instead.
                Please consider updating ${options.entryPoint} with the content from the following link:
                https://github.com/ionic-team/ionic2-app-base/tree/master/src/app/main.ts`);
    modifiedFileContent = getFallbackMainContent();
  }
  return modifiedFileContent;
}

export function isTranspileRequired(angularVersion: SemverVersion) {
  return angularVersion.major <= 4;
}

export function transpileFiles(context: BuildContext, tsConfig: TsConfig, fileSystem: HybridFileSystem) {
  const tsFiles = context.fileCache.getAll().filter(file => extname(file.path) === '.ts' && file.path.indexOf('.d.ts') === -1);
  for (const tsFile of tsFiles) {
    Logger.debug(`[AotCompiler] transpileFiles: Transpiling file ${tsFile.path} ...`);
    const transpileOutput = transpileFileContent(tsFile.path, tsFile.content, tsConfig.options);
    const diagnostics = runTypeScriptDiagnostics(context, transpileOutput.diagnostics);
    if (diagnostics.length) {
      // darn, we've got some things wrong, transpile failed :(
      printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, true);
      throw new BuildError(new Error('Failed to transpile TypeScript'));
    }

    const jsFilePath = changeExtension(tsFile.path, '.js');
    fileSystem.addVirtualFile(jsFilePath, transpileOutput.outputText);
    fileSystem.addVirtualFile(jsFilePath + '.map', transpileOutput.sourceMapText);

    Logger.debug(`[AotCompiler] transpileFiles: Transpiling file ${tsFile.path} ... DONE`);
  }
}

function transpileFileContent(fileName: string, sourceText: string, options: CompilerOptions): TranspileOutput {
  const transpileOptions: TranspileOptions = {
    compilerOptions: options,
    fileName: fileName,
    reportDiagnostics: true
  };

  return transpileModule(sourceText, transpileOptions);
}

export function isNg5(version: SemverVersion) {
  return version.major >= 5;
}

export async function runNg4Aot(options: CodegenOptions) {
  const module = await import('@angular/compiler-cli');
  return await module.__NGTOOLS_PRIVATE_API_2.codeGen({
    angularCompilerOptions: options.angularCompilerOptions,
    basePath: options.cliOptions.basePath,
    program: options.program,
    host: options.compilerHost,
    compilerOptions: options.compilerOptions,
    i18nFile: options.cliOptions.i18nFile,
    i18nFormat: options.cliOptions.i18nFormat,
    locale: options.cliOptions.locale,
    readResource: (fileName: string) => {
      return readFileAsync(fileName);
    }
  });
}

export async function runNg5Aot(context: BuildContext, tsConfig: TsConfig, aggregateCompilerOptions: CompilerOptions, compilerHost: CompilerHost) {
  const ngTools2 = await import('@angular/compiler-cli/ngtools2');
  const angularCompilerHost = ngTools2.createCompilerHost({options: aggregateCompilerOptions, tsHost: compilerHost});
  const program = ngTools2.createProgram({
    rootNames: tsConfig.fileNames,
    options: aggregateCompilerOptions,
    host: angularCompilerHost,
    oldProgram: null
  });

  await program.loadNgStructureAsync();

  const transformations: any[] = [];

  const transformers = {
    beforeTs: transformations
  };

  const result = program.emit({ emitFlags: ngTools2.EmitFlags.Default, customTransformers: transformers });

  const tsDiagnostics = program.getTsSyntacticDiagnostics()
                                .concat(program.getTsOptionDiagnostics())
                                .concat(program.getTsSemanticDiagnostics());

  const angularDiagnostics = program.getNgStructuralDiagnostics()
                              .concat(program.getNgOptionDiagnostics());


  if (tsDiagnostics.length) {
    const diagnostics = runTypeScriptDiagnostics(context, tsDiagnostics);
    printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, false);
    throw new BuildError(new Error('The Angular AoT build failed. See the issues above'));
  }

  if (angularDiagnostics.length) {
    const diagnostics = runTypeScriptDiagnostics(context, angularDiagnostics as any[]);
    printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, false);
    throw new BuildError(new Error('The Angular AoT build failed. See the issues above'));
  }
}

export interface AotOptions {
  tsConfigPath: string;
  rootDir: string;
  entryPoint: string;
  appNgModulePath: string;
  appNgModuleClass: string;
}
