export { build, buildUpdate } from './build';
export { bundle, bundleUpdate } from './bundle';
export { clean } from './clean';
export { cleancss } from './cleancss';
export { copy, copyUpdate } from './copy';
export { lint } from './lint';
export { minify } from './minify';
export { ngc } from './ngc';
export { sass, sassUpdate } from './sass';
export { transpile } from './transpile';
export { uglifyjs } from './uglifyjs';
export { watch } from './watch';
export * from './util/config';
export * from './util/helpers';
export * from './util/interfaces';

import { Logger, getAppScriptsVersion } from './util/logger';
import * as chalk from 'chalk';


export function run(task: string) {
  try {
    Logger.info(chalk.cyan(`ionic-app-scripts ${getAppScriptsVersion()}`));
  } catch (e) {}

  try {
    require(`../dist/${task}`)[task]().catch((err: any) => {
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
  process.exit(1);
}
