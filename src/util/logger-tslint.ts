import { BuildContext } from './interfaces';
import { Diagnostic, Logger, PrintLine } from './logger';
import { objectAssign } from './helpers';


export function runDiagnostics(context: BuildContext, failures: RuleFailure[]) {
  const diagnostics = failures.map(failure => {
    return loadDiagnostic(context, failure);
  });

  if (diagnostics.length) {
    diagnostics.forEach(d => {
      Logger.printDiagnostic(objectAssign({}, d));
    });
    return true;
  }

  return false;
}


function loadDiagnostic(context: BuildContext, f: RuleFailure) {
  const start: RuleFailurePosition = f.startPosition.toJson();
  const end: RuleFailurePosition = f.endPosition.toJson();

  const d: Diagnostic = {
    level: 'warn',
    syntax: 'js',
    type: 'tslint',
    fileName: Logger.formatFileName(context.rootDir, f.fileName),
    header: Logger.formatHeader('tslint', f.fileName, context.rootDir, start.line + 1, end.line + 1),
    code: f.ruleName,
    messageText: f.failure,
    lines: []
  };

  if (f.sourceFile && f.sourceFile.text) {
    const srcLines: string[] = f.sourceFile.text.replace(/\\r/g, '\n').split('\n');

    for (var i = start.line; i <= end.line; i++) {
      if (srcLines[i].trim().length) {
        var errorLine: PrintLine = {
          lineIndex: i,
          lineNumber: i + 1,
          text: srcLines[i],
          errorCharStart: (i === start.line) ? start.character : (i === end.line) ? end.character : -1,
          errorLength: 0,
        };
        for (var j = errorLine.errorCharStart; j < errorLine.text.length; j++) {
          if (STOP_CHARS.indexOf(errorLine.text.charAt(j)) > -1) {
            break;
          }
          errorLine.errorLength++;
        }

        if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
          errorLine.errorLength = 1;
          errorLine.errorCharStart--;
        }

        d.lines.push(errorLine);
      }
    }

    if (start.line > 0 && Logger.meaningfulLine(srcLines[start.line - 1])) {
      const beforeLine: PrintLine = {
        lineIndex: start.line - 1,
        lineNumber: start.line,
        text: srcLines[start.line - 1],
        errorCharStart: -1,
        errorLength: -1
      };
      d.lines.unshift(beforeLine);
    }

    if (end.line < srcLines.length && Logger.meaningfulLine(srcLines[end.line + 1])) {
      const afterLine: PrintLine = {
        lineIndex: end.line + 1,
        lineNumber: end.line + 2,
        text: srcLines[end.line + 1],
        errorCharStart: -1,
        errorLength: -1
      };
      d.lines.push(afterLine);
    }
  }

  return d;
}


const STOP_CHARS = [' ', '=', ',', '.', '\t', '{', '}', '(', ')', '"', '\'', '`', '?', ':', ';', '+', '-', '*', '/', '<', '>', '&', '[', ']', '|'];


export interface RuleFailure {
  sourceFile: any;
  failure: string;
  ruleName: string;
  fix: any;
  fileName: string;
  startPosition: any;
  endPosition: any;
}

export interface RuleFailurePosition {
  character: number;
  line: number;
  position: number;
}
