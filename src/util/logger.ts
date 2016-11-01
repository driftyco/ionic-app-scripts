import { emit, EventType } from './events';
import { join } from 'path';
import { isDebugMode } from './config';
import { readJSONSync } from 'fs-extra';
import * as chalk from 'chalk';


export class BuildError extends Error {
  hasBeenLogged = false;

  constructor(err?: any) {
    super();
    if (err) {
      if (err.message) {
        this.message = err.message;
      } else if (err) {
        this.message = err;
      }
      if (err.stack) {
        this.stack = err.stack;
      }
      if (err.name) {
        this.name = err.name;
      }
      if (typeof err.hasBeenLogged === 'boolean') {
        this.hasBeenLogged = err.hasBeenLogged;
      }
    }
  }

  toJson() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
      hasBeenLogged: this.hasBeenLogged
    };
  }
}

/* There are special cases where strange things happen where we don't want any logging, etc.
 * For our sake, it is much easier to get off the happy path of code and just throw an exception
 * and do nothing with it
 */
export class IgnorableError extends Error {
  constructor(msg?: string) {
    super(msg);
  }
}



export class Logger {
  private start: number;
  private scope: string;

  constructor(scope: string) {
    this.start = Date.now();
    this.scope = scope;
    let msg = `${scope} started ${chalk.dim('...')}`;
    if (isDebugMode()) {
      msg += memoryUsage();
    }
    Logger.info(msg);

    const taskEvent: TaskEvent = {
      scope: this.scope.split(' ')[0],
      type: 'start',
      msg: `${scope} started ...`
    };
    emit(EventType.TaskEvent, taskEvent);
  }

  ready(chalkColor?: Function) {
    this.completed('ready', chalkColor);
  }

  finish(chalkColor?: Function) {
    this.completed('finished', chalkColor);
  }

  private completed(type: string, chalkColor: Function) {

    const taskEvent: TaskEvent = {
      scope: this.scope.split(' ')[0],
      type: type
    };

    taskEvent.duration = Date.now() - this.start;

    if (taskEvent.duration > 1000) {
      taskEvent.time = 'in ' + (taskEvent.duration / 1000).toFixed(2) + ' s';

    } else {
      let ms = parseFloat((taskEvent.duration).toFixed(3));
      if (ms > 0) {
        taskEvent.time = 'in ' + taskEvent.duration + ' ms';
      } else {
        taskEvent.time = 'in less than 1 ms';
      }
    }

    taskEvent.msg = `${this.scope} ${taskEvent.type} ${taskEvent.time}`;
    emit(EventType.TaskEvent, taskEvent);

    let msg = `${this.scope} ${type}`;
    if (chalkColor) {
      msg = chalkColor(msg);
    }

    msg += ' ' + chalk.dim(taskEvent.time);

    if (isDebugMode()) {
      msg += memoryUsage();
    }

    Logger.info(msg);
  }

  fail(err: Error) {
    if (err) {
      if (err instanceof IgnorableError) {
        return;
      }

      // only emit the event if it's a valid error
      const taskEvent: TaskEvent = {
        scope: this.scope.split(' ')[0],
        type: 'failed',
        msg: this.scope + ' failed'
      };
      emit(EventType.TaskEvent, taskEvent);

      if (err instanceof BuildError) {
        let failedMsg = `${this.scope} failed`;
        if (err.message) {
          failedMsg += `: ${err.message}`;
        }

        if (!err.hasBeenLogged) {
          Logger.error(`${failedMsg}`);

          err.hasBeenLogged = true;

          if (err.stack && isDebugMode()) {
            Logger.debug(err.stack);
          }

        } else if (isDebugMode()) {
          Logger.debug(`${failedMsg}`);
        }
        return err;
      }
    }

    return err;
  }

  /**
   * Does not print out a time prefix or color any text. Only prefix
   * with whitespace so the message is lined up with timestamped logs.
   */
  static log(...msg: any[]) {
    Logger.wordWrap(msg).forEach(line => {
      console.log(line);
    });
  }

  /**
   * Prints out a dim colored timestamp prefix.
   */
  static info(...msg: any[]) {
    const lines = Logger.wordWrap(msg);
    if (lines.length) {
      let prefix = timePrefix();
      lines[0] = chalk.dim(prefix) + lines[0].substr(prefix.length);
    }
    lines.forEach(line => {
      console.log(line);
    });
  }

  /**
   * Prints out a yellow colored timestamp prefix.
   */
  static warn(...msg: any[]) {
    const lines = Logger.wordWrap(msg);
    if (lines.length) {
      let prefix = timePrefix();
      lines[0] = prefix + lines[0].substr(prefix.length);
    }
    lines.forEach(line => {
      console.warn(chalk.yellow(line));
    });
  }

  /**
   * Prints out a error colored timestamp prefix.
   */
  static error(...msg: any[]) {
    const lines = Logger.wordWrap(msg);
    if (lines.length) {
      let prefix = timePrefix();
      lines[0] = prefix + lines[0].substr(prefix.length);
      if (isDebugMode()) {
        lines[0] += memoryUsage();
      }
    }
    lines.forEach(line => {
      console.error(chalk.red(line));
    });
  }

  /**
   * Prints out a blue colored DEBUG prefix. Only prints out when debug mode.
   */
  static debug(...msg: any[]) {
    if (isDebugMode()) {
      msg.push(memoryUsage());

      const lines = Logger.wordWrap(msg);
      if (lines.length) {
        let prefix = '[ DEBUG! ]';
        lines[0] = prefix + lines[0].substr(prefix.length);
      }
      lines.forEach(line => {
        console.log(chalk.cyan(line));
      });
    }
  }

