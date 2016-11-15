import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError, Logger } from './util/logger';
import { cacheTranspiledTsFiles, setModulePathsCache } from './util/helpers';
import { emit, EventType } from './util/events';
import { fillConfigDefaults, generateContext, getUserConfigFile, replacePathVars } from './util/config';
import { InMemoryFileSystem } from './util/in-memory-file-system';
import { join } from 'path';
import * as wp from 'webpack';


export function webpack(context: BuildContext, configFile: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  cacheTranspiledTsFiles(context.tsFiles);

  const logger = new Logger('webpack');

  return webpackWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function webpackUpdate(event: string, path: string, context: BuildContext, configFile: string) {
  configFile = getUserConfigFile(context, taskInfo, configFile);
  const logger = new Logger('webpack update');

  cacheTranspiledTsFiles(context.tsFiles);

  return webpackWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function webpackWorker(context: BuildContext, configFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const webpackConfig = getWebpackConfig(context, configFile);
      const compiler: any = wp(webpackConfig);

      // wrap the default webpack file system with our custom version
      compiler.inputFileSystem = new InMemoryFileSystem(compiler.inputFileSystem, context.tsFiles);

      compiler.run((err: Error, stats: any) => {
        if (err) {
          reject(err);

        } else {
          // set the module files used in this bundle
          // this reference can be used elsewhere in the build (sass)
          const files = stats.compilation.modules.map((webpackObj: any) => {
            if (webpackObj.resource) {
              return webpackObj.resource;
            } else {
              return webpackObj.context;
            }
          }).filter((path: string) => {
            // just make sure the path is not null
            return path && path.length > 0;
          });

          context.moduleFiles = files;

          // async cache all the module paths so we don't need
          // to always bundle to know which modules are used
          setModulePathsCache(context.moduleFiles);

          emit(EventType.FileChange, getOutputDest(context, webpackConfig));

          resolve();
        }
      });

    } catch (e) {
      reject(new BuildError(e));
    }
  });
}


export function getWebpackConfig(context: BuildContext, configFile: string): WebpackConfig {
  configFile = getUserConfigFile(context, taskInfo, configFile);

  let webpackConfig: WebpackConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
  webpackConfig.entry = replacePathVars(context, webpackConfig.entry);
  webpackConfig.output.path = replacePathVars(context, webpackConfig.output.path);

  return webpackConfig;
}


export function getOutputDest(context: BuildContext, webpackConfig: WebpackConfig) {
  return join(webpackConfig.output.path, webpackConfig.output.filename);
}


const taskInfo: TaskInfo = {
  fullArgConfig: '--webpack',
  shortArgConfig: '-w',
  envConfig: 'ionic_webpack',
  defaultConfigFile: 'webpack.config'
};


export interface WebpackConfig {
  // https://www.npmjs.com/package/webpack
  devtool: string;
  entry: string | { [key: string]: any };
  output: WebpackOutputObject;
}

export interface WebpackOutputObject {
  path: string;
  filename: string;
}
