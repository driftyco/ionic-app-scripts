import { mkdirpSync, readFileSync, writeFileSync } from 'fs-extra';
import { basename, dirname, extname, join, normalize, relative, resolve } from 'path';

import 'reflect-metadata';
import { CompilerOptions, createProgram, ParsedCommandLine, Program, ScriptTarget, transpileModule, TranspileOptions, TranspileOutput } from 'typescript';
import { CodeGenerator, NgcCliOptions, NodeReflectorHostContext, ReflectorHost, StaticReflector }from '@angular/compiler-cli';
import { tsc } from '@angular/tsc-wrapped/src/tsc';
import AngularCompilerOptions from '@angular/tsc-wrapped/src/options';

import { HybridFileSystem } from '../util/hybrid-file-system';
import { getInstance as getHybridFileSystem } from '../util/hybrid-file-system-factory';
import { getInstance } from './compiler-host-factory';
import { NgcCompilerHost } from './compiler-host';
import { resolveAppNgModuleFromMain } from './app-module-resolver';
import { patchReflectorHost } from './reflector-host';
import { getTypescriptSourceFile, removeDecorators } from '../util/typescript-utils';
import { getFallbackMainContent, replaceBootstrap } from './utils';
import { Logger } from '../logger/logger';
import { printDiagnostics, clearDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTypeScriptDiagnostics } from '../logger/logger-typescript';
import { isDebugMode } from '../util/config';
import { BuildError } from '../util/errors';
import { changeExtension } from '../util/helpers';
import { BuildContext } from '../util/interfaces';

export class AotCompiler {

  private tsConfig: ParsedTsConfig;
  private angularCompilerOptions: AngularCompilerOptions;
  private program: Program;
  private reflector: StaticReflector;
  private reflectorHost: ReflectorHost;
  private compilerHost: NgcCompilerHost;
  private fileSystem: HybridFileSystem;

  constructor(private context: BuildContext, private options: AotOptions) {
    this.tsConfig = getNgcConfig(this.context, this.options.tsConfigPath);

    this.angularCompilerOptions = Object.assign({}, this.tsConfig.ngOptions, {
      basePath: this.options.rootDir,
      entryPoint: this.options.entryPoint
    });

    this.fileSystem = getHybridFileSystem();
    this.compilerHost = getInstance(this.tsConfig.parsed.options);
    this.program = createProgram(this.tsConfig.parsed.fileNames, this.tsConfig.parsed.options, this.compilerHost);
    this.reflectorHost = new ReflectorHost(this.program, this.compilerHost, this.angularCompilerOptions);
    this.reflector = new StaticReflector(this.reflectorHost);
  }

