import { join } from 'path';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { Logger } from './logger/logger';
import { readFileAsync, writeFileAsync } from './util/helpers';
import * as cleanCss from 'clean-css';


export function cleancss(context: BuildContext, configFile?: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('cleancss');

  return cleancssWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function cleancssWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    context = generateContext(context);
    const cleanCssConfig: CleanCssConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
    const srcFile = join(context.buildDir, cleanCssConfig.sourceFileName);
    const destFile = join(context.buildDir, cleanCssConfig.destFileName);

    Logger.debug(`cleancss read: ${srcFile}`);

    readFileAsync(srcFile)
      .then(fileContent => {
        const minifier = new cleanCss(cleanCssConfig.options);
        minifier.minify(fileContent, (err, minified) => {
          if (err) {
            reject(new BuildError(err));

          } else if (minified.errors && minified.errors.length > 0) {
            // just return the first error for now I guess
            minified.errors.forEach(e => {
              Logger.error(e);
            });
            reject(new BuildError());

          } else {
            Logger.debug(`cleancss write: ${destFile}`);
            writeFileAsync(destFile, minified.styles).then(() => {
              resolve();
            });
          }
        });
      })
      .catch(err => {
        reject(new BuildError(err));
      });

  });
}


const taskInfo: TaskInfo = {
  fullArg: '--cleancss',
  shortArg: '-e',
  envVar: 'IONIC_CLEANCSS',
  packageConfig: 'ionic_cleancss',
  defaultConfigFile: 'cleancss.config'
};


export interface CleanCssConfig {
  // https://www.npmjs.com/package/clean-css
  sourceFileName: string;
  // sourceSourceMapName: string;
  destFileName: string;
  // options: cleanCss Options;
  options?: cleanCss.Options;
}
