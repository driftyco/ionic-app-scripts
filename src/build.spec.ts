import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import * as helpers from './util/helpers';
import * as build from './build';

import * as bundle from './bundle';
import * as copy from './copy';
import * as clean from './clean';
import * as lint from './lint';
import * as minify from './minify';
import * as ngc from './ngc';
import * as postprocess from './postprocess';
import * as preprocess from './preprocess';
import * as sass from './sass';
import * as transpile from './transpile';

describe('build', () => {
  beforeEach(() => {
    spyOn(clean, 'clean');
    spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve());
    spyOn(transpile, transpile.getTsConfigAsync.name).and.callFake(() => {
      return Promise.resolve({
        'options': {
          'sourceMap': true
        }
      });
    });

    spyOn(bundle, bundle.bundle.name).and.returnValue(Promise.resolve());
    spyOn(copy, copy.copy.name).and.returnValue(Promise.resolve());
    spyOn(minify, minify.minifyCss.name).and.returnValue(Promise.resolve());
    spyOn(minify, minify.minifyJs.name).and.returnValue(Promise.resolve());
    spyOn(lint, lint.lint.name).and.returnValue(Promise.resolve());
    spyOn(ngc, ngc.ngc.name).and.returnValue(Promise.resolve());
    spyOn(postprocess, postprocess.postprocess.name).and.returnValue(Promise.resolve());
    spyOn(preprocess, preprocess.preprocess.name).and.returnValue(Promise.resolve());
    spyOn(sass, sass.sass.name).and.returnValue(Promise.resolve());
    spyOn(transpile, transpile.transpile.name).and.returnValue(Promise.resolve());
  });

  it('should do a prod build', () => {
    let context: BuildContext = {
      isProd: true,
      optimizeJs: true,
      runMinifyJs: true,
      runMinifyCss: true,
      runAot: true
    };

    const getBooleanPropertyValueSpy = spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(true);

    return build.build(context).then(() => {
      expect(helpers.readFileAsync).toHaveBeenCalled();
      expect(copy.copy).toHaveBeenCalled();
      expect(ngc.ngc).toHaveBeenCalled();
      expect(bundle.bundle).toHaveBeenCalled();
      expect(minify.minifyJs).toHaveBeenCalled();
      expect(sass.sass).toHaveBeenCalled();
      expect(minify.minifyCss).toHaveBeenCalled();
      expect(lint.lint).toHaveBeenCalled();
      expect(getBooleanPropertyValueSpy.calls.first().args[0]).toEqual(Constants.ENV_ENABLE_LINT);

      expect(transpile.transpile).not.toHaveBeenCalled();
    }).catch(err => {
      expect(true).toEqual(false);
    });
  });

  it('should do a dev build', () => {
    let context: BuildContext = {
      isProd: false,
      optimizeJs: false,
      runMinifyJs: false,
      runMinifyCss: false,
      runAot: false
    };

    const getBooleanPropertyValueSpy = spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(true);

    return build.build(context).then(() => {
      expect(helpers.readFileAsync).toHaveBeenCalled();
      expect(copy.copy).toHaveBeenCalled();
      expect(transpile.transpile).toHaveBeenCalled();
      expect(bundle.bundle).toHaveBeenCalled();
      expect(sass.sass).toHaveBeenCalled();
      expect(lint.lint).toHaveBeenCalled();
      expect(getBooleanPropertyValueSpy.calls.first().args[0]).toEqual(Constants.ENV_ENABLE_LINT);
      expect(postprocess.postprocess).toHaveBeenCalled();
      expect(preprocess.preprocess).toHaveBeenCalled();
      expect(ngc.ngc).not.toHaveBeenCalled();
      expect(minify.minifyJs).not.toHaveBeenCalled();
      expect(minify.minifyCss).not.toHaveBeenCalled();
    }).catch(err => {
      expect(true).toEqual(false);
    });
  });

  it('should skip lint', () => {
    let context: BuildContext = {
      isProd: false,
      optimizeJs: false,
      runMinifyJs: false,
      runMinifyCss: false,
      runAot: false
    };

    const getBooleanPropertyValueSpy = spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);

    return build.build(context).then(() => {
      expect(helpers.readFileAsync).toHaveBeenCalled();
      expect(copy.copy).toHaveBeenCalled();
      expect(transpile.transpile).toHaveBeenCalled();
      expect(bundle.bundle).toHaveBeenCalled();
      expect(sass.sass).toHaveBeenCalled();
      expect(lint.lint).not.toHaveBeenCalled();
      expect(getBooleanPropertyValueSpy.calls.first().args[0]).toEqual(Constants.ENV_ENABLE_LINT);
      expect(postprocess.postprocess).toHaveBeenCalled();
      expect(preprocess.preprocess).toHaveBeenCalled();
      expect(ngc.ngc).not.toHaveBeenCalled();
      expect(minify.minifyJs).not.toHaveBeenCalled();
      expect(minify.minifyCss).not.toHaveBeenCalled();
    }).catch(err => {
      expect(true).toEqual(false);
    });
  });
});

