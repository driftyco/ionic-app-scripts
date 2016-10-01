import { BuildContext, generateContext, generateBuildOptions, getConfigValueDefaults, fillConfigDefaults } from '../util';
import { addArgv, setEnvVar, setProcessArgs, setProcessEnv, setCwd } from '../util';

describe('util', () => {

  describe('generateBuildOptions', () => {

    it('should set isWatch true with isWatch true context', () => {
      const opts = generateBuildOptions({
        isWatch: true
      });
      expect(opts.isWatch).toEqual(true);
    });

    it('should set isWatch false by default', () => {
      const opts = generateBuildOptions();
      expect(opts.isWatch).toEqual(false);
    });

    it('should set isProd false with isProd false context', () => {
      const opts = generateBuildOptions({
        isProd: false
      });
      expect(opts.isProd).toEqual(false);
    });

    it('should set isProd by default', () => {
      const opts = generateBuildOptions();
      expect(opts.isProd).toEqual(true);
    });

    it('should create an object when passed nothing', () => {
      const opts = generateBuildOptions();
      expect(opts).toBeDefined();
    });

  });

  describe('getConfigValueDefaults', () => {

    it('should get arg full value', () => {
      addArgv('--full');
      addArgv('fullArgValue');
      addArgv('-s');
      addArgv('shortArgValue');
      setEnvVar('npm_package_config_envVar', 'myNPMConfigVal');
      setEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefaults('--full', '-s', 'envVar', 'defaultValue', context);
      expect(val).toEqual('fullArgValue');
    });

    it('should get arg short value', () => {
      addArgv('-s');
      addArgv('shortArgValue');
      setEnvVar('npm_package_config_envVar', 'myNPMConfigVal');
      setEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefaults('--full', '-s', 'envVar', 'defaultValue', context);
      expect(val).toEqual('shortArgValue');
    });

    it('should get npm config value', () => {
      setEnvVar('npm_package_config_envVar', 'myNPMConfigVal');
      setEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefaults('--full', '-s', 'envVar', 'defaultValue', context);
      expect(val).toEqual('myNPMConfigVal');
    });

    it('should get envVar value', () => {
      setEnvVar('envVar', 'myProcessEnvVar');
      const val = getConfigValueDefaults('--full', '-s', 'envVar', 'defaultValue', context);
      expect(val).toEqual('myProcessEnvVar');
    });

    it('should get default value', () => {
      const val = getConfigValueDefaults('--full', '-s', 'envVar', 'defaultValue', context);
      expect(val).toEqual('defaultValue');
    });

  });

  describe('fillConfigDefaults', () => {

    it('should not return same config instances', () => {
      addArgv('-s');
      addArgv('configFile');
      const configStub = {};
      spyOn(require('module'), '_load').and.returnValue(configStub);

      const config = fillConfigDefaults({ rootDir: './' }, null, { fullArgConfig: '', shortArgConfig: '-s', defaultConfigFilename: '', envConfig: '' });
      expect(config).not.toBe(configStub);
    });

  });

  let context: BuildContext;
  beforeEach(() => {
    setProcessArgs(['node', 'ionic-app-scripts']);
    setProcessEnv({});
    setCwd('');
    context = generateContext({});
  });

});
