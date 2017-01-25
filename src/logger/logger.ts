import { BuildError, IgnorableError } from '../util/errors';
import { isDebugMode } from '../util/config';
import * as chalk from 'chalk';


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
  }

  ready(color?: string, bold?: boolean) {
    this.completed('ready', color, bold);
  }

  finish(color?: string, bold?: boolean) {
    this.completed('finished', color, bold);
  }

  private completed(type: string, color: string, bold: boolean) {
    const duration = Date.now() - this.start;
    let time: string;

    if (duration > 1000) {
      time = 'in ' + (duration / 1000).toFixed(2) + ' s';

    } else {
      let ms = parseFloat((duration).toFixed(3));
      if (ms > 0) {
        time = 'in ' + duration + ' ms';
      } else {
        time = 'in less than 1 ms';
      }
    }

    let msg = `${this.scope} ${type}`;
    if (color) {
      msg = (<any>chalk)[color](msg);
    }
    if (bold) {
      msg = chalk.bold(msg);
    }

    msg += ' ' + chalk.dim(time);

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

  setStartTime(startTime: number) {
    this.start = startTime;
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
   * Prints out a dim colored timestamp prefix, with optional color
   * and bold message.
   */
  static info(msg: string, color?: string, bold?: boolean) {
    const lines = Logger.wordWrap([msg]);
    if (lines.length) {
      let prefix = timePrefix();
      let lineOneMsg = lines[0].substr(prefix.length);
      if (color) {
        lineOneMsg = (<any>chalk)[color](lineOneMsg);
      }
      if (bold) {
        lineOneMsg = chalk.bold(lineOneMsg);
      }
      lines[0] = chalk.dim(prefix) + lineOneMsg;
    }
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        if (color) {
          line = (<any>chalk)[color](line);
        }
        if (bold) {
          line = chalk.bold(line);
        }
      }
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

  static unformattedError(msg: string) {
    console.error(chalk.red(msg));
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


  static formatHeader(type: string, fileName: string, rootDir: string, startLineNumber: number = null, endLineNumber: number = null) {
    let header = `${type}: ${Logger.formatFileName(rootDir, fileName)}`;

    if (startLineNumber !== null && startLineNumber > 0) {
      if (endLineNumber !== null && endLineNumber > startLineNumber) {
        header += `, lines: ${startLineNumber} - ${endLineNumber}`;
      } else {
        header += `, line: ${startLineNumber}`;
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


function timePrefix() {
  const date = new Date();
  return '[' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ']';
}


function memoryUsage() {
  return chalk.dim(` MEM: ${(process.memoryUsage().rss / 1000000).toFixed(1)}MB`);
}
