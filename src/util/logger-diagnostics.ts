import { BuildContext } from './interfaces';
import { Diagnostic, Logger, PrintLine } from './logger';
import { titleCase } from './helpers';
import { join } from 'path';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import * as chalk from 'chalk';


export function printDiagnostics(context: BuildContext, diagnosticsType: string, diagnostics: Diagnostic[], consoleLogDiagnostics: boolean, writeHtmlDiagnostics: boolean) {
  if (diagnostics && diagnostics.length) {

    if (consoleLogDiagnostics) {
      diagnostics.forEach(consoleLogDiagnostic);
    }

    if (writeHtmlDiagnostics) {
      const content = diagnostics.map(generateDiagnosticHtml);
      const fileName = getDiagnosticsFileName(context.buildDir, diagnosticsType);
      writeFileSync(fileName, content.join('\n'), { encoding: 'utf8' });
    }
  }
}


function consoleLogDiagnostic(d: Diagnostic) {
  if (d.level === 'warn') {
    Logger.warn(d.header);
  } else {
    Logger.error(d.header);
  }

  Logger.wordWrap([d.messageText]).forEach(m => {
    console.log(m);
  });
  console.log('');

  if (d.lines && d.lines.length) {
    const lines = removeWhitespaceIndent(d.lines);

    lines.forEach(l => {
      if (!isMeaningfulLine(l.text)) {
        return;
      }

      let msg = `L${l.lineNumber}:  `;
      while (msg.length < Logger.INDENT.length) {
        msg = ' ' + msg;
      }

      let text = l.text;
      if (l.errorCharStart > -1) {
        text = consoleHighlightError(text, l.errorCharStart, l.errorLength);
      }

      msg = chalk.dim(msg);

      if (d.syntax === 'js') {
        msg += jsConsoleSyntaxHighlight(text);
      } else if (d.syntax === 'css') {
        msg += cssConsoleSyntaxHighlight(text, l.errorCharStart);
      } else {
        msg += text;
      }

      console.log(msg);
    });

    console.log('');
  }
}

function consoleHighlightError(errorLine: string, errorCharStart: number, errorLength: number) {
  let rightSideChars = errorLine.length - errorCharStart + errorLength - 1;
  while (errorLine.length + Logger.INDENT.length > Logger.MAX_LEN) {
    if (errorCharStart > (errorLine.length - errorCharStart + errorLength) && errorCharStart > 5) {
      // larger on left side
      errorLine = errorLine.substr(1);
      errorCharStart--;

    } else if (rightSideChars > 1) {
      // larger on right side
      errorLine = errorLine.substr(0, errorLine.length - 1);
      rightSideChars--;

    } else {
      break;
    }
  }

  const lineChars: string[] = [];
  const lineLength = Math.max(errorLine.length, errorCharStart + errorLength);
  for (var i = 0; i < lineLength; i++) {
    var chr = errorLine.charAt(i);
    if (i >= errorCharStart && i < errorCharStart + errorLength) {
      chr = chalk.bgRed(chr === '' ? ' ' : chr);
    }
    lineChars.push(chr);
  }

  return lineChars.join('');
}


let diagnosticsHtmlCache: {[key: string]: any} = {};

export function clearDiagnosticsCache() {
  diagnosticsHtmlCache = {};
}

export function clearDiagnostics(context: BuildContext, type: string) {
  try {
    delete diagnosticsHtmlCache[type];
    unlinkSync(getDiagnosticsFileName(context.buildDir, type));
  } catch (e) {}
}


export function hasDiagnostics(buildDir: string) {
  loadDiagnosticsHtml(buildDir);

  const keys = Object.keys(diagnosticsHtmlCache);
  for (var i = 0; i < keys.length; i++) {
    if (typeof diagnosticsHtmlCache[keys[i]] === 'string') {
      return true;
    }
  }

  return false;
}


function loadDiagnosticsHtml(buildDir: string) {
  try {
    if (diagnosticsHtmlCache[DiagnosticsType.TypeScript] === undefined) {
      diagnosticsHtmlCache[DiagnosticsType.TypeScript] = readFileSync(getDiagnosticsFileName(buildDir, DiagnosticsType.TypeScript), 'utf8');
    }
  } catch (e) {
    diagnosticsHtmlCache[DiagnosticsType.TypeScript] = false;
  }

  try {
    if (diagnosticsHtmlCache[DiagnosticsType.Sass] === undefined) {
      diagnosticsHtmlCache[DiagnosticsType.Sass] = readFileSync(getDiagnosticsFileName(buildDir, DiagnosticsType.Sass), 'utf8');
    }
  } catch (e) {
    diagnosticsHtmlCache[DiagnosticsType.Sass] = false;
  }
}


export function injectDiagnosticsHtml(buildDir: string, content: any) {
  if (!hasDiagnostics(buildDir)) {
    return content;
  }

  let contentStr = content.toString();

  const diagnosticsHtml: string[] = [];
  diagnosticsHtml.push(`<div id="ion-diagnostics">`);
  diagnosticsHtml.push(getDiagnosticsHtmlContent(buildDir));
  diagnosticsHtml.push(`</div>`);

  let match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  if (match) {
    contentStr = contentStr.replace(match[0], match[0] + '\n' + diagnosticsHtml.join('\n'));
  } else {
    contentStr = diagnosticsHtml.join('\n') + contentStr;
  }

  return contentStr;
}


