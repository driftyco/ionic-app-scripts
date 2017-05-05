import { access } from 'fs';
import { join } from 'path';

import { lintFiles } from './lint/lint-utils';
import { getFileNames } from './lint/lint-factory';
import { Logger } from './logger/logger';
import { getUserConfigFile } from './util/config';
import { ENV_BAIL_ON_LINT_ERROR, ENV_TYPE_CHECK_ON_LINT } from './util/constants';
import { getBooleanPropertyValue } from './util/helpers';
import { getTsConfigPath } from './transpile';
import { BuildContext, ChangedFile, TaskInfo } from './util/interfaces';
import { runWorker } from './worker-client';


export interface LintWorkerConfig {
  tsConfig: string;
  tsLintConfig: string | null;
  filePaths?: string[];
  typeCheck?: boolean;
}


const taskInfo: TaskInfo = {
  fullArg: '--tslint',
  shortArg: '-i',
  envVar: 'ionic_tslint',
  packageConfig: 'IONIC_TSLINT',
  defaultConfigFile: '../tslint'
};


export function lint(context: BuildContext, configFile?: string) {
  const logger = new Logger('lint');
  return runWorker('lint', 'lintWorker', context, {configFile, tsConfig: getTsConfigPath(context), typeCheck: getBooleanPropertyValue(ENV_TYPE_CHECK_ON_LINT)})
    .then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      if (getBooleanPropertyValue(ENV_BAIL_ON_LINT_ERROR)) {
        throw logger.fail(err);
      }
      logger.finish();
    });
}

export function lintWorker(context: BuildContext, {tsConfig, tsLintConfig, typeCheck}: LintWorkerConfig) {
  return getLintConfig(context, tsLintConfig)
    .then(tsLintConfig => lintApp(context, {
      tsConfig,
      tsLintConfig,
      typeCheck
    }));
}


export function lintUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
  return runWorker('lint', 'lintUpdateWorker', context, {
    tsConfig: getTsConfigPath(context),
    tsLintConfig: getUserConfigFile(context, taskInfo, null),
    filePaths: changedTypescriptFiles.map(changedTypescriptFile => changedTypescriptFile.filePath),
    typeCheck: getBooleanPropertyValue(ENV_TYPE_CHECK_ON_LINT)
  });
}

export function lintUpdateWorker(context: BuildContext, {tsConfig, tsLintConfig, filePaths, typeCheck}: LintWorkerConfig) {
  return getLintConfig(context, tsLintConfig)
    .then(tsLintConfig => lintFiles(context, tsConfig, tsLintConfig, filePaths, {typeCheck}))
    // Don't throw if linting failed
    .catch(() => {});
}


function lintApp(context: BuildContext, {tsConfig, tsLintConfig, typeCheck}: LintWorkerConfig) {
  const files = getFileNames(context, tsConfig);
  return lintFiles(context, tsConfig, tsLintConfig, files, {typeCheck});
}


function getLintConfig(context: BuildContext, configFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    if (!configFile) {
      configFile = join(context.rootDir, 'tslint.json');
    }

    Logger.debug(`tslint config: ${configFile}`);

    access(configFile, (err: Error) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        reject(err);
        return;
      }
      resolve(configFile);
    });
  });
}
