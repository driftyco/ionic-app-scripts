import * as fs from 'fs';
import { Linter, LintResult, RuleFailure } from 'tslint';
import { Diagnostic, Program } from 'typescript';
import { BuildError } from '../util/errors';
import {
  createLinter,
  getLintResult,
  getTsLintConfig,
  lint,
  LinterOptions,
  typeCheck
} from './lint-factory';
import { readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { Logger } from '../logger/logger';
import { printDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTypeScriptDiagnostics } from '../logger/logger-typescript';
import { runTsLintDiagnostics } from '../logger/logger-tslint';


/**
 * Lint files
 * @param {BuildContext} context
 * @param {Program} program
 * @param {string} tsLintConfig - TSLint config file path
 * @param {Array<string>} filePaths
 * @param {LinterOptions} linterOptions
 */
export function lintFiles(context: BuildContext, program: Program, tsLintConfig: string, filePaths: string[], linterOptions?: LinterOptions): Promise<void> {
  const linter = createLinter(context, program);
  const config = getTsLintConfig(tsLintConfig, linterOptions);

  return typeCheck(context, program, linterOptions)
    .then(diagnostics => processTypeCheckDiagnostics(context, diagnostics))
    .then(() => Promise.all(filePaths.map(filePath => lintFile(linter, config, filePath)))
    .then(() => getLintResult(linter))
    // NOTE: We only need to process the lint result after we ran the linter on all the files,
    // otherwise we'll end up with duplicated messages if we process the result after each file gets linted.
    .then((result: LintResult) => processLintResult(context, result)));
}

export function lintFile(linter: Linter, config: any, filePath: string): Promise<void> {
  if (isMpegFile(filePath)) {
    return Promise.reject(`${filePath} is not a valid TypeScript file`);
  }
  return readFileAsync(filePath)
    .then((fileContents: string) => lint(linter, config, filePath, fileContents));
}


/**
 * Process typescript diagnostics after type checking
 * NOTE: This will throw a BuildError if there were any type errors.
 * @param {BuildContext} context
 * @param {Array<Diagnostic>} tsDiagnostics
 */
export function processTypeCheckDiagnostics(context: BuildContext, tsDiagnostics: Diagnostic[]) {
  if (tsDiagnostics.length > 0) {
    const diagnostics = runTypeScriptDiagnostics(context, tsDiagnostics);
    printDiagnostics(context, DiagnosticsType.TypeScript, diagnostics, true, false);
    const files = removeDuplicateFileNames(diagnostics.map(diagnostic => diagnostic.relFileName));
    const errorMessage = generateErrorMessageForFiles(files, 'The following files failed type checking:');
    throw new BuildError(errorMessage);
  }
}


/**
 * Process lint results
 * NOTE: This will throw a BuildError if there were any warnings or errors in any of the lint results.
 * @param {BuildContext} context
 * @param {LintResult} result
 */
export function processLintResult(context: BuildContext, result: LintResult) {
  const files: string[] = [];

  // Only process the lint result if there are errors or warnings (there's no point otherwise)
  if (result.errorCount !== 0 || result.warningCount !== 0) {
    const diagnostics = runTsLintDiagnostics(context, result.failures);
    printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);
    files.push(...getFileNames(context, result.failures));
  }

  if (files.length > 0) {
    const errorMessage = generateErrorMessageForFiles(files);
    throw new BuildError(errorMessage);
  }
}


export function generateErrorMessageForFiles(failingFiles: string[], message?: string) {
  return `${message || 'The following files did not pass tslint:'}\n${failingFiles.join('\n')}`;
}

export function getFileNames(context: BuildContext, failures: RuleFailure[]): string[] {
  return failures.map(failure => failure.getFileName()
    .replace(context.rootDir, '')
    .replace(/^\//g, ''));
}

export function removeDuplicateFileNames(fileNames: string[]) {
  return Array.from(new Set(fileNames));
}

function isMpegFile(file: string) {
  const buffer = new Buffer(256);
  buffer.fill(0);

  const fd = fs.openSync(file, 'r');
  try {
    fs.readSync(fd, buffer, 0, 256, null);
    if (buffer.readInt8(0) === 0x47 && buffer.readInt8(188) === 0x47) {
      Logger.debug(`tslint: ${file}: ignoring MPEG transport stream`);
      return true;
    }
  } finally {
    fs.closeSync(fd);
  }
  return false;
}
