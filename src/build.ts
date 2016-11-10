import { BuildContext, BuildState } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { bundle, bundleUpdate } from './bundle';
import { clean } from './clean';
import { copy } from './copy';
import { emit, EventType } from './util/events';
import { generateContext } from './util/config';
import { lint, lintUpdate } from './lint';
import { minifyCss, minifyJs } from './minify';
import { ngc } from './ngc';
import { sass, sassUpdate } from './sass';
import { templateUpdate } from './template';
import { transpile, transpileUpdate, transpileDiagnosticsOnly } from './transpile';


export function build(context: BuildContext) {
  context = generateContext(context);

  const logger = new Logger(`build ${(context.isProd ? 'prod' : 'dev')}`);

  return buildWorker(context)
    .then(() => {
      // congrats, we did it!  (•_•) / ( •_•)>⌐■-■ / (⌐■_■)
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
      // kick off the tslint after everything else
      // nothing needs to wait on its completion
      lint(context);

      // ensure the async tasks have fully completed before resolving
      return Promise.all([
        copyPromise
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

  // just bundle, and if that passes then do the rest at the same time
  return transpile(context)
    .then(() => {
      return bundle(context);
    })
    .then(() => {
      return Promise.all([
        sass(context),
        copyPromise
      ]);
    })
    .then(() => {
      // kick off the tslint after everything else
      // nothing needs to wait on its completion
      lint(context);
      return Promise.resolve();
    })
    .catch(err => {
      throw new BuildError(err);
    });
}


export function buildUpdate(event: string, filePath: string, context: BuildContext) {
  return new Promise(resolve => {
    const logger = new Logger('build');

    buildUpdateId++;
    emit(EventType.BuildUpdateStarted, buildUpdateId);

    function buildTasksDone(resolveValue: BuildTaskResolveValue) {
      // all build tasks have been resolved or one of them
      // bailed early, stopping all others to not run

      parallelTasksPromise.then(() => {
        // all parallel tasks are also done
        // so now we're done done
        emit(EventType.BuildUpdateCompleted, buildUpdateId);

        if (resolveValue.requiresRefresh) {
          // emit that we need to do a full page refresh
          emit(EventType.ReloadApp);

        } else {
          // just emit that only a certain file changed
          // this one is useful when only a sass changed happened
          // and the webpack only needs to livereload the css
          // but does not need to do a full page refresh
          emit(EventType.FileChange, resolveValue.changedFile);
        }

        if (filePath.endsWith('.ts')) {
          // a ts file changed, so let's lint it too, however
          // this task should run as an after thought
          lintUpdate(event, filePath, context);
        }

        logger.finish('green', true);
        Logger.newLine();

        // we did it!
        resolve();
      });
    }

    // kick off all the build tasks
    // and the tasks that can run parallel to all the build tasks
    const buildTasksPromise = buildUpdateTasks(event, filePath, context);
    const parallelTasksPromise = buildUpdateParallelTasks(event, filePath, context);

    // whether it was resolved or rejected, we need to do the same thing
    buildTasksPromise
      .then(buildTasksDone)
      .catch(() => {
        buildTasksDone({
          requiresRefresh: false,
          changedFile: filePath
        });
      });
  });
}

/**
 * Collection of all the build tasks than need to run
 * Each task will only run if it's set with eacn BuildState.
 */
function buildUpdateTasks(event: string, filePath: string, context: BuildContext) {
  const resolveValue: BuildTaskResolveValue = {
    requiresRefresh: false,
    changedFile: filePath
  };

  return Promise.resolve()
    .then(() => {
      // TEMPLATE
      if (context.templateState === BuildState.RequiresUpdate) {
        resolveValue.requiresRefresh = true;
        return templateUpdate(event, filePath, context);
      }
      // no template updates required
      return Promise.resolve();

    })
    .then(() => {
      // TRANSPILE
      if (context.transpileState === BuildState.RequiresUpdate) {
        resolveValue.requiresRefresh = true;
        // we've already had a successful transpile once, only do an update
        // not that we've also already started a transpile diagnostics only
        // build that only needs to be completed by the end of buildUpdate
        return transpileUpdate(event, filePath, context);

      } else if (context.transpileState === BuildState.RequiresBuild) {
        // run the whole transpile
        resolveValue.requiresRefresh = true;
        return transpile(context);
      }
      // no transpiling required
      return Promise.resolve();

    })
    .then(() => {
      // BUNDLE
      if (context.bundleState === BuildState.RequiresUpdate) {
        // we need to do a bundle update
        resolveValue.requiresRefresh = true;
        return bundleUpdate(event, filePath, context);

      } else if (context.bundleState === BuildState.RequiresBuild) {
        // we need to do a full bundle build
        resolveValue.requiresRefresh = true;
        return bundle(context);
      }
      // no bundling required
      return Promise.resolve();

    })
    .then(() => {
      // SASS
      if (context.sassState === BuildState.RequiresUpdate) {
        // we need to do a sass update
        return sassUpdate(event, filePath, context).then(outputCssFile => {
          resolveValue.changedFile = outputCssFile;
        });

      } else if (context.sassState === BuildState.RequiresBuild) {
        // we need to do a full sass build
        return sass(context).then(outputCssFile => {
          resolveValue.changedFile = outputCssFile;
        });
      }
      // no sass build required
      return Promise.resolve();
    })
    .then(() => {
      return resolveValue;
    });
}

interface BuildTaskResolveValue {
  requiresRefresh: boolean;
  changedFile: string;
}

/**
 * parallelTasks are for any tasks that can run parallel to the entire
 * build, but we still need to make sure they've completed before we're
 * all done, it's also possible there are no parallelTasks at all
 */
function buildUpdateParallelTasks(event: string, filePath: string, context: BuildContext) {
  const parallelTasks: Promise<any>[] = [];

  if (context.transpileState === BuildState.RequiresUpdate) {
    parallelTasks.push(transpileDiagnosticsOnly(context));
  }

  return Promise.all(parallelTasks);
}

let buildUpdateId = 0;
