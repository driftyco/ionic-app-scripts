import { BuildContext } from '../util/interfaces';
import { getContext} from '../util/helpers';
import { normalize, resolve, sep } from 'path';

export function provideCorrectSourcePath(webpackObj: any) {
  const context = getContext();
  return provideCorrectSourcePathInternal(webpackObj, context);
}

function provideCorrectSourcePathInternal(webpackObj: any, context: BuildContext) {
  const webpackResourcePath = webpackObj.resourcePath;
  const noTilde = webpackResourcePath.replace(/~/g, 'node_modules');
  const absolutePath = resolve(normalize(noTilde));
  if (process.env.IONIC_SOURCE_MAP === 'eval') {
    // add another path.sep to the front to account for weird webpack behavior
    return sep + absolutePath;
  }
  return absolutePath;
}