import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';

import { AotCompiler } from './aot/aot-compiler';
import {
  convertDeepLinkConfigEntriesToString,
  getUpdatedAppNgModuleContentWithDeepLinkConfig,
  filterTypescriptFilesForDeepLinks,
  purgeDeepLinkDecorator
} from './deep-linking/util';
import { Logger } from './logger/logger';
import { getUserConfigFile} from './util/config';
import * as Constants from './util/constants';
import { changeExtension, getBooleanPropertyValue, getParsedDeepLinkConfig, getStringPropertyValue } from './util/helpers';
import { BuildContext, TaskInfo } from './util/interfaces';

export function ngc(context: BuildContext, configFile?: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('ngc');

  return ngcWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}

export function ngcWorker(context: BuildContext, configFile: string): Promise<any> {
  return transformTsForDeepLinking(context).then(() => {
    return runNgc(context, configFile);
  });
}

export function runNgc(context: BuildContext, configFile: string): Promise<any> {
  const compiler = new AotCompiler(context, { entryPoint: process.env[Constants.ENV_APP_ENTRY_POINT],
    rootDir: context.rootDir,
    tsConfigPath: process.env[Constants.ENV_TS_CONFIG],
    appNgModuleClass: process.env[Constants.ENV_APP_NG_MODULE_CLASS],
    appNgModulePath: process.env[Constants.ENV_APP_NG_MODULE_PATH]
  });
  return compiler.compile();
}

export function transformTsForDeepLinking(context: BuildContext) {
  if (getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS)) {
    const tsFiles = filterTypescriptFilesForDeepLinks(context.fileCache);
    tsFiles.forEach(tsFile => {
      tsFile.content = purgeDeepLinkDecorator(tsFile.content);
    });
    const tsFile = context.fileCache.get(getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH));
    const deepLinkString = convertDeepLinkConfigEntriesToString(getParsedDeepLinkConfig());
    tsFile.content = getUpdatedAppNgModuleContentWithDeepLinkConfig(tsFile.path, tsFile.content, deepLinkString);
  }
  return Promise.resolve();
}

const taskInfo: TaskInfo = {
  fullArg: '--ngc',
  shortArg: '-n',
  envVar: 'IONIC_NGC',
  packageConfig: 'ionic_ngc',
  defaultConfigFile: null
};
