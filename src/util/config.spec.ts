import { join, resolve } from 'path';

import * as helpers from './helpers';
import { BuildContext } from './interfaces';
import * as config from './config';
import * as Constants from './constants';


describe('config', () => {

  describe('config.generateContext', () => {

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

    it('should set the correct defaults for a dev build', () => {
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

      expect(context.rootDir).toEqual(process.cwd());
      expect(context.tmpDir).toEqual(join(process.cwd(), Constants.TMP_DIR));
      expect(context.srcDir).toEqual(join(process.cwd(), Constants.SRC_DIR));
      expect(fakeConfig[Constants.ENV_VAR_DEEPLINKS_DIR]).toEqual(context.srcDir);
      expect(context.wwwDir).toEqual(join(process.cwd(), Constants.WWW_DIR));
      expect(context.wwwIndex).toEqual('index.html');
      expect(context.buildDir).toEqual(join(process.cwd(), Constants.WWW_DIR, Constants.BUILD_DIR));
      expect(context.pagesDir).toEqual(join(context.srcDir, 'pages'));
      expect(context.componentsDir).toEqual(join(context.srcDir, 'components'));
      expect(context.directivesDir).toEqual(join(context.srcDir, 'directives'));
      expect(context.pipesDir).toEqual(join(context.srcDir, 'pipes'));
      expect(context.providersDir).toEqual(join(context.srcDir, 'providers'));
      expect(context.nodeModulesDir).toEqual(join(process.cwd(), Constants.NODE_MODULES));
      expect(context.ionicAngularDir).toEqual(join(process.cwd(), Constants.NODE_MODULES, Constants.IONIC_ANGULAR));
      expect(fakeConfig[Constants.ENV_VAR_AT_ANGULAR_DIR]).toEqual(join(process.cwd(), Constants.NODE_MODULES, Constants.AT_ANGULAR));
      expect(context.coreCompilerFilePath).toEqual(join(context.ionicAngularDir, 'compiler'));
      expect(context.coreDir).toEqual(context.ionicAngularDir);
      expect(fakeConfig[Constants.ENV_VAR_RXJS_DIR]).toEqual(join(process.cwd(), Constants.NODE_MODULES, Constants.RXJS));
      expect(fakeConfig[Constants.ENV_VAR_IONIC_ANGULAR_TEMPLATE_DIR]).toEqual(join(context.ionicAngularDir, 'templates'));
      expect(context.platform).toEqual(null);
      expect(context.target).toEqual(null);
      expect(fakeConfig[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT]).toEqual(join(context.ionicAngularDir, 'index.js'));
      expect(fakeConfig[Constants.ENV_VAR_APP_SCRIPTS_DIR]).toEqual(join(__dirname, '..', '..'));
      expect(fakeConfig[Constants.ENV_VAR_GENERATE_SOURCE_MAP]).toEqual('true');
      expect(fakeConfig[Constants.ENV_VAR_SOURCE_MAP_TYPE]).toEqual(Constants.SOURCE_MAP_TYPE_EXPENSIVE);
      expect(fakeConfig[Constants.ENV_TS_CONFIG]).toEqual(join(process.cwd(), 'tsconfig.json'));
      expect(fakeConfig[Constants.ENV_READ_CONFIG_JSON]).toEqual('true');
      expect(fakeConfig[Constants.ENV_APP_ENTRY_POINT]).toEqual(join(context.srcDir, 'app', 'main.ts'));
      expect(fakeConfig[Constants.ENV_APP_NG_MODULE_PATH]).toEqual(join(context.srcDir, 'app', 'app.module.ts'));
      expect(fakeConfig[Constants.ENV_APP_NG_MODULE_CLASS]).toEqual('AppModule');
      expect(fakeConfig[Constants.ENV_GLOB_UTIL]).toEqual(join(fakeConfig[Constants.ENV_VAR_APP_SCRIPTS_DIR], 'dist', 'util', 'glob-util.js'));
      expect(fakeConfig[Constants.ENV_CLEAN_BEFORE_COPY]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_CLOSURE_JAR]).toEqual(join(fakeConfig[Constants.ENV_VAR_APP_SCRIPTS_DIR], 'bin', 'closure-compiler.jar'));
      expect(fakeConfig[Constants.ENV_OUTPUT_JS_FILE_NAME]).toEqual('main.js');
      expect(fakeConfig[Constants.ENV_OUTPUT_CSS_FILE_NAME]).toEqual('main.css');
      expect(fakeConfig[Constants.ENV_WEBPACK_FACTORY]).toEqual(join(fakeConfig[Constants.ENV_VAR_APP_SCRIPTS_DIR], 'dist', 'webpack', 'ionic-webpack-factory.js'));
      expect(fakeConfig[Constants.ENV_WEBPACK_LOADER]).toEqual(join(fakeConfig[Constants.ENV_VAR_APP_SCRIPTS_DIR], 'dist', 'webpack', 'loader.js'));
      expect(fakeConfig[Constants.ENV_OPTIMIZATION_LOADER]).toEqual(join(fakeConfig[Constants.ENV_VAR_APP_SCRIPTS_DIR], 'dist', 'webpack', 'optimization-loader.js'));
      expect(fakeConfig[Constants.ENV_AOT_WRITE_TO_DISK]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_PRINT_ORIGINAL_DEPENDENCY_TREE]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_PRINT_MODIFIED_DEPENDENCY_TREE]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_PRINT_WEBPACK_DEPENDENCY_TREE]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_BAIL_ON_LINT_ERROR]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_ENABLE_LINT]).toEqual('true');
      expect(fakeConfig[Constants.ENV_DISABLE_LOGGING]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_START_WATCH_TIMEOUT]).toEqual('3000');
      expect(fakeConfig[Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX]).toEqual('.module.ts');

      expect(fakeConfig[Constants.ENV_ACTION_SHEET_CONTROLLER_CLASSNAME]).toEqual('ActionSheetController');
      expect(fakeConfig[Constants.ENV_ACTION_SHEET_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet-controller.js'));
      expect(fakeConfig[Constants.ENV_ACTION_SHEET_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet.js'));
      expect(fakeConfig[Constants.ENV_ACTION_SHEET_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet-component.js'));
      expect(fakeConfig[Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'action-sheet', 'action-sheet-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_ALERT_CONTROLLER_CLASSNAME]).toEqual('AlertController');
      expect(fakeConfig[Constants.ENV_ALERT_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'alert', 'alert-controller.js'));
      expect(fakeConfig[Constants.ENV_ALERT_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'alert', 'alert.js'));
      expect(fakeConfig[Constants.ENV_ALERT_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'alert', 'alert-component.js'));
      expect(fakeConfig[Constants.ENV_ALERT_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'alert', 'alert-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_APP_ROOT_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'app', 'app-root.js'));

      expect(fakeConfig[Constants.ENV_LOADING_CONTROLLER_CLASSNAME]).toEqual('LoadingController');
      expect(fakeConfig[Constants.ENV_LOADING_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'loading', 'loading-controller.js'));
      expect(fakeConfig[Constants.ENV_LOADING_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'loading', 'loading.js'));
      expect(fakeConfig[Constants.ENV_LOADING_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'loading', 'loading-component.js'));
      expect(fakeConfig[Constants.ENV_LOADING_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'loading', 'loading-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_MODAL_CONTROLLER_CLASSNAME]).toEqual('ModalController');
      expect(fakeConfig[Constants.ENV_MODAL_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'modal', 'modal-controller.js'));
      expect(fakeConfig[Constants.ENV_MODAL_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'modal', 'modal.js'));
      expect(fakeConfig[Constants.ENV_MODAL_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'modal', 'modal-component.js'));
      expect(fakeConfig[Constants.ENV_MODAL_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'modal', 'modal-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_PICKER_CONTROLLER_CLASSNAME]).toEqual('PickerController');
      expect(fakeConfig[Constants.ENV_PICKER_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'picker', 'picker-controller.js'));
      expect(fakeConfig[Constants.ENV_PICKER_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'picker', 'picker.js'));
      expect(fakeConfig[Constants.ENV_PICKER_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'picker', 'picker-component.js'));
      expect(fakeConfig[Constants.ENV_PICKER_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'picker', 'picker-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_POPOVER_CONTROLLER_CLASSNAME]).toEqual('PopoverController');
      expect(fakeConfig[Constants.ENV_POPOVER_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'popover', 'popover-controller.js'));
      expect(fakeConfig[Constants.ENV_POPOVER_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'popover', 'popover.js'));
      expect(fakeConfig[Constants.ENV_POPOVER_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'popover', 'popover-component.js'));
      expect(fakeConfig[Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'popover', 'popover-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_TOAST_CONTROLLER_CLASSNAME]).toEqual('ToastController');
      expect(fakeConfig[Constants.ENV_TOAST_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'toast', 'toast-controller.js'));
      expect(fakeConfig[Constants.ENV_TOAST_VIEW_CONTROLLER_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'toast', 'toast.js'));
      expect(fakeConfig[Constants.ENV_TOAST_COMPONENT_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'toast', 'toast-component.js'));
      expect(fakeConfig[Constants.ENV_TOAST_COMPONENT_FACTORY_PATH]).toEqual(join(context.ionicAngularDir, 'components', 'toast', 'toast-component.ngfactory.js'));

      expect(fakeConfig[Constants.ENV_PARSE_DEEPLINKS]).toBeTruthy();
      expect(fakeConfig[Constants.ENV_PURGE_DECORATORS]).toBeTruthy();
      expect(fakeConfig[Constants.ENV_MANUAL_TREESHAKING]).toBeTruthy();

      expect(fakeConfig[Constants.ENV_USE_EXPERIMENTAL_CLOSURE]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_USE_EXPERIMENTAL_BABILI]).toBeFalsy();
      expect(fakeConfig[Constants.ENV_BUILD_TO_ES5]).toEqual('true');
      expect(context.bundler).toEqual('webpack');
    });

    it('should set defaults for a prod build', () => {
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
      expect(fakeConfig[Constants.ENV_VAR_GENERATE_SOURCE_MAP]).toBeFalsy();
    });

    it('should override console', () => {
      const originalDebug = console.debug;
      const originalError = console.error;
      const originalInfo = console.info;
      const originalLog = console.log;
      const originalTrace = console.trace;
      const originalWarn = console.warn;

      const fakeConfig: any = { };
      config.setProcessEnv(fakeConfig);

      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(true);

      config.generateContext({
        isProd: true
      });

      expect(console.debug).not.toEqual(originalDebug);
      expect(console.error).not.toEqual(originalError);
      expect(console.info).not.toEqual(originalInfo);
      expect(console.log).not.toEqual(originalLog);
      expect(console.trace).not.toEqual(originalTrace);
      expect(console.warn).not.toEqual(originalWarn);
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
    });
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
