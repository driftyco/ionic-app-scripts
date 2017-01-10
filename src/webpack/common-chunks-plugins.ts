import { join } from 'path';
import * as CommonChunksPlugin from 'webpack/lib/optimize/CommonsChunkPlugin';

export const NODE_MODULES = join(process.cwd(), 'node_modules');
export const RXJS = join(NODE_MODULES, 'rxjs');
export const ZONEJS = join(NODE_MODULES, 'zone.js');
export const ANGULAR = join(NODE_MODULES, '@angular');
export const IONIC = join(NODE_MODULES, 'ionic-angular');

export function getIonicDependenciesCommonChunksPlugin() {
  return new CommonChunksPlugin({
    name: 'known-vendors',
    minChunks: checkIfModuleIsIonicDependency
  });
}

export function getNonIonicDependenciesCommonChunksPlugin() {
  return new CommonChunksPlugin({
    name: 'unknown-vendors',
    minChunks: checkIfModuleIsNodeModuleButNotIonicDepenedency
  });
}

function isIonicDependency(modulePath: string) {
  return modulePath.startsWith(RXJS) || modulePath.startsWith(ZONEJS) || modulePath.startsWith(ANGULAR) || modulePath.startsWith(IONIC);
}

export function checkIfModuleIsIonicDependency(module: any) {
  return !!(module.userRequest && isIonicDependency(module.userRequest));
}

export function checkIfModuleIsNodeModuleButNotIonicDepenedency(module: any) {
  return !!(module.userRequest && module.userRequest.startsWith(NODE_MODULES) && !isIonicDependency(module.userRequest));
}
