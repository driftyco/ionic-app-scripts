import { Configuration, Linter, LintResult } from 'tslint';
import { Program, getPreEmitDiagnostics, Diagnostic } from 'typescript';
import { BuildContext } from '../util/interfaces';
import { isObject } from 'util';


export interface LinterOptions {
  typeCheck?: boolean;
}


/**
 * Run linter on a file
 * @param {BuildContext} context
 * @param {string} tsLintConfig
 * @param {string} tsConfig
 * @param {string} filePath
 * @param {string} fileContents
 * @param {LinterOptions} linterOptions
 * @return {LintResult}
 */
export function lint(context: BuildContext, tsConfig: string, tsLintConfig: string | null, filePath: string, fileContents: string, linterOptions?: LinterOptions): LintResult {
  const linter = getLinter(context, tsConfig);
  const configuration = Configuration.findConfiguration(tsLintConfig, filePath);
  linter.lint(filePath, fileContents, Object.assign(configuration.results, isObject(linterOptions) ? {linterOptions} : {}));
  return linter.getResult();
}


/**
 * Type check a TS program
 * @param {BuildContext} context
 * @param {string} tsConfig
 * @param {LinterOptions} linterOptions
 * @return {Promise<Diagnostic[]>}
 */
export function typeCheck(context: BuildContext, tsConfig: string, linterOptions?: LinterOptions): Promise<Diagnostic[]> {
  if (isObject(linterOptions) && linterOptions.typeCheck) {
    const program = createProgram(context, tsConfig);
    return Promise.resolve(getPreEmitDiagnostics(program));
  }
  return Promise.resolve([]);
}


/**
 * Create a TS program based on the BuildContext {srcDir} or TS config file path (if provided)
 * @param {BuildContext} context
 * @param {string} tsConfig
 * @return {Program}
 */
export function createProgram(context: BuildContext, tsConfig: string): Program {
  return Linter.createProgram(tsConfig, context.rootDir);
}


/**
 * Get all files that are sourced in TS config
 * @param {BuildContext} context
 * @param {string} tsConfig
 * @return {Array<string>}
 */
export function getFileNames(context: BuildContext, tsConfig: string): string[] {
  const program = createProgram(context, tsConfig);
  return Linter.getFileNames(program);
}


/**
 * Get linter
 * @param {BuildContext} context
 * @param {string} tsConfig
 * @return {Linter}
 */
export function getLinter(context: BuildContext, tsConfig: string): Linter {
  const program = createProgram(context, tsConfig);

  return new Linter({
    fix: false
  }, program);
}
