import { join } from 'path';
import { GlobResult, globAll } from '../util/glob-util';
import { readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';

export function scanSrcTsFiles(context: BuildContext) {
  const tsFileGlob = join(context.srcDir, '**', '*.ts');
  return globAll([tsFileGlob]).then((results: GlobResult[]) => {
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
