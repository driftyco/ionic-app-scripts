import { BuildContext } from './util/interfaces';
import { BuildError, IgnorableError, Logger } from './util/logger';
import { bundle, bundleUpdate } from './bundle';
import { clean } from './clean';
import { copy } from './copy';
import { generateContext } from './util/config';
import { lint } from './lint';
import { minifyCss, minifyJs } from './minify';
import { ngc } from './ngc';
import { sass, sassUpdate } from './sass';
import { transpile, transpileUpdate } from './transpile';


export function build(context: BuildContext) {
  context = generateContext(context);

  const logger = new Logger(`build ${(context.isProd ? 'prod' : 'dev')}`);

  return buildWorker(context)
    .then(() => {
      // congrats, we did it!  (•_•) / ( •_•)>⌐■-■ / (⌐■_■)
      context.fullBuildCompleted = true;
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


function buildWorker(context: BuildContext) {
  if (context.isProd) {
    // production build
    return buildProd(context);
  }

  // dev build
  return buildDev(context);
}


function buildProd(context: BuildContext) {
  // sync empty the www/build directory
  clean(context);

  // async tasks
  // these can happen all while other tasks are running
  const copyPromise = copy(context);
  const lintPromise = lint(context);

  // kick off ngc to run the Ahead of Time compiler
  return ngc(context)
    .then(() => {
      // ngc has finished, now let's bundle it all together
      return bundle(context);
    })
    .then(() => {
      // js minify can kick off right away
      const jsPromise = minifyJs(context);

      // sass needs to finish, then css minify can run when sass is done
      const sassPromise = sass(context)
        .then(() => {
          return minifyCss(context);
        });

      return Promise.all([
        jsPromise,
        sassPromise
      ]);
    })
    .then(() => {
      // ensure the async tasks have fully completed before resolving
      return Promise.all([
        copyPromise,
        lintPromise
      ]);
    })
    .catch(err => {
      throw new BuildError(err);
    });
}


function buildDev(context: BuildContext) {
  // sync empty the www/build directory
  clean(context);

  // async tasks
  // these can happen all while other tasks are running
  const copyPromise = copy(context);
  const lintPromise = lint(context);

  // just bundle, and if that passes then do the rest at the same time
  return transpile(context)
    .then(() => {
      return bundle(context);
    })
    .then(() => {
      return Promise.all([
        sass(context),
        copyPromise,
        lintPromise
      ]);
    })
    .catch(err => {
      throw new BuildError(err);
    });
}

export function fullBuildUpdate(event: string, filePath: string, context: BuildContext) {
  return buildUpdateWorker(event, filePath, context, true).then(() => {
    context.fullBuildCompleted = true;
  });
}

export function buildUpdate(event: string, filePath: string, context: BuildContext) {
  return buildUpdateWorker(event, filePath, context, false);
}

function buildUpdateWorker(event: string, filePath: string, context: BuildContext, fullBuild: boolean) {
  const logger = new Logger(`build update`);

  let transpilePromise: Promise<void> = null;
  if (fullBuild) {
    transpilePromise = transpile(context);
  } else {
    transpilePromise = transpileUpdate(event, filePath, context);
  }
  return transpilePromise
    .then(() => {
      if (fullBuild) {
        return bundle(context);
      }
      return bundleUpdate(event, filePath, context);
    }).then(() => {
      if (fullBuild) {
        return sass(context);
      } else if (event !== 'change' || !context.successfulSass) {
        // if just the TS file changed, then there's no need to do a sass update
        // however, if a new TS file was added or was deleted, then we should do a sass update
        return sassUpdate(event, filePath, context);
      }
    }).then(() => {
      logger.finish();
    }).catch(err => {
      if (err instanceof IgnorableError) {
        throw err;
      }
      throw logger.fail(err);
    });
}
