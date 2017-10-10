import * as Constants from './util/constants';
import { getBooleanPropertyValue } from './util/helpers';
import { BuildContext } from './util/interfaces';
import { cleancss } from './cleancss';
import { Logger } from './logger/logger';
import { uglifyjs } from './uglifyjs';


export function minify(context: BuildContext) {

  const logger = new Logger('minify');

  return minifyWorker(context)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


function minifyWorker(context: BuildContext) {
  // both css and js minify can run at the same time
  return Promise.all([
    minifyJs(context),
    minifyCss(context)
  ]);
}

export function minifyJs(context: BuildContext): Promise<any> {
  return runUglify(context);
}

function runUglify(context: BuildContext) {
  // uglify cannot handle ES2015, so convert it to ES5 before minifying (if needed)
  return uglifyjs(context);
}

export function minifyCss(context: BuildContext) {
  return cleancss(context);
}