export function getDiagnosticsHtmlContent(buildDir: string) {
  loadDiagnosticsHtml(buildDir);

  const diagnosticsHtml: string[] = [];

  const keys = Object.keys(diagnosticsHtmlCache);
  for (var i = 0; i < keys.length; i++) {
    if (typeof diagnosticsHtmlCache[keys[i]] === 'string') {
      diagnosticsHtml.push(diagnosticsHtmlCache[keys[i]]);
    }
  }

  return diagnosticsHtml.join('\n');
}


function generateDiagnosticHtml(d: Diagnostic) {
  const c: string[] = [];

  c.push(`<div class="ion-diagnostic">`);

  c.push(`<div class="ion-diagnostic-masthead" title="${escapeHtml(d.type)} error: ${escapeHtml(d.code)}">`);

  const header = `${titleCase(d.type)} ${titleCase(d.level)}`;
  c.push(`<div class="ion-diagnostic-header">${escapeHtml(header)}</div>`);

  c.push(`<div class="ion-diagnostic-message" data-error-code="${escapeHtml(d.type)}-${escapeHtml(d.code)}">${escapeHtml(d.messageText)}</div>`);

  c.push(`</div>`); // .ion-diagnostic-masthead

  c.push(`<div class="ion-diagnostic-file">`);

  c.push(`<div class="ion-diagnostic-file-header">${escapeHtml(d.relFileName)}</div>`);

  if (d.lines && d.lines.length) {
    c.push(`<div class="ion-diagnostic-blob">`);

    c.push(`<table class="ion-diagnostic-table">`);

    const lines = removeWhitespaceIndent(d.lines);

    lines.forEach(l => {

      let trCssClass = '';
      let code = l.text;

      if (l.errorCharStart > -1) {
        code = htmlHighlightError(code, l.errorCharStart, l.errorLength);
        trCssClass = ' class="ion-diagnostic-error-line"';
      }

      c.push(`<tr${trCssClass}>`);

      c.push(`<td class="ion-diagnostic-blob-num" data-line-number="${l.lineNumber}"></td>`);

      c.push(`<td class="ion-diagnostic-blob-code">${code}</td>`);

      c.push(`</tr>`);
    });

    c.push(`</table>`);

    c.push(`</div>`); // .ion-diagnostic-blob
  }

  c.push(`</div>`); // .ion-diagnostic-file

  c.push(`</div>`); // .ion-diagnostic

  return c.join('\n');
}


function htmlHighlightError(errorLine: string, errorCharStart: number, errorLength: number) {
  const lineChars: string[] = [];
  const lineLength = Math.max(errorLine.length, errorCharStart + errorLength);
  for (var i = 0; i < lineLength; i++) {
    var chr = errorLine.charAt(i);
    if (i >= errorCharStart && i < errorCharStart + errorLength) {
      chr = `<span class="ion-diagnostics-error-chr">${chr === '' ? ' ' : chr}</span>`;
    }
    lineChars.push(chr);
  }

  return lineChars.join('');
}


function jsConsoleSyntaxHighlight(text: string) {
  if (text.trim().startsWith('//')) {
    return chalk.dim(text);
  }

  const words = text.split(' ').map(word => {
    if (JS_KEYWORDS.indexOf(word) > -1) {
      return chalk.cyan(word);
    }
    return word;
  });

  return words.join(' ');
}


function cssConsoleSyntaxHighlight(text: string, errorCharStart: number) {
  let cssProp = true;
  const safeChars = 'abcdefghijklmnopqrstuvwxyz-_';
  const notProp = '.#,:}@$[]/*';

  const chars: string[] = [];

  for (var i = 0; i < text.length; i++) {
    var c = text.charAt(i);

    if (c === ';' || c === '{') {
      cssProp = true;
    } else if (notProp.indexOf(c) > -1) {
      cssProp = false;
    }
    if (cssProp && safeChars.indexOf(c.toLowerCase()) > -1) {
      chars.push(chalk.cyan(c));
      continue;
    }

    chars.push(c);
  }

  return chars.join('');
}

function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
 }



function removeWhitespaceIndent(orgLines: PrintLine[]) {
  const lines = orgLines.slice();

  for (var i = 0; i < 100; i++) {
    if (!eachLineHasLeadingWhitespace(lines)) {
      return lines;
    }
    for (var i = 0; i < lines.length; i++) {
      lines[i].text = lines[i].text.substr(1);
      lines[i].errorCharStart--;
      if (!lines[i].text.length) {
        return lines;
      }
    }
  }

  return lines;
}


function eachLineHasLeadingWhitespace(lines: PrintLine[]) {
  if (!lines.length) {
    return false;
  }
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].text.length < 1) {
      return false;
    }
    var firstChar = lines[i].text.charAt(0);
    if (firstChar !== ' ' && firstChar !== '\t') {
      return false;
    }
  }
  return true;
}


const JS_KEYWORDS = [
  'as',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
];


function getDiagnosticsFileName(buildDir: string, type: string) {
  return join(buildDir, `.ion-diagnostic-${type}.html`);
}


function isMeaningfulLine(line: string) {
  if (line) {
    line = line.trim();
    if (line.length) {
      return (MEH_LINES.indexOf(line) < 0);
    }
  }
  return false;
}

const MEH_LINES = [';', ':', '{', '}', '(', ')', '/**', '/*', '*/', '*', '({', '})'];

export const DiagnosticsType = {
  TypeScript: 'typescript',
  Sass: 'sass',
  TsLint: 'tslint'
};
