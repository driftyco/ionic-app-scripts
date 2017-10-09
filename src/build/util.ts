import { join } from 'path';

import * as Constants from '../util/constants';
import { GlobResult, globAll } from '../util/glob-util';
import { getStringPropertyValue, readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';

export function scanSrcTsFiles(context: BuildContext) {
  const srcGlob = join(context.srcDir, '**', '*.ts');
  const globs: string[] = [srcGlob];
  const deepLinkDir = getStringPropertyValue(Constants.ENV_VAR_DEEPLINKS_DIR);
  // these two will only not be equal in some weird cases like for building Ionic's demos with our current repository set-up
  if (deepLinkDir !== context.srcDir) {
    globs.push(join(deepLinkDir, '**', '*.ts'));
  }
  return globAll(globs).then((results: GlobResult[]) => {
    const promises = results.map(result => {
      const promise = readFileAsync(result.absolutePath);
      promise.then((fileContent: string) => {
        context.fileCache.set(result.absolutePath, { path: result.absolutePath, content: fileContent});
      });
      return promise;
    });
    return Promise.all(promises);
  });
}
