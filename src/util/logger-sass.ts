import { BuildContext } from './interfaces';
import { Diagnostic, Logger, PrintLine } from './logger';
import { readFileSync } from 'fs';
import { SassError } from 'node-sass';


export function runSassDiagnostics(context: BuildContext, sassError: SassError) {
  if (!sassError) {
    return [];
  }

  const d: Diagnostic = {
    level: 'error',
    syntax: 'css',
    type: 'sass',
    header: 'sass error',
    code: sassError.status && sassError.status.toString(),
    relFileName: null,
    absFileName: null,
    messageText: sassError.message,
    lines: []
  };

  if (sassError.file) {
    d.absFileName = sassError.file;
    d.relFileName = Logger.formatFileName(context.rootDir, d.absFileName);
    d.header = Logger.formatHeader('sass', d.absFileName, context.rootDir, sassError.line);

    if (sassError.line > -1) {
      try {
        const srcLines = readFileSync(d.absFileName, 'utf8').replace(/\\r/g, '\n').split('\n');

        const errorLine: PrintLine = {
          lineIndex: sassError.line - 1,
          lineNumber: sassError.line,
          text: srcLines[sassError.line - 1],
          errorCharStart: sassError.column,
          errorLength: 0
        };

        for (var i = errorLine.errorCharStart; i >= 0; i--) {
          if (STOP_CHARS.indexOf(errorLine.text.charAt(i)) > -1) {
            break;
          }
          errorLine.errorCharStart = i;
        }

        for (var i = errorLine.errorCharStart; i <= errorLine.text.length; i++) {
          if (STOP_CHARS.indexOf(errorLine.text.charAt(i)) > -1) {
            break;
          }
          errorLine.errorLength++;
        }

        if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
          errorLine.errorLength = 1;
          errorLine.errorCharStart--;
        }

        d.lines.push(errorLine);

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

      } catch (e) {
        Logger.debug(`sass loadDiagnostic, ${e}`);
      }
    }

  }

  return [d];
}

const STOP_CHARS = ['', '\n', '\r', '\t', ' ', ':', ';', ',', '{', '}', '.', '#', '@', '!', '[', ']', '(', ')', '&', '+', '~', '^', '*', '$'];
