import { access } from 'fs';
import { join } from 'path';

import { lintFiles } from './lint/lint-utils';
import { createProgram, getFileNames } from './lint/lint-factory';
import { Logger } from './logger/logger';
import { getUserConfigFile, fillConfigDefaults } from './util/config';
import { ENV_BAIL_ON_LINT_ERROR, ENV_TYPE_CHECK_ON_LINT } from './util/constants';
import { getBooleanPropertyValue } from './util/helpers';
import { getTsConfigPath } from './transpile';
import { BuildContext, ChangedFile, TaskInfo } from './util/interfaces';
import { runWorker } from './worker-client';


export interface LintWorkerConfig {
  tsConfig: string;
  tsLintConfig: string | null;
  configFile?: string | null;
  filePaths?: string[];
  typeCheck?: boolean;
  exclude?: string[];
}


const taskInfo: TaskInfo = {
  fullArg: '--tslint',
  shortArg: '-i',
  envVar: 'IONIC_TSLINT',
  packageConfig: 'ionic_tslint',
  defaultConfigFile: 'tslint.config'
};


export function lint(context: BuildContext, tsLintConfig?: string | null, typeCheck?: boolean) {
  const logger = new Logger('lint');
  return runWorker('lint', 'lintWorker', context, {tsLintConfig, tsConfig: getTsConfigPath(context), typeCheck: typeCheck || getBooleanPropertyValue(ENV_TYPE_CHECK_ON_LINT)})
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
  const configFile: string = getUserConfigFile(context, taskInfo, null);
  const { tsLintCofig: tsLintDefaultConfig, exclude } = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  tsLintConfig = tsLintConfig || tsLintDefaultConfig;
  return getLintConfig(context, tsLintConfig)
    .then(tsLintConfig => lintApp(context, {
      tsConfig,
      tsLintConfig,
      typeCheck,
      exclude
    }));
}


export function lintUpdate(changedFiles: ChangedFile[], context: BuildContext, typeCheck?: boolean) {
  const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
  return runWorker('lint', 'lintUpdateWorker', context, {
    typeCheck,
    tsConfig: getTsConfigPath(context),
    tsLintConfig: getTsLintConfig(context, null),
    filePaths: changedTypescriptFiles.map(changedTypescriptFile => changedTypescriptFile.filePath)
  });
}

export function lintUpdateWorker(context: BuildContext, {tsConfig, tsLintConfig, filePaths, typeCheck}: LintWorkerConfig) {
  const program = createProgram(context, tsConfig);
  return getLintConfig(context, tsLintConfig)
    .then(tsLintConfig => lintFiles(context, program, tsLintConfig, filePaths, {typeCheck}))
    // Don't throw if linting failed
    .catch(() => {});
}


function lintApp(context: BuildContext, {tsConfig, tsLintConfig, typeCheck, exclude}: LintWorkerConfig) {
  const program = createProgram(context, tsConfig);
  const files = getFileNames(context, program, exclude);
  return lintFiles(context, program, tsLintConfig, files, {typeCheck});
}


function getLintConfig(context: BuildContext, tsLintConfig: string | null): Promise<string> {
  return new Promise((resolve, reject) => {
    tsLintConfig = getTsLintConfig(context);
    if (!tsLintConfig) {
      tsLintConfig = join(context.rootDir, 'tslint.json');
    }

    Logger.debug(`tslint config: ${tsLintConfig}`);

    access(tsLintConfig, (err: Error) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        reject(err);
        return;
      }
      resolve(tsLintConfig);
    });
  });
}

function getTsLintConfig(context: BuildContext, configFile?: string): string {
  configFile = getUserConfigFile(context, taskInfo, configFile);
  let { tsLintConfig } = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  if (tsLintConfig) {
    tsLintConfig = join(context.rootDir, tsLintConfig);
  }
  return tsLintConfig;
}