  static printDiagnostic(d: Diagnostic) {
    if (d.level === 'warn') {
      Logger.warn(d.header);
    } else {
      Logger.error(d.header);
    }

    Logger.wordWrap([d.messageText]).forEach(m => {
      console.log(m);
    });
    Logger.newLine();

    if (d.lines && d.lines.length) {
      Logger.removeWhitespaceIndent(d.lines);

      d.lines.forEach(l => {
        let msg = 'L' + l.lineNumber + ':  ';
        while (msg.length < Logger.INDENT.length) {
          msg = ' ' + msg;
        }

        if (l.errorCharStart > -1) {
          l.text = Logger.highlightError(l.text, l.errorCharStart, l.errorLength);
        }

        msg = chalk.dim(msg);

        if (d.syntax === 'js') {
          msg += Logger.jsSyntaxHighlight(l.text);
        } else if (d.syntax === 'css') {
          msg += Logger.cssSyntaxHighlight(l.text, l.errorCharStart);
        } else {
          msg += l.text;
        }

        console.log(msg);
      });

      Logger.newLine();
    }
  }

  static highlightError(errorLine: string, errorCharStart: number, errorLength: number) {
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


  static removeWhitespaceIndent(lines: PrintLine[]) {
    for (var i = 0; i < 100; i++) {
      if (!eachLineHasLeadingWhitespace(lines)) {
        return;
      }
      for (var i = 0; i < lines.length; i++) {
        lines[i].text = lines[i].text.substr(1);
        lines[i].errorCharStart--;
        if (!lines[i].text.length) {
          return;
        }
      }
    }
  }

  static wordWrap(msg: any[]) {
    const output: string[] = [];

    const words: any[] = [];
    msg.forEach(m => {
      if (m === null) {
        words.push('null');

      } else if (typeof m === 'undefined') {
        words.push('undefined');

      } else if (typeof m === 'string') {
        m.replace(/\s/gm, ' ').split(' ').forEach(strWord => {
          if (strWord.trim().length) {
            words.push(strWord.trim());
          }
        });

      } else if (typeof m === 'number' || typeof m === 'boolean') {
        words.push(m.toString());

      } else if (typeof m === 'function') {
        words.push(m.toString());

      } else if (Array.isArray(m)) {
        words.push(() => {
          return m.toString();
        });

      } else if (Object(m) === m) {
        words.push(() => {
          return m.toString();
        });

      } else {
        words.push(m.toString());
      }
    });

    let line = Logger.INDENT;
    words.forEach(word => {
      if (typeof word === 'function') {
        if (line.trim().length) {
          output.push(line);
        }
        output.push(word());
        line = Logger.INDENT;

      } else if (Logger.INDENT.length + word.length > Logger.MAX_LEN) {
        // word is too long to play nice, just give it its own line
        if (line.trim().length) {
          output.push(line);
        }
        output.push(Logger.INDENT + word);
        line = Logger.INDENT;

      } else if ((word.length + line.length) > Logger.MAX_LEN) {
        // this word would make the line too long
        // print the line now, then start a new one
        output.push(line);
        line = Logger.INDENT + word + ' ';

      } else {
        line += word + ' ';
      }
    });
    if (line.trim().length) {
      output.push(line);
    }
    return output;
  }


  static meaningfulLine(line: string) {
    if (line) {
      line = line.trim();
      if (line.length) {
        return (MEH_LINES.indexOf(line) < 0);
      }
    }
    return false;
  }


  static jsSyntaxHighlight(text: string) {
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


  static cssSyntaxHighlight(text: string, errorCharStart: number) {
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


  static formatFileName(rootDir: string, fileName: string) {
    fileName = fileName.replace(rootDir, '');
    if (/\/|\\/.test(fileName.charAt(0))) {
      fileName = fileName.substr(1);
    }
    if (fileName.length > 80) {
      fileName = '...' + fileName.substr(fileName.length - 80);
    }
    return fileName;
  }


  static formatHeader(task: string, fileName: string, rootDir: string, startLineNumber: number = null, endLineNumber: number = null) {
    let header = `${task}: `;
    fileName = Logger.formatFileName(rootDir, fileName);

    if (startLineNumber !== null && startLineNumber > 0) {
      header += fileName + ', ';

      if (endLineNumber !== null && endLineNumber > startLineNumber) {
        header += `lines: ${startLineNumber} - ${endLineNumber}`;
      } else {
        header += `line: ${startLineNumber}`;
      }
    }

    return header;
  }


  static newLine() {
    console.log('');
  }

  static INDENT = '            ';
  static MAX_LEN = 120;

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


function timePrefix() {
  const date = new Date();
  return '[' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ']';
}


function memoryUsage() {
  return chalk.dim(` MEM: ${(process.memoryUsage().rss / 1000000).toFixed(1)}MB`);
}


export function getAppScriptsVersion() {
  let rtn = '';
  try {
    const packageJson = readJSONSync(join(__dirname, '..', '..', 'package.json'));
    rtn = packageJson.version || '';
  } catch (e) {}
  return rtn;
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

const MEH_LINES = [';', ':', '{', '}', '(', ')', '/**', '/*', '*/', '*', '({', '})'];


export interface TaskEvent {
  scope: string;
  type: string;
  duration?: number;
  time?: string;
  msg?: string;
}


export interface Diagnostic {
  level: string;
  syntax: string;
  type: string;
  header: string;
  code: string;
  messageText: string;
  fileName: string;
  lines: PrintLine[];
}


export interface PrintLine {
  lineIndex: number;
  lineNumber: number;
  text: string;
  errorCharStart: number;
  errorLength: number;
}

