import { BuildContext, ChangedFile } from './util/interfaces';
import { BuildError, IgnorableError } from './util/errors';
import * as Constants from './util/constants';
import { webpack, webpackUpdate, getWebpackConfig, getOutputDest as webpackGetOutputDest } from './webpack';


export function bundle(context: BuildContext, configFile?: string) {
  return bundleWorker(context, configFile)
    .catch((err: Error) => {
      throw new BuildError(err);
    });
}


function bundleWorker(context: BuildContext, configFile: string) {
  return webpack(context, configFile);
}


export function bundleUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  return webpackUpdate(changedFiles, context)
    .catch(err => {
      if (err instanceof IgnorableError) {
        throw err;
      }
      throw new BuildError(err);
    });
}


export function buildJsSourceMaps(context: BuildContext) {
  const webpackConfig = getWebpackConfig(context, null);
  return !!(webpackConfig.devtool && webpackConfig.devtool.length > 0);
}


export function getJsOutputDest(context: BuildContext) {
  return webpackGetOutputDest(context);
}
