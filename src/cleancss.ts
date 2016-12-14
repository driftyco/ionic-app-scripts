import { join } from 'path';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { fillConfigDefaults, generateContext, getUserConfigFile } from './util/config';
import { Logger } from './logger/logger';
import { readFileAsync, writeFileAsync } from './util/helpers';
import * as workerClient from './worker-client';
import { CleanCssConfig, getCleanCssInstance } from './util/clean-css-factory';


export async function cleancss(context: BuildContext, configFile?: string) {
  const logger = new Logger('cleancss');
  try {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    await workerClient.runWorker('cleancss', 'cleancssWorker', context, configFile);
    logger.finish();
  } catch (ex) {
    throw logger.fail(ex);
  }
}


export async function cleancssWorker(context: BuildContext, configFile: string): Promise<any> {
  context = generateContext(context);
  const config: CleanCssConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  const srcFile = join(context.buildDir, config.sourceFileName);
  const destFilePath = join(context.buildDir, config.destFileName);
  Logger.debug(`[Clean CSS] cleancssWorker: reading source file ${srcFile}`);
  const fileContent = await readFileAsync(srcFile);
  const minifiedContent = await runCleanCss(config, fileContent);
  Logger.debug(`[Clean CSS] runCleanCss: writing file to disk ${destFilePath}`);
  await writeFileAsync(destFilePath, minifiedContent);
}

// exporting for easier unit testing
export function runCleanCss(cleanCssConfig: CleanCssConfig, fileContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const minifier = getCleanCssInstance(cleanCssConfig.options);
    minifier.minify(fileContent, (err, minified) => {
      if (err) {
        reject(new BuildError(err));
      } else if (minified.errors && minified.errors.length > 0) {
        // just return the first error for now I guess
        minified.errors.forEach(e => {
          Logger.error(e);
        });
        reject(new BuildError(minified.errors[0]));
      } else {
        resolve(minified.styles);
      }
    });
  });
}

// export for testing only
export const taskInfo: TaskInfo = {
  fullArg: '--cleancss',
  shortArg: '-e',
  envVar: 'IONIC_CLEANCSS',
  packageConfig: 'ionic_cleancss',
  defaultConfigFile: 'cleancss.config'
};
