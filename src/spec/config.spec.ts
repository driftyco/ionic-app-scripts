import { BuildContext } from '../util/interfaces';
import { bundlerStrategy, generateContext, getConfigValue, getUserConfigFile, getIsProd } from '../util/config';
import { addArgv, setAppPackageJsonData, setProcessEnvVar, setProcessArgs, setProcessEnv, setCwd } from '../util/config';
import { resolve } from 'path';


describe('config', () => {

  describe('generateContext', () => {

    it('should set isWatch true with isWatch true context', () => {
      const context = generateContext({
        isWatch: true
      });
      expect(context.isWatch).toEqual(true);
    });

    it('should set isWatch false by default', () => {
      const context = generateContext();
      expect(context.isWatch).toEqual(false);
    });

    it('should set isProd false with isProd false context', () => {
      const context = generateContext({
        isProd: false
      });
      expect(context.isProd).toEqual(false);
    });

    it('should set default bundler when invalid value', () => {
      const context = generateContext();
      expect(context.bundler).toEqual('webpack');
    });

    it('should set default bundler when not set', () => {
      const context = generateContext();
      expect(context.bundler).toEqual('webpack');
    });

    it('should set isProd by default', () => {
      const context = generateContext();
      expect(context.isProd).toEqual(true);
    });

    it('should create an object when passed nothing', () => {
      const context = generateContext();
      expect(context).toBeDefined();
    });

  });

  describe('getIsProd', () => {

    it('should set isProd false with env var', () => {
      context = {};
      setProcessEnvVar('IONIC_DEV', 'true');
      expect(getIsProd(context)).toEqual(false);
    });

    it('should set isProd false with package.json string config', () => {
      context = {};
      setAppPackageJsonData({ config: { ionic_dev: 'true' }});
      expect(getIsProd(context)).toEqual(false);
    });

    it('should set isProd false with package.json config', () => {
      context = {};
      setAppPackageJsonData({ config: { ionic_dev: true }});
      expect(getIsProd(context)).toEqual(false);
    });

    it('should not reassign isProd when already set', () => {
      context = {};
      context.isProd = true;
      addArgv('--dev');
      expect(getIsProd(context)).toEqual(true);
    });

    it('should set isProd false with short --d arg', () => {
      context = {};
      addArgv('-d');
      expect(getIsProd(context)).toEqual(false);
    });

    it('should set isProd false with full --dev arg', () => {
      context = {};
      addArgv('--dev');
      expect(getIsProd(context)).toEqual(false);
    });

    it('should default to isProd true', () => {
      context = {};
      expect(getIsProd(context)).toEqual(true);
    });

  });

  describe('getConfigValue', () => {

    it('should get arg full value', () => {
      addArgv('--full');
      addArgv('fullArgValue');
      addArgv('-s');
      addArgv('shortArgValue');
      setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('fullArgValue');
    });

    it('should get arg short value', () => {
      addArgv('-s');
      addArgv('shortArgValue');
      setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('shortArgValue');
    });

    it('should get envVar value', () => {
      setProcessEnvVar('ENV_VAR', 'myProcessEnvVar');
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('myProcessEnvVar');
    });

    it('should get package.json config value', () => {
      setAppPackageJsonData({ config: { config_prop: 'myPackageConfigVal' } });
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('myPackageConfigVal');
    });

    it('should get default value', () => {
      const val = getConfigValue(context, '--full', '-s', 'ENV_VAR', 'config_prop', 'defaultValue');
      expect(val).toEqual('defaultValue');
    });

  });

  describe('bundlerStrategy', () => {

    it('should get rollup by full arg', () => {
      addArgv('--rollup');
      addArgv('my.rollup.confg.js');
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by short arg', () => {
      addArgv('-r');
      addArgv('my.rollup.confg.js');
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by bundler arg', () => {
      addArgv('--bundler');
      addArgv('rollup');
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by env var', () => {
      setProcessEnv({
        ionic_bundler: 'rollup'
      });
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by package.json config', () => {
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get webpack with invalid env var', () => {
      setProcessEnv({
        ionic_bundler: 'bobsBundler'
      });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('webpack');
    });

    it('should get rollup by env var', () => {
      setProcessEnv({
        ionic_bundler: 'rollup'
      });
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get rollup by package.json config', () => {
      setAppPackageJsonData({ config: { ionic_bundler: 'rollup' } });
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('rollup');
    });

    it('should get webpack by default', () => {
      const bundler = bundlerStrategy(context);
      expect(bundler).toEqual('webpack');
    });

  });

  describe('getUserConfigFile', () => {

    it('should get config from package.json config', () => {
      setAppPackageJsonData({
        config: { ionic_config: 'myconfig.js' }
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from env var', () => {
      setProcessEnv({
        IONIC_CONFIG: 'myconfig.js'
      });

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from short arg', () => {
      addArgv('-s');
      addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get config from full arg', () => {
      addArgv('--full');
      addArgv('myconfig.js');

      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should get userConfigFile', () => {
      const userConfigFile = 'myconfig.js';
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(resolve('myconfig.js'));
    });

    it('should not get a user config', () => {
      const userConfigFile: string = null;
      const context = { rootDir: process.cwd() };
      const taskInfo = { fullArg: '--full', shortArg: '-s', defaultConfigFile: 'default.config.js', envVar: 'IONIC_CONFIG', packageConfig: 'ionic_config' };
      const rtn = getUserConfigFile(context, taskInfo, userConfigFile);
      expect(rtn).toEqual(null);
    });

  });

  let context: BuildContext;
  beforeEach(() => {
    setProcessArgs(['node', 'ionic-app-scripts']);
    setProcessEnv({});
    setCwd('');
    setAppPackageJsonData(null);
    context = generateContext({});
  });

});
