import { BuildContext } from './interfaces';
import { Diagnostic, Logger, PrintLine } from './logger';
import * as ts from 'typescript';


/**
 * Ok, so formatting overkill, we know. But whatever, it makes for great
 * error reporting within a terminal. So, yeah, let's code it up, shall we?
 */

export function runTypeScriptDiagnostics(context: BuildContext, tsDiagnostics: ts.Diagnostic[]) {
  return tsDiagnostics.map(tsDiagnostic => {
    return loadDiagnostic(context, tsDiagnostic);
  });
}


function loadDiagnostic(context: BuildContext, tsDiagnostic: ts.Diagnostic) {
  const d: Diagnostic = {
    level: 'error',
    syntax: 'js',
    type: 'typescript',
    header: 'typescript error',
    code: tsDiagnostic.code.toString(),
    messageText: ts.flattenDiagnosticMessageText(tsDiagnostic.messageText, '\n'),
    relFileName: null,
    absFileName: null,
    lines: []
  };

  if (tsDiagnostic.file) {
    d.absFileName = tsDiagnostic.file.fileName;
    d.relFileName = Logger.formatFileName(context.rootDir, d.absFileName);

    const srcLines = tsDiagnostic.file.getText().replace(/\\r/g, '\n').split('\n');
    const posData = tsDiagnostic.file.getLineAndCharacterOfPosition(tsDiagnostic.start);

    const errorLine: PrintLine = {
      lineIndex: posData.line,
      lineNumber: posData.line + 1,
      text: srcLines[posData.line],
      errorCharStart: posData.character,
      errorLength: Math.max(tsDiagnostic.length, 1)
    };
    d.lines.push(errorLine);

    if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
      errorLine.errorLength = 1;
      errorLine.errorCharStart--;
    }

    d.header =  Logger.formatHeader('typescript', tsDiagnostic.file.fileName, context.rootDir, errorLine.lineNumber);

    if (errorLine.lineIndex > 0) {
      const previousLine: PrintLine = {
        lineIndex: errorLine.lineIndex - 1,
        lineNumber: errorLine.lineNumber - 1,
        text: srcLines[errorLine.lineIndex - 1],
        errorCharStart: -1,
        errorLength: -1
      };
      d.lines.unshift(previousLine);
    }

    if (errorLine.lineIndex + 1 < srcLines.length) {
      const nextLine: PrintLine = {
        lineIndex: errorLine.lineIndex + 1,
        lineNumber: errorLine.lineNumber + 1,
        text: srcLines[errorLine.lineIndex + 1],
        errorCharStart: -1,
        errorLength: -1
      };
      d.lines.push(nextLine);
    }
  }

  return d;
}

