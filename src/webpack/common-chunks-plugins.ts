 const CommonChunksPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

import * as Constants from '../util/constants';
import { getStringPropertyValue } from '../util/helpers';

export function getCommonChunksPlugin() {
  return new CommonChunksPlugin({
    name: 'vendor',
    minChunks: checkIfInNodeModules
  });
}

function checkIfInNodeModules(webpackModule: any) {
  return webpackModule && webpackModule.userRequest && webpackModule.userRequest.startsWith(getStringPropertyValue(Constants.ENV_VAR_NODE_MODULES_DIR));
}
