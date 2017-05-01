import * as fs from 'fs';
import { Program } from 'typescript';
import { BuildError } from '../util/errors';
import { getLinter } from './lint-factory';
import { readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { Logger } from '../logger/logger';
import { printDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTsLintDiagnostics } from '../logger/logger-tslint';

export function isMpegFile(file: string) {
  var buffer = new Buffer(256);
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

export function lintFile(context: BuildContext, program: Program, filePath: string): Promise<LintResult> {
  return Promise.resolve().then(() => {
    if (isMpegFile(filePath)) {
      throw new Error(`${filePath} is not a valid TypeScript file`);
    }
    return readFileAsync(filePath);
  }).then((fileContents: string) => {

    const linter = getLinter(filePath, fileContents, program);
    const lintResult = linter.lint();

    return {
      filePath: filePath,
      failures: lintResult.failures
    };
  });
}

export function processLintResults(context: BuildContext, lintResults: LintResult[]) {
  const filesThatDidntPass: string[] = [];
  for (const lintResult of lintResults) {
    if (lintResult && lintResult.failures && lintResult.failures.length) {
      const diagnostics = runTsLintDiagnostics(context, <any>lintResult.failures);
      printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);
      filesThatDidntPass.push(lintResult.filePath);
    }
  }
  if (filesThatDidntPass.length) {
    const errorMsg = generateFormattedErrorMsg(filesThatDidntPass);
    throw new BuildError(errorMsg);
  }
}

export function generateFormattedErrorMsg(failingFiles: string[]) {
  let listOfFilesString = '';
  failingFiles.forEach(file => listOfFilesString = listOfFilesString + file + '\n');
  return `The following files did not pass tslint: \n${listOfFilesString}`;
}

export interface LintResult {
  failures: any[];
  filePath: string;
};
