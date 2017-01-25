import { BuildContext } from '../util/interfaces';
import { getContext, toUnixPath} from '../util/helpers';
import { join, normalize, relative, resolve, sep } from 'path';
import { SOURCE_MAP_TYPE_CHEAP, ENV_VAR_SOURCE_MAP_TYPE } from '../util/constants';

export function provideCorrectSourcePath(webpackObj: any) {
  const context = getContext();
  return provideCorrectSourcePathInternal(webpackObj, context);
}

function provideCorrectSourcePathInternal(webpackObj: any, context: BuildContext) {
  const webpackResourcePath = webpackObj.resourcePath;
  const noTilde = webpackResourcePath.replace(/~/g, 'node_modules');
  const absolutePath = resolve(normalize(noTilde));
  if (process.env[ENV_VAR_SOURCE_MAP_TYPE] === SOURCE_MAP_TYPE_CHEAP) {
    const mapPath = sep + absolutePath;
    return toUnixPath(mapPath);
  }
  // does the full map
  const backPath = relative(context.buildDir, context.rootDir);
  const relativePath = relative(context.rootDir, absolutePath);
  const relativeToBuildDir = join(backPath, relativePath);
  return toUnixPath(relativeToBuildDir);
}
