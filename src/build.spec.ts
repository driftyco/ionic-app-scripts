import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import * as helpers from './util/helpers';
import * as build  from './build';

import * as bundle from './bundle';
import * as copy from './copy';
import * as clean  from './clean';
import * as lint from './lint';
import * as minify from './minify';
import * as ngc from './ngc';
import * as preprocess from './preprocess';
import * as sass from './sass';
import * as transpile from './transpile';

describe('build', () => {
  beforeEach(() => {
    spyOn(clean, 'clean');
    spyOn(helpers, 'readFileAsync').and.callFake(() => {
      return Promise.resolve(`{
        "compilerOptions": {
          "sourceMap": true
        }
      }
      `);
    });


    spyOn(bundle, 'bundle').and.returnValue(Promise.resolve());
    spyOn(copy, 'copy').and.returnValue(Promise.resolve());
    spyOn(minify, 'minifyCss').and.returnValue(Promise.resolve());
    spyOn(minify, 'minifyJs').and.returnValue(Promise.resolve());
    spyOn(lint, 'lint').and.returnValue(Promise.resolve());
    spyOn(ngc, 'ngc').and.returnValue(Promise.resolve());
    spyOn(preprocess, 'preprocess').and.returnValue(Promise.resolve());
    spyOn(sass, 'sass').and.returnValue(Promise.resolve());
    spyOn(transpile, 'transpile').and.returnValue(Promise.resolve());
  });

  it('should do a prod build', () => {
    let context: BuildContext = {
      isProd: true,
      optimizeJs: true,
      runMinifyJs: true,
      runMinifyCss: true,
      runAot: true
    };

    return build.build(context).then(() => {
      expect(helpers.readFileAsync).toHaveBeenCalled();
      expect(copy.copy).toHaveBeenCalled();
      expect(ngc.ngc).toHaveBeenCalled();
      expect(bundle.bundle).toHaveBeenCalled();
      expect(minify.minifyJs).toHaveBeenCalled();
      expect(sass.sass).toHaveBeenCalled();
      expect(minify.minifyCss).toHaveBeenCalled();
      expect(lint.lint).toHaveBeenCalled();

      expect(transpile.transpile).not.toHaveBeenCalled();
    }).catch(err => {
      console.log(`err.message: `, err.message);
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

    return build.build(context).then(() => {
      expect(helpers.readFileAsync).toHaveBeenCalled();
      expect(copy.copy).toHaveBeenCalled();
      expect(transpile.transpile).toHaveBeenCalled();
      expect(bundle.bundle).toHaveBeenCalled();
      expect(sass.sass).toHaveBeenCalled();
      expect(lint.lint).toHaveBeenCalled();
      expect(preprocess.preprocess).toHaveBeenCalled();
      expect(ngc.ngc).not.toHaveBeenCalled();
      expect(minify.minifyJs).not.toHaveBeenCalled();
      expect(minify.minifyCss).not.toHaveBeenCalled();
    }).catch(err => {
      console.log(`err.message: `, err.message);
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
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(2);
      expect(e).toEqual(error);
    });
  });

  it('should fail if IONIC_TS_CONFIG file does not exist', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    const error = new Error('App entry point was not found');

    spyOn(helpers, 'readFileAsync').and.callFake((filePath: string) => {
      if (filePath === 'src/app/main.ts') {
        return Promise.resolve('allgood');
      }
      return Promise.reject(error);
    });

    return build.build({}).catch((e) => {
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(2);
      expect(e).toEqual(error);
    });
  });

  it('should fail fataly if IONIC_TS_CONFIG file does not contain valid JSON', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    spyOn(helpers, 'readFileAsync').and.callFake(() => {
      return Promise.resolve(`{
        "compilerOptions" {
          "sourceMap": false
        }
      }
      `);
    });

    return build.build({}).catch((e) => {
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(2);
      expect(e.isFatal).toBeTruthy();
    });
  });

  it('should fail fataly if IONIC_TS_CONFIG file does not contain compilerOptions.sourceMap === true', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';
    spyOn(helpers, 'readFileAsync').and.callFake(() => {
      return Promise.resolve(`{
        "compilerOptions": {
          "sourceMap": false
        }
      }
      `);
    });

    return build.build({}).catch((e) => {
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(2);
      expect(e.isFatal).toBeTruthy();
    });
  });

  it('should succeed if IONIC_TS_CONFIG file contains compilerOptions.sourceMap === true', () => {
    process.env[Constants.ENV_APP_ENTRY_POINT] = 'src/app/main.ts';
    process.env[Constants.ENV_TS_CONFIG] = 'tsConfig.js';

    spyOn(bundle, 'bundle').and.returnValue(Promise.resolve());
    spyOn(clean, 'clean');
    spyOn(copy, 'copy').and.returnValue(Promise.resolve());
    spyOn(minify, 'minifyCss').and.returnValue(Promise.resolve());
    spyOn(minify, 'minifyJs').and.returnValue(Promise.resolve());
    spyOn(lint, 'lint').and.returnValue(Promise.resolve());
    spyOn(ngc, 'ngc').and.returnValue(Promise.resolve());
    spyOn(preprocess, 'preprocess').and.returnValue(Promise.resolve());
    spyOn(sass, 'sass').and.returnValue(Promise.resolve());
    spyOn(transpile, 'transpile').and.returnValue(Promise.resolve());
    spyOn(helpers, 'readFileAsync').and.callFake(() => {
      return Promise.resolve(`{
        "compilerOptions": {
          "sourceMap": true
        }
      }
      `);
    });

    return build.build({}).then(() => {
      expect(helpers.readFileAsync).toHaveBeenCalledTimes(2);
    });
  });
});
