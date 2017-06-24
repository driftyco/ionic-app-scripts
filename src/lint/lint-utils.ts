import * as fs from 'fs';
import { LintResult, RuleFailure } from 'tslint';
import { Diagnostic } from 'typescript';
import { BuildError } from '../util/errors';
import { lint, LinterOptions, typeCheck } from './lint-factory';
import { readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { Logger } from '../logger/logger';
import { printDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTypeScriptDiagnostics } from '../logger/logger-typescript';
import { runTsLintDiagnostics } from '../logger/logger-tslint';


/**
 * Lint files
 * @param {BuildContext} context
 * @param {string} tsConfig - Path to TS config file
 * @param {string|null} tsLintConfig - TSLint config file path
 * @param {Array<string>} filePaths
 * @param {LinterOptions} linterOptions
 */
export function lintFiles(context: BuildContext, tsConfig: string, tsLintConfig: string | null, filePaths: string[], linterOptions?: LinterOptions): Promise<void> {
  return typeCheck(context, tsConfig, linterOptions)
    .then(diagnostics => processTypeCheckDiagnostics(context, diagnostics))
    .then(() => Promise.all(filePaths.map(filePath => lintFile(context, tsConfig, tsLintConfig, filePath, linterOptions)))
    .then((lintResults: LintResult[]) => processLintResults(context, lintResults)));
}

export function lintFile(context: BuildContext, tsConfig: string, tsLintConfig: string | null, filePath: string, linterOptions?: LinterOptions): Promise<LintResult> {
  if (isMpegFile(filePath)) {
    return Promise.reject(`${filePath} is not a valid TypeScript file`);
  }
  return readFileAsync(filePath)
    .then((fileContents: string) => lint(context, tsConfig, tsLintConfig, filePath, fileContents, linterOptions));
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
 * @param {Array<LintResult>} results
 */
export function processLintResults(context: BuildContext, results: LintResult[]) {
  const filesThatDidNotPass: string[] = [];

  for (const result of results) {
    // Only process result if there are no errors or warnings
    if (result.errorCount !== 0 || result.warningCount !== 0) {
      const diagnostics = runTsLintDiagnostics(context, result.failures);
      printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);
      filesThatDidNotPass.push(...getFileNames(context, result.failures));
    }
  }

  const files = removeDuplicateFileNames(filesThatDidNotPass);
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

// TODO: We can just use new Set() to filter duplicate entries
export function removeDuplicateFileNames(fileNames: string[]) {
  const result = [];
  for (const fileName of fileNames) {
    if (result.indexOf(fileName) === -1) {
      result.push(fileName);
    }
  }
  return result;
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
