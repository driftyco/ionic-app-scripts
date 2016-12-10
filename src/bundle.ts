import { BuildContext, ChangedFile } from './util/interfaces';
import { BuildError, IgnorableError } from './util/errors';
import { BUNDLER_ROLLUP } from './util/config';
import { rollup, rollupUpdate, getRollupConfig, getOutputDest as rollupGetOutputDest } from './rollup';
import { webpack, webpackUpdate, getWebpackConfig, getOutputDest as webpackGetOutputDest } from './webpack';


export function bundle(context: BuildContext, configFile?: string) {
  return bundleWorker(context, configFile)
    .catch((err: Error) => {
      throw new BuildError(err);
    });
}


function bundleWorker(context: BuildContext, configFile: string) {
  if (context.bundler === BUNDLER_ROLLUP) {
    return rollup(context, configFile);
  }

  return webpack(context, configFile);
}


export function bundleUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  if (context.bundler === BUNDLER_ROLLUP) {
    return rollupUpdate(changedFiles, context)
      .catch(err => {
        throw new BuildError(err);
      });
  }

  return webpackUpdate(changedFiles, context, null)
    .catch(err => {
      if (err instanceof IgnorableError) {
        throw err;
      }
      throw new BuildError(err);
    });
}


export function buildJsSourceMaps(context: BuildContext) {
  if (context.bundler === BUNDLER_ROLLUP) {
    const rollupConfig = getRollupConfig(context, null);
    return rollupConfig.sourceMap;
  }

  // TODO - read this from webpack config (could be multiple values)
  return true;
}


export function getJsOutputDest(context: BuildContext) {
  if (context.bundler === BUNDLER_ROLLUP) {
    const rollupConfig = getRollupConfig(context, null);
    return rollupGetOutputDest(context, rollupConfig);
  }

  const webpackConfig = getWebpackConfig(context, null);
  return webpackGetOutputDest(context, webpackConfig);
}