describe('test project requirements before building', () => {
  it('should fail if APP_ENTRY_POINT file does not exist', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    const error = new Error('App entry point was not found');

    spyOn(helpers, 'readFileAsync').and.returnValue(Promise.reject(error));

    return build.build({}).catch((e) => {
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(1);
      expect(e).toEqual(error);
    });
  });

  it('should fail if IONIC_TS_CONFIG file does not exist', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    const error = new Error('Config was not found');

    spyOn(helpers, helpers.readFileAsync.name).and.returnValues(Promise.resolve());
    spyOn(transpile, transpile.getTsConfigAsync.name).and.returnValues(Promise.reject(error));

    return build.build({}).catch((e) => {
      expect(transpile.getTsConfigAsync).toHaveBeenCalledTimes(1);
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(1);
      expect(e).toEqual(error);
    });
  });

  it('should fail fataly if IONIC_TS_CONFIG file does not contain valid JSON', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    spyOn(transpile, transpile.getTsConfigAsync.name).and.callFake(() => {
      return Promise.resolve(`{
        "options" {
          "sourceMap": false
        }
      }
      `);
    });

    return build.build({}).catch((e) => {
      expect(transpile.getTsConfigAsync).toHaveBeenCalledTimes(1);
      expect(e.isFatal).toBeTruthy();
    });
  });

  it('should fail fataly if IONIC_TS_CONFIG file does not contain compilerOptions.sourceMap === true', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    spyOn(transpile, transpile.getTsConfigAsync.name).and.callFake(() => {
      return Promise.resolve(`{
        "options": {
          "sourceMap": false
        }
      }
      `);
    });

    return build.build({}).catch((e) => {
      expect(transpile.getTsConfigAsync).toHaveBeenCalledTimes(1);
      expect(e.isFatal).toBeTruthy();
    });
  });

  it('should succeed if IONIC_TS_CONFIG file contains compilerOptions.sourceMap === true', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';

    spyOn(bundle, bundle.bundle.name).and.returnValue(Promise.resolve());
    spyOn(clean, clean.clean.name);
    spyOn(copy, copy.copy.name).and.returnValue(Promise.resolve());
    spyOn(minify, minify.minifyCss.name).and.returnValue(Promise.resolve());
    spyOn(minify, minify.minifyJs.name).and.returnValue(Promise.resolve());
    spyOn(lint, lint.lint.name).and.returnValue(Promise.resolve());
    spyOn(ngc, ngc.ngc.name).and.returnValue(Promise.resolve());
    spyOn(postprocess, postprocess.postprocess.name).and.returnValue(Promise.resolve());
    spyOn(preprocess, preprocess.preprocess.name).and.returnValue(Promise.resolve());
    spyOn(sass, sass.sass.name).and.returnValue(Promise.resolve());
    spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve());
    spyOn(transpile, transpile.transpile.name).and.returnValue(Promise.resolve());
    spyOn(transpile, transpile.getTsConfigAsync.name).and.returnValue(Promise.resolve({
      'options': {
        'sourceMap': true
      }
    }));

    return build.build({}).then(() => {
      expect(transpile.getTsConfigAsync).toHaveBeenCalledTimes(1);
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(1);
    });
  });
});
