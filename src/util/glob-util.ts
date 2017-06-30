import { dirname, isAbsolute, join, normalize, resolve as pathResolve, sep } from 'path';
import * as globFunction from 'glob';
import { toUnixPath } from './helpers';


function isNegative(pattern: string) {
  return pattern[0] === '!';
}

function isString(pattern: string) {
  return typeof pattern === 'string';
}

function assertPatternsInput(patterns: string[]) {
  if (!patterns.every(isString)) {
    throw new Error('Each glob entry must be a string');
  }
}

export function generateGlobTasks(patterns: string[], opts: any) {

  patterns = [].concat(patterns);
  assertPatternsInput(patterns);

  const globTasks: GlobObject[] = [];

  opts = Object.assign({
    cache: Object.create(null),
    statCache: Object.create(null),
    realpathCache: Object.create(null),
    symlinks: Object.create(null),
    ignore: []
  }, opts);

  patterns.forEach(function (pattern, i) {
    if (isNegative(pattern)) {
      return;
    }

    const ignore = patterns.slice(i).filter(isNegative).map(function (pattern) {
      return pattern.slice(1);
    });

    const task: GlobObject = {
      pattern: pattern,
      opts: Object.assign({}, opts, {
        ignore: opts.ignore.concat(ignore).concat(DEFAULT_IGNORE_ARRAY),
        nodir: true
      }),
      base: getBasePath(pattern)
    };

    globTasks.push(task);
  });

  return globTasks;
}

function globWrapper(task: GlobObject): Promise<GlobResult[]> {
  return new Promise((resolve, reject) => {
    globFunction(task.pattern, task.opts, (err: Error, files: string[]) => {
      if (err) {
        return reject(err);
      }
      const globResults = files.map(file => {
        return {
          absolutePath: normalize(pathResolve(file)),
          base: normalize(pathResolve(getBasePath(task.pattern)))
        };
      });
      return resolve(globResults);
    });
  });
}

export function globAll(globs: string[]): Promise<GlobResult[]> {
  return Promise.resolve().then(() => {
    const globTasks = generateGlobTasks(globs, {});
    let resultSet: GlobResult[] = [];
    const promises: Promise<GlobResult[]>[] = [];
    for (const globTask of globTasks) {
      const promise = globWrapper(globTask);
      promises.push(promise);
      promise.then(globResult => {
        resultSet = resultSet.concat(globResult);
      });
    }

    return Promise.all(promises).then(() => {
      return resultSet;
    });
  });
}

export function getBasePath(pattern: string) {
  var basePath: string;
  const sepRe = (process.platform === 'win32' ? /[\/\\]/ : /\/+/);
  var parent = globParent(pattern);

  basePath = toAbsoluteGlob(parent);

  if (!sepRe.test(basePath.charAt(basePath.length - 1))) {
    basePath += sep;
  }
  return basePath;
}

function isNegatedGlob(pattern: string) {
  var glob = { negated: false, pattern: pattern, original: pattern };
  if (pattern.charAt(0) === '!' && pattern.charAt(1) !== '(') {
    glob.negated = true;
    glob.pattern = pattern.slice(1);
  }
  return glob;
}

// https://github.com/jonschlinkert/to-absolute-glob/blob/master/index.js
function toAbsoluteGlob(pattern: string) {
  const cwd = toUnixPath(process.cwd());

  // trim starting ./ from glob patterns
  if (pattern.slice(0, 2) === './') {
    pattern = pattern.slice(2);
  }

  // when the glob pattern is only a . use an empty string
  if (pattern.length === 1 && pattern === '.') {
    pattern = '';
  }

  // store last character before glob is modified
  const suffix = pattern.slice(-1);

  // check to see if glob is negated (and not a leading negated-extglob)
  const ing = isNegatedGlob(pattern);
  pattern = ing.pattern;

  if (!isAbsolute(pattern) || pattern.slice(0, 1) === '\\') {
    pattern = join(cwd, pattern);
  }

  // if glob had a trailing `/`, re-add it now in case it was removed
  if (suffix === '/' && pattern.slice(-1) !== '/') {
    pattern += '/';
  }

  // re-add leading `!` if it was removed
  return ing.negated ? '!' + pattern : pattern;
}

// https://github.com/es128/glob-parent/blob/master/index.js
function globParent(pattern: string) {
  // special case for strings ending in enclosure containing path separator
  if (/[\{\[].*[\/]*.*[\}\]]$/.test(pattern)) pattern += '/';

  // preserves full path in case of trailing path separator
  pattern += 'a';

  // remove path parts that are globby
  do {
    pattern = toUnixPath(dirname(pattern));
  }

  while (isGlob(pattern) || /(^|[^\\])([\{\[]|\([^\)]+$)/.test(pattern));

  // remove escape chars and return result
  return pattern.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, '$1');
}

// https://github.com/jonschlinkert/is-glob/blob/master/index.js
function isGlob(pattern: string) {
  if (pattern === '') {
    return false;
  }

  if (isExtglob(pattern)) return true;

  var regex = /(\\).|([*?]|\[.*\]|\{.*\}|\(.*\|.*\)|^!)/;
  var match: any;

  while ((match = regex.exec(pattern))) {
    if (match[2]) return true;
    pattern = pattern.slice(match.index + match[0].length);
  }
  return false;
}

// https://github.com/jonschlinkert/is-extglob/blob/master/index.js
function isExtglob(pattern: string) {
  if (pattern === '') {
    return false;
  }

  var match: any;
  while ((match = /(\\).|([@?!+*]\(.*\))/g.exec(pattern))) {
    if (match[2]) return true;
    pattern = pattern.slice(match.index + match[0].length);
  }

  return false;
}

export interface GlobObject {
  pattern: string;
  opts: GlobOptions;
  base: string;
}

export interface GlobResult {
  absolutePath: string;
  base: string;
}

export interface GlobOptions {
  ignore: string[];
}

export const DEFAULT_IGNORE_ARRAY = ['**/*.DS_Store'];
