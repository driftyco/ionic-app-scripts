import { getIonicDependenciesCommonChunksPlugin, getNonIonicDependenciesCommonChunksPlugin } from './common-chunks-plugins';
import { IonicEnvironmentPlugin } from './ionic-environment-plugin';
import { provideCorrectSourcePath } from './source-mapper';
import { getContext, getLazyLoadedModulePaths } from '../util/helpers';

export function getIonicEnvironmentPlugin() {
  const context = getContext();
  return new IonicEnvironmentPlugin(context, getLazyLoadedModulePaths());
}

export function getSourceMapperFunction(): Function {
  return provideCorrectSourcePath;
}

export function getNonIonicCommonChunksPlugin(): any {
  return getNonIonicDependenciesCommonChunksPlugin();
}

export function getIonicCommonChunksPlugin(): any {
  return getIonicDependenciesCommonChunksPlugin();
}
