import { join } from 'path';
import { getParsedDeepLinkConfig } from '../util/helpers';
import { BuildContext , DeepLinkConfigEntry} from '../util/interfaces';
import { Logger } from '../logger/logger';
import { getInstance } from '../util/hybrid-file-system-factory';
import { WatchMemorySystem } from './watch-memory-system';

import * as ContextElementDependency from 'webpack/lib/dependencies/ContextElementDependency';

export class IonicEnvironmentPlugin {
  constructor(private context: BuildContext) {
  }

  apply(compiler: any) {

    compiler.plugin('context-module-factory', (contextModuleFactory: any) => {
      const deepLinkConfig = getParsedDeepLinkConfig();
      const webpackDeepLinkModuleDictionary = convertDeepLinkConfigToWebpackFormat(deepLinkConfig);
      contextModuleFactory.plugin('after-resolve', (result: any, callback: Function) => {
        if (!result) {
          return callback();
        }

        const ngModuleLoaderDirectory = join('ionic-angular', 'util');
        if (!result.resource.endsWith(ngModuleLoaderDirectory)) {
          return callback(null, result);
        }

        result.resource = this.context.srcDir;
        result.recursive = true;
        result.dependencies.forEach((dependency: any) => dependency.critical = false);
        result.resolveDependencies = (p1: any, p2: any, p3: any, p4: RegExp, cb: any ) => {
          const dependencies = Object.keys(webpackDeepLinkModuleDictionary)
                                  .map((key) => {
                                    const value = webpackDeepLinkModuleDictionary[key];
                                    if (value) {
                                      return new ContextElementDependency(value, key);
                                    }
                                    return null;
                                  }).filter(dependency => !!dependency);
          cb(null, dependencies);
        };
        return callback(null, result);
      });
    });

    compiler.plugin('environment', (otherCompiler: any, callback: Function) => {
      Logger.debug('[IonicEnvironmentPlugin] apply: creating environment plugin');
      const hybridFileSystem = getInstance();
      hybridFileSystem.setFileSystem(compiler.inputFileSystem);
      compiler.inputFileSystem = hybridFileSystem;
      compiler.outputFileSystem = hybridFileSystem;
      compiler.watchFileSystem = new WatchMemorySystem(this.context.fileCache);

      // do a bunch of webpack specific stuff here, so cast to an any
      // populate the content of the file system with any virtual files
      // inspired by populateWebpackResolver method in Angular's webpack plugin
      const webpackFileSystem: any = hybridFileSystem;
      const fileStatsDictionary = hybridFileSystem.getAllFileStats();
      const dirStatsDictionary = hybridFileSystem.getAllDirStats();

      this.initializeWebpackFileSystemCaches(webpackFileSystem);

      for (const filePath of Object.keys(fileStatsDictionary)) {
        const stats =  fileStatsDictionary[filePath];
        webpackFileSystem._statStorage.data[filePath] = [null, stats];
        webpackFileSystem._readFileStorage.data[filePath] = [null, stats.content];
      }

      for (const dirPath of Object.keys(dirStatsDictionary)) {
        const stats = dirStatsDictionary[dirPath];
        const fileNames = hybridFileSystem.getFileNamesInDirectory(dirPath);
        const dirNames = hybridFileSystem.getSubDirs(dirPath);
        webpackFileSystem._statStorage.data[dirPath] = [null, stats];
        webpackFileSystem._readdirStorage.data[dirPath] = [null, fileNames.concat(dirNames)];
      }
    });
  }

  private initializeWebpackFileSystemCaches(webpackFileSystem: any) {
    if (!webpackFileSystem._statStorage) {
      webpackFileSystem._statStorage = { };
    }
    if (!webpackFileSystem._statStorage.data) {
      webpackFileSystem._statStorage.data = [];
    }

    if (!webpackFileSystem._readFileStorage) {
      webpackFileSystem._readFileStorage = { };
    }
    if (!webpackFileSystem._readFileStorage.data) {
      webpackFileSystem._readFileStorage.data = [];
    }

    if (!webpackFileSystem._readdirStorage) {
      webpackFileSystem._readdirStorage = { };
    }
    if (!webpackFileSystem._readdirStorage.data) {
      webpackFileSystem._readdirStorage.data = [];
    }
  }
}


export function convertDeepLinkConfigToWebpackFormat(parsedDeepLinkConfigs: DeepLinkConfigEntry[]) {
  const dictionary: { [index: string]: string} = { };
  if (!parsedDeepLinkConfigs) {
    parsedDeepLinkConfigs = [];
  }
  parsedDeepLinkConfigs.forEach(parsedDeepLinkConfig => {
    if (parsedDeepLinkConfig.userlandModulePath && parsedDeepLinkConfig.absolutePath) {
      dictionary[parsedDeepLinkConfig.userlandModulePath] = parsedDeepLinkConfig.absolutePath;
    }
  });
  return dictionary;
}
