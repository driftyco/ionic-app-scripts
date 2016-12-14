import { BuildContext } from './interfaces';
import * as config from './config';

import * as Constants from './constants';
import { resolve } from 'path';


describe('config', () => {

  describe('config.config.generateContext', () => {

    it('should set isWatch true with isWatch true context', () => {
      const context = config.generateContext({
        isWatch: true
      });
      expect(context.isWatch).toEqual(true);
    });

    it('should set isWatch false by default', () => {
      const context = config.generateContext();
      expect(context.isWatch).toEqual(false);
    });

    it('should set isProd false with isProd false context', () => {
      const context = config.generateContext({
        isProd: false
      });
      expect(context.isProd).toEqual(false);
    });

    it('should set default bundler when invalid value', () => {
      const context = config.generateContext();
      expect(context.bundler).toEqual('webpack');
    });

    it('should set default bundler when not set', () => {
      const context = config.generateContext();
      expect(context.bundler).toEqual('webpack');
    });

    it('should set isProd by default', () => {
      const context = config.generateContext();
      expect(context.isProd).toEqual(false);
    });

    it('should create an object when passed nothing', () => {
      const context = config.generateContext();
      expect(context).toBeDefined();
    });

    it('should set default prod specific build flag defaults to false', () => {
      // arrange
      const fakeConfig: any = { };
      config.setProcessEnv(fakeConfig);

      // act
      const context = config.generateContext({
        isProd: false
      });

      // assert
      expect(context.isProd).toEqual(false);
      expect(context.runAot).toEqual(false);
      expect(context.runMinifyJs).toEqual(false);
      expect(context.runMinifyCss).toEqual(false);
      expect(context.optimizeJs).toEqual(false);
      expect(fakeConfig[Constants.ENV_VAR_IONIC_ENV]).toEqual(Constants.ENV_VAR_DEV);
    });

    it('should set default prod specific build flags to true when isProd is true', () => {
      // arrange
       // arrange
      const fakeConfig: any = { };
      config.setProcessEnv(fakeConfig);

      // act
      const context = config.generateContext({
        isProd: true
      });

      // assert
      expect(context.isProd).toEqual(true);
      expect(context.runAot).toEqual(true);
      expect(context.runMinifyJs).toEqual(true);
      expect(context.runMinifyCss).toEqual(true);
      expect(context.optimizeJs).toEqual(true);
      expect(fakeConfig[Constants.ENV_VAR_IONIC_ENV]).toEqual(Constants.ENV_VAR_PROD);
    });
  });

  describe('config.replacePathVars', () => {
    it('should interpolated value when string', () => {
      const context = {
        srcDir: 'src',
      };

      const rtn = config.replacePathVars(context, '{{SRC}}');
      expect(rtn).toEqual('src');
    });

    it('should interpolated values in string array', () => {
      const context = {
        wwwDir: 'www',
        srcDir: 'src',
      };

      const filePaths = ['{{SRC}}', '{{WWW}}'];
      const rtn = config.replacePathVars(context, filePaths);
      expect(rtn).toEqual(['src', 'www']);
    });

    it('should interpolated values in key value pair', () => {
      const context = {
        wwwDir: 'www',
        srcDir: 'src',
      };

      const filePaths = {
        src: '{{SRC}}',
        www: '{{WWW}}'
      };

      const rtn = config.replacePathVars(context, filePaths);
      expect(rtn).toEqual({
        src: 'src',
        www: 'www'
      });
    });

  });

  describe('config.getConfigValue', () => {

    it('should get arg full value', () => {
      config.addArgv('--full');
      config.addArgv('fullArgValue');
      config.addArgv('-s');
      config.addArgv('shortArgValue');
      config.setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      config.setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = config.getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('fullArgValue');
    });

    it('should get arg short value', () => {
      config.addArgv('-s');
      config.addArgv('shortArgValue');
      config.setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      config.setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = config.getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('shortArgValue');
    });

    it('should get envVar value', () => {
      config.setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      config.setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = config.getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('myProcessEnvVar');
    });

    it('should get package.json config value', () => {
      config.setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = config.getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('myPackageConfigVal');
    });

    it('should get default value', () => {
      const val = config.getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('defaultValue');
    });

  });

  describe('config.bundlerStrategy', () => {

    it('should get rollup by full arg', () => {
      config.addArgv('--rollup');
      config.addArgv('my.rollup.confg.js');
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by short arg', () => {
      config.addArgv('-r');
      config.addArgv('my.rollup.confg.js');
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by bundler arg', () => {
      config.addArgv('--bundler');
      config.addArgv('rollup');
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by env var', () => {
      config.setProcessEnv({
        ionic_bundler: 'rollup'
      });
      config.setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by package.json config', () => {
      config.setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get webpack with invalid env var', () => {
      config.setProcessEnv({
        ionic_bundler: 'bobsBundler'
      });
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('webpack');
    });

    it('should get rollup by env var', () => {
      config.setProcessEnv({
        ionic_bundler: 'rollup'
      });
      config.setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by package.json config', () => {
      config.setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get webpack by default', () => {
      const bundler = config.bundlerStrategy(context);
      expect(bundler).toEqual('webpack');
    });

  });

  describe('config.getUserConfigFile', () => {

    it('should get config from package.json config', () => {
      config.setAppPackageJsonData({
        config: { ionic_config: 'myconfig.js' }
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = config.getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from env var', () => {
      config.setProcessEnv({
        IONIC_CONFIG: 'myconfig.js'
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = config.getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from short arg', () => {
      config.addArgv('-s');
      config.addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = config.getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from full arg', () => {
      config.addArgv('--full');
      config.addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = config.getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get userConfigFile', () => {
      const userConfigFile = 'myconfig.js';
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = config.getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should not get a user config', () => {
      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = config.getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(null);
    });

  });

  describe('config.hasArg function', () => {
    it('should return false when a match is not found', () => {
      const result = config.hasArg('--full', '-f');
      expect(result).toBeFalsy();
    });

    it('should match on a fullname arg', () => {
      config.addArgv('--full');

      const result = config.hasArg('--full');
      expect(result).toBeTruthy();
    });

    it('should match on a shortname arg', () => {
      config.addArgv('-f');

      const result = config.hasArg('--full', '-f');
      expect(result).toBeTruthy();
    });

    it('should compare fullnames as case insensitive', () => {
      config.addArgv('--full');
      config.addArgv('--TEST');

      const result = config.hasArg('--Full');
      const result2 = config.hasArg('--test');
      expect(result).toBeTruthy();
      expect(result2).toBeTruthy();
    });

    it('should compare shortnames as case insensitive', () => {
      config.addArgv('-f');
      config.addArgv('-T');

      const result = config.hasArg('-F');
      const result2 = config.hasArg('-t');
      expect(result).toBeTruthy();
      expect(result2).toBeTruthy();
    })
  });

  let context: BuildContext;
  beforeEach(() => {
    config.setProcessArgs(['node', 'ionic-app-scripts']);
    config.setProcessEnv({});
    config.setCwd('');
    config.setAppPackageJsonData(null);
    context = config.generateContext({});
  });

});
