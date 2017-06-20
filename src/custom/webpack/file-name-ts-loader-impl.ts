import { readAndCacheOnlyBuildTargetFile, CompiledOutput } from '../helpers/cache-file-reader-helper';
import { getContext } from '../../util/helpers';

export function fileNameLoader(source: string, map: any, webpackContex: any) {
  webpackContex.cacheable();
  const callback = webpackContex.async();
  const context = getContext();

  readAndCacheOnlyBuildTargetFile(context, webpackContex.resourcePath)
    .then((compiledOutput: CompiledOutput | any) => {
      callback(null, compiledOutput.content || source);
    })
    .catch((error) => callback(error));
}
