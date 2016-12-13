/*import { BuildContext } from './util/interfaces';

import * as helpers from './util/helpers';
import * as build  from './build';
import * as bundle from './bundle';
import * as copy from './copy';
import * as minify from './minify';
import * as lint from './lint';
import * as ngc from './ngc';
import * as sass from './sass';
import * as transpile from './transpile';

describe('build', () => {
  beforeEach(() => {
    spyOn(helpers, 'readFileAsync').and.returnValue(Promise.resolve());
    spyOn(copy, 'copy').and.returnValue(Promise.resolve());
    spyOn(ngc, 'ngc').and.returnValue(Promise.resolve());
    spyOn(bundle, 'bundle').and.returnValue(Promise.resolve());
    spyOn(minify, 'minifyJs').and.returnValue(Promise.resolve());
    spyOn(sass, 'sass').and.returnValue(Promise.resolve());
    spyOn(minify, 'minifyCss').and.returnValue(Promise.resolve());
    spyOn(lint, 'lint').and.returnValue(Promise.resolve());
    spyOn(transpile, 'transpile').and.returnValue(Promise.resolve());
  });

  it('should do a prod build', (done: Function) => {
      let context: BuildContext = {
        isProd: true,
        optimizeJs: true,
        runMinifyJs: true,
        runMinifyCss: true,
        runAot: true
      };

      build.build(context).then(() => {
        expect(helpers.readFileAsync).toHaveBeenCalled();
        expect(copy.copy).toHaveBeenCalled();
        expect(ngc.ngc).toHaveBeenCalled();
        expect(bundle.bundle).toHaveBeenCalled();
        expect(minify.minifyJs).toHaveBeenCalled();
        expect(sass.sass).toHaveBeenCalled();
        expect(minify.minifyCss).toHaveBeenCalled();
        expect(lint.lint).toHaveBeenCalled();

        expect(transpile.transpile).not.toHaveBeenCalled();
        done();
      }).catch(err => {
        console.log(`err.message: `, err.message);
        expect(true).toEqual(false);
      });
    });

    it('should do a dev build', (done: Function) => {
      let context: BuildContext = {
        isProd: false,
        optimizeJs: false,
        runMinifyJs: false,
        runMinifyCss: false,
        runAot: false
      };

      build.build(context).then(() => {
        expect(helpers.readFileAsync).toHaveBeenCalled();
        expect(copy.copy).toHaveBeenCalled();
        expect(transpile.transpile).toHaveBeenCalled();
        expect(bundle.bundle).toHaveBeenCalled();
        expect(sass.sass).toHaveBeenCalled();
        expect(lint.lint).toHaveBeenCalled();

        expect(ngc.ngc).not.toHaveBeenCalled();
        expect(minify.minifyJs).not.toHaveBeenCalled();
        expect(minify.minifyCss).not.toHaveBeenCalled();
        done();
      }).catch(err => {
        console.log(`err.message: `, err.message);
        expect(true).toEqual(false);
      });
    });

});
*/
