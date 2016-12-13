import { BuildContext, ChangedFile } from './util/interfaces';
import { BuildError } from './util/errors';
import * as Constants from './util/constants';
import { rollup, rollupUpdate, getRollupConfig, getOutputDest as rollupGetOutputDest } from './rollup';
import { webpack, webpackUpdate, getWebpackConfig, getOutputDest as webpackGetOutputDest } from './webpack';


export async function bundle(context: BuildContext, configFile?: string): Promise<void> {
  try {
    return await bundleWorker(context, configFile);
  } catch (ex) {
    throw new BuildError(ex);
  }
}


function bundleWorker(context: BuildContext, configFile: string) {
  if (context.bundler === Constants.BUNDLER_ROLLUP) {
    return rollup(context, configFile);
  }

  return webpack(context, configFile);
}


export async function bundleUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  try {
    if (context.bundler === Constants.BUNDLER_ROLLUP) {
      return await rollupUpdate(changedFiles, context);
    }
    return await webpackUpdate(changedFiles, context);
  } catch (ex) {
    throw new BuildError(ex);
  }
}


export function buildJsSourceMaps(context: BuildContext) {
  if (context.bundler === Constants.BUNDLER_ROLLUP) {
    const rollupConfig = getRollupConfig(context, null);
    return rollupConfig.sourceMap;
  }

  const webpackConfig = getWebpackConfig(context, null);
  return !!(webpackConfig.devtool && webpackConfig.devtool.length > 0);
}


export function getJsOutputDest(context: BuildContext) {
  if (context.bundler === Constants.BUNDLER_ROLLUP) {
    const rollupConfig = getRollupConfig(context, null);
    return rollupGetOutputDest(context, rollupConfig);
  }

  return webpackGetOutputDest(context);
}
