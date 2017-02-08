import * as Constants from './util/constants';
import { getBooleanPropertyValue } from './util/helpers';
import { BuildContext } from './util/interfaces';
import { babili } from './babili';
import { cleancss } from './cleancss';
import { closure, isClosureSupported } from './closure';
import { Logger } from './logger/logger';
import { transpileBundle } from './transpile';
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


export function minifyJs(context: BuildContext): Promise<void> {
  return isClosureSupported(context).then((result: boolean) => {
    if (result) {
      return closure(context);
    }

    if (getBooleanPropertyValue(Constants.ENV_USE_EXPERIMENTAL_BABILI)) {
      return babili(context);
    }

    return runUglify(context);
  });
}

function runUglify(context: BuildContext) {
  // uglify cannot handle ES2015, so convert it to ES5 before minifying (if needed)
  const promise = getBooleanPropertyValue(Constants.ENV_BUILD_TO_ES5) === true ? transpileBundle(context) : Promise.resolve();
  return promise.then(() => {
    return uglifyjs(context);
  });
}

export function minifyCss(context: BuildContext) {
  return cleancss(context);
}
