import { BuildContext } from './util/interfaces';
import { cleancss } from './cleancss';
import { closure, isClosureSupported } from './closure';
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


export function minifyJs(context: BuildContext) {
  if (isClosureSupported(context)) {
    // use closure if it's supported and local executable provided
    return closure(context);
  }

  // default to uglify if no closure
  return uglifyjs(context);
}


export function minifyCss(context: BuildContext) {
  return cleancss(context);
}