  compile() {
    return Promise.resolve().then(() => {
    }).then(() => {
      clearDiagnostics(this.context, DiagnosticsType.TypeScript);
      const i18nOptions: NgcCliOptions = {
        i18nFile: undefined,
        i18nFormat: undefined,
        locale: undefined,
        basePath: this.options.rootDir
      };

      // Create the Code Generator.
      const codeGenerator = CodeGenerator.create(
        this.angularCompilerOptions,
        i18nOptions,
        this.program,
        this.compilerHost,
        new NodeReflectorHostContext(this.compilerHost)
      );

      // We need to temporarily patch the CodeGenerator until either it's patched or allows us
      // to pass in our own ReflectorHost.
      patchReflectorHost(codeGenerator);
      Logger.debug('[AotCompiler] compile: starting codegen ... ');
      return codeGenerator.codegen({transitiveModules: true});
    }).then(() => {
      console.log('this.tsConfig.parsed.fileNames: ', this.tsConfig.parsed.fileNames);
      Logger.debug('[AotCompiler] compile: starting codegen ... DONE');
      Logger.debug('[AotCompiler] compile: Creating and validating new TypeScript Program ...');
      // Create a new Program, based on the old one. This will trigger a resolution of all
      // transitive modules, which include files that might just have been generated.
      this.program = createProgram(this.tsConfig.parsed.fileNames, this.tsConfig.parsed.options, this.compilerHost, this.program);
      const globalDiagnostics = this.program.getGlobalDiagnostics();
      const tsDiagnostics = this.program.getSyntacticDiagnostics()
                        .concat(this.program.getSemanticDiagnostics())
                        .concat(this.program.getOptionsDiagnostics());

      if (globalDiagnostics.length) {
        const diagnostics = runTypeScriptDiagnostics(this.context, globalDiagnostics);
        printDiagnostics(this.context, DiagnosticsType.TypeScript, diagnostics, true, false);
        throw new BuildError(new Error('Failed to transpile TypeScript'));
      }
      if (tsDiagnostics.length) {
        const diagnostics = runTypeScriptDiagnostics(this.context, tsDiagnostics);
        printDiagnostics(this.context, DiagnosticsType.TypeScript, diagnostics, true, false);
        throw new BuildError(new Error('Failed to transpile TypeScript'));
      }
    })
    .then(() => {
      Logger.debug('[AotCompiler] compile: Creating and validating new TypeScript Program ... DONE');
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
      const mainSourceFile = getTypescriptSourceFile(mainFile.path, mainFile.content, ScriptTarget.Latest, false);
      Logger.debug('[AotCompiler] compile: Resolving NgModule from entry point');
      const AppNgModuleStringAndClassName = resolveAppNgModuleFromMain(mainSourceFile, this.context.fileCache, this.compilerHost, this.program);
      const AppNgModuleTokens = AppNgModuleStringAndClassName.split('#');

      let modifiedFileContent: string = null;
      try {
        Logger.debug('[AotCompiler] compile: Dynamically changing entry point content to AOT mode content');
        modifiedFileContent = replaceBootstrap(mainFile.path, mainFile.content, AppNgModuleTokens[0], AppNgModuleTokens[1]);
      } catch (ex) {
        Logger.debug(`Failed to parse bootstrap: `, ex.message);
        Logger.warn(`Failed to parse and update ${this.options.entryPoint} content for AoT compilation.
                    For now, the default fallback content will be used instead.
                    Please consider updating ${this.options.entryPoint} with the content from the following link:
                    https://github.com/driftyco/ionic2-app-base/tree/master/src/app/main.ts`);
        modifiedFileContent = getFallbackMainContent();
      }

      Logger.debug(`[AotCompiler] compile: Modified File Content: ${modifiedFileContent}`);
      this.context.fileCache.set(this.options.entryPoint, { path: this.options.entryPoint, content: modifiedFileContent});
    })
    .then(() => {
      Logger.debug('[AotCompiler] compile: Starting to process and modify entry point ... DONE');
      Logger.debug('[AotCompiler] compile: Removing decorators from program files ...');
      const tsFiles = this.context.fileCache.getAll().filter(file => extname(file.path) === '.ts' && file.path.indexOf('.d.ts') === -1);
      for (const tsFile of tsFiles) {
        const cleanedFileContent = removeDecorators(tsFile.path, tsFile.content);
        tsFile.content = cleanedFileContent;
        const transpileOutput = this.transpileFileContent(tsFile.path, cleanedFileContent, this.tsConfig.parsed.options);
        const diagnostics = runTypeScriptDiagnostics(this.context, transpileOutput.diagnostics);
        if (diagnostics.length) {
          // darn, we've got some things wrong, transpile failed :(
          printDiagnostics(this.context, DiagnosticsType.TypeScript, diagnostics, true, true);
          throw new BuildError();
        }

        const jsFilePath = changeExtension(tsFile.path, '.js');
        this.fileSystem.addVirtualFile(jsFilePath, transpileOutput.outputText);
        this.fileSystem.addVirtualFile(jsFilePath + '.map', transpileOutput.sourceMapText);

        // write files to disk here if debug is enabled
        if (isDebugMode()) {
          writeNgcFilesToDisk(this.context, tsFile.path, tsFile.content, transpileOutput.outputText, transpileOutput.sourceMapText);
        }
      }
      Logger.debug('[AotCompiler] compile: Removing decorators from program files ... DONE');
    });
  }

  transpileFileContent(fileName: string, sourceText: string, options: CompilerOptions): TranspileOutput {
    const transpileOptions: TranspileOptions = {
      compilerOptions: options,
      fileName: fileName,
      reportDiagnostics: true
    };

    return transpileModule(sourceText, transpileOptions);
  }
}

function writeNgcFilesToDisk(context: BuildContext, typescriptFilePath: string, typescriptFileContent: string, transpiledFileContent: string, sourcemapContent: string) {
    const dirName = dirname(typescriptFilePath);
    const relativePath = relative(process.cwd(), dirName);
    const tmpPath = join(context.tmpDir, relativePath);
    const fileName = basename(typescriptFilePath);
    const fileToWrite = join(tmpPath, fileName);
    const jsFileToWrite = changeExtension(fileToWrite, '.js');

    mkdirpSync(tmpPath);
    writeFileSync(fileToWrite, typescriptFileContent);
    writeFileSync(jsFileToWrite, transpiledFileContent);
    writeFileSync(jsFileToWrite + '.map', sourcemapContent);
  }

export interface AotOptions {
  tsConfigPath: string;
  rootDir: string;
  entryPoint: string;
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
