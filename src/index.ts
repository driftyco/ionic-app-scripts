export { build } from './build';
export { bundle, bundleUpdate } from './bundle';
export { clean } from './clean';
export { cleancss } from './cleancss';
export { copy, copyUpdate } from './copy';
export { lint } from './lint';
export { minify } from './minify';
export { ngc } from './ngc';
export { sass, sassUpdate } from './sass';
export { serve } from './serve';
export { transpile } from './transpile';
export { uglifyjs } from './uglifyjs';
export { watch, buildUpdate } from './watch';
export * from './util/config';
export * from './util/helpers';
export * from './util/interfaces';
export * from './util/constants';
export * from './generators';

export { getDeepLinkData } from './deep-linking/util';

import { generateContext } from './util/config';
import { getAppScriptsVersion, setContext } from './util/helpers';
import { Logger } from './logger/logger';

export function run(task: string) {
  try {
    Logger.info(`ionic-app-scripts ${getAppScriptsVersion()}`, 'cyan');
  } catch (e) {}

  try {
    const context = generateContext(null);
    setContext(context);
    require(`../dist/${task}`)[task](context).catch((err: any) => {
      errorLog(task, err);
    });
  } catch (e) {
    errorLog(task, e);
  }
}

function errorLog(task: string, e: any) {
  Logger.error(`ionic-app-script task: "${task}"`);
  if (e && e.toString() !== 'Error') {
    Logger.error(`${e}`);
  }
  if (e.stack) {
    Logger.unformattedError(e.stack);
  }
  process.exit(1);
}
