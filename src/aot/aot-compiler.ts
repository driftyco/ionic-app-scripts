import { readFileSync } from 'fs-extra';
import { extname, normalize, resolve } from 'path';

import 'reflect-metadata';
import { CompilerOptions, createProgram, ParsedCommandLine, Program,  transpileModule, TranspileOptions, TranspileOutput } from 'typescript';
import { NgcCliOptions }from '@angular/compiler-cli';
import { tsc } from '@angular/tsc-wrapped/src/tsc';
import AngularCompilerOptions from '@angular/tsc-wrapped/src/options';

import { HybridFileSystem } from '../util/hybrid-file-system';
import { getInstance as getHybridFileSystem } from '../util/hybrid-file-system-factory';
import { getInstance } from './compiler-host-factory';
import { NgcCompilerHost } from './compiler-host';
import { getFallbackMainContent, replaceBootstrap } from './utils';
import { Logger } from '../logger/logger';
import { printDiagnostics, clearDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTypeScriptDiagnostics } from '../logger/logger-typescript';
import { BuildError } from '../util/errors';
import { changeExtension } from '../util/helpers';
import { BuildContext } from '../util/interfaces';

import { doCodegen } from './codegen';

export class AotCompiler {

  private tsConfig: ParsedTsConfig;
  private angularCompilerOptions: AngularCompilerOptions;
  private program: Program;
  private compilerHost: NgcCompilerHost;
  private fileSystem: HybridFileSystem;
  private lazyLoadedModuleDictionary: any;

  constructor(private context: BuildContext, private options: AotOptions) {
    this.tsConfig = getNgcConfig(this.context, this.options.tsConfigPath);

    this.angularCompilerOptions = Object.assign({}, this.tsConfig.ngOptions, {
      basePath: this.options.rootDir,
      entryPoint: this.options.entryPoint
    });

    this.fileSystem = getHybridFileSystem();
    this.compilerHost = getInstance(this.tsConfig.parsed.options);
    this.program = createProgram(this.tsConfig.parsed.fileNames, this.tsConfig.parsed.options, this.compilerHost);
  }

  compile(): Promise<any> {
    return Promise.resolve().then(() => {
    }).then(() => {
      clearDiagnostics(this.context, DiagnosticsType.TypeScript);
      const i18nOptions: NgcCliOptions = {
        i18nFile: undefined,
        i18nFormat: undefined,
        locale: undefined,
        basePath: this.options.rootDir
      };

      Logger.debug('[AotCompiler] compile: starting codegen ... ');
      return doCodegen({
        angularCompilerOptions: this.angularCompilerOptions,
        cliOptions: i18nOptions,
        program: this.program,
        compilerHost: this.compilerHost,
        compilerOptions: this.tsConfig.parsed.options
      });
    }).then(() => {
      Logger.debug('[AotCompiler] compile: starting codegen ... DONE');
      Logger.debug('[AotCompiler] compile: Creating and validating new TypeScript Program ...');
      this.program = errorCheckProgram(this.context, this.tsConfig, this.compilerHost, this.program);
      Logger.debug('[AotCompiler] compile: Creating and validating new TypeScript Program ... DONE');
    })
    .then(() => {

      Logger.debug('[AotCompiler] compile: The following files are included in the program: ');
      for ( const fileName of this.tsConfig.parsed.fileNames) {
        Logger.debug(`[AotCompiler] compile: ${fileName}`);
        const cleanedFileName = normalize(resolve(fileName));
        const content = readFileSync(cleanedFileName).toString();
        this.context.fileCache.set(cleanedFileName, { path: cleanedFileName, content: content});
      }
    }).then(() => {
      Logger.debug('[AotCompiler] compile: Starting to process and modify entry point ...');
      const mainFile = this.context.fileCache.get(this.options.entryPoint);
      if (!mainFile) {
        throw new BuildError(new Error(`Could not find entry point (bootstrap file) ${this.options.entryPoint}`));
      }
      Logger.debug('[AotCompiler] compile: Resolving NgModule from entry point');
      let modifiedFileContent: string = null;
      try {
        Logger.debug('[AotCompiler] compile: Dynamically changing entry point content to AOT mode content');
        modifiedFileContent = replaceBootstrap(mainFile.path, mainFile.content, this.options.appNgModulePath, this.options.appNgModuleClass);
      } catch (ex) {
        Logger.debug(`Failed to parse bootstrap: `, ex.message);
        Logger.warn(`Failed to parse and update ${this.options.entryPoint} content for AoT compilation.
                    For now, the default fallback content will be used instead.
                    Please consider updating ${this.options.entryPoint} with the content from the following link:
                    https://github.com/ionic-team/ionic2-app-base/tree/master/src/app/main.ts`);
        modifiedFileContent = getFallbackMainContent();
      }

      Logger.debug(`[AotCompiler] compile: Modified File Content: ${modifiedFileContent}`);
      this.context.fileCache.set(this.options.entryPoint, { path: this.options.entryPoint, content: modifiedFileContent});
      Logger.debug('[AotCompiler] compile: Starting to process and modify entry point ... DONE');
    })
    .then(() => {
      Logger.debug('[AotCompiler] compile: Transpiling files ...');
      transpileFiles(this.context, this.tsConfig, this.fileSystem);
      Logger.debug('[AotCompiler] compile: Transpiling files ... DONE');
    }).then(() => {
      return {
        lazyLoadedModuleDictionary: this.lazyLoadedModuleDictionary
      };
    });
  }
}

function errorCheckProgram(context: BuildContext, tsConfig: ParsedTsConfig, compilerHost: NgcCompilerHost, cachedProgram: Program) {
  // Create a new Program, based on the old one. This will trigger a resolution of all
  // transitive modules, which include files that might just have been generated.
  const program = createProgram(tsConfig.parsed.fileNames, tsConfig.parsed.options, compilerHost, cachedProgram);
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

function transpileFiles(context: BuildContext, tsConfig: ParsedTsConfig, fileSystem: HybridFileSystem) {
  const tsFiles = context.fileCache.getAll().filter(file => extname(file.path) === '.ts' && file.path.indexOf('.d.ts') === -1);
  for (const tsFile of tsFiles) {
    Logger.debug(`[AotCompiler] transpileFiles: Transpiling file ${tsFile.path} ...`);
    const transpileOutput = transpileFileContent(tsFile.path, tsFile.content, tsConfig.parsed.options);
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

export interface AotOptions {
  tsConfigPath: string;
  rootDir: string;
  entryPoint: string;
  appNgModulePath: string;
  appNgModuleClass: string;
}

export function getNgcConfig(context: BuildContext, tsConfigPath?: string): ParsedTsConfig {

  const tsConfigFile = tsc.readConfiguration(tsConfigPath, process.cwd());
  if (!tsConfigFile) {
    throw new BuildError(`tsconfig: invalid tsconfig file, "${tsConfigPath}"`);

  }
  return tsConfigFile;
}

export interface ParsedTsConfig {
  parsed: ParsedCommandLine;
  ngOptions: AngularCompilerOptions;
}

