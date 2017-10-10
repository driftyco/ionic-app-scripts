import { join } from 'path';
import * as Constants from './constants';
import * as sourceMaps from './source-maps';
import * as helpers from './helpers';

describe('source maps', () => {
  describe('purgeSourceMapsIfNeeded', () => {
    it('should copy files first, then purge the files', async () => {
      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.callFake((argument: string) => {
        if (argument === Constants.ENV_VAR_MOVE_SOURCE_MAPS) {
          return true;
        }
      });

      spyOn(helpers, helpers.mkDirpAsync.name).and.returnValue(Promise.resolve());

      const knownFileNames = ['0.js', '0.js.map', '1.js', '1.js.map', 'main.js', 'main.js.map', 'vendor.js', 'vendor.js.map', 'main.css', 'polyfills.js', 'sw-toolbox.js', 'main.css', 'main.css.map'];

      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(knownFileNames));

      const context = {
        sourcemapDir: join(process.cwd(), 'sourceMapDir'),
        buildDir: join(process.cwd(), 'www', 'build')
      };

      const copyFileSpy = spyOn(helpers, helpers.copyFileAsync.name).and.returnValue(Promise.resolve());
      const unlinkFileSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      const result = await sourceMaps.copySourcemaps(context, true);
      expect(helpers.mkDirpAsync).toHaveBeenCalledTimes(1);
      expect(helpers.mkDirpAsync).toHaveBeenCalledWith(context.sourcemapDir);

      expect(helpers.readDirAsync).toHaveBeenCalledTimes(1);
      expect(helpers.readDirAsync).toHaveBeenLastCalledWith(context.buildDir);

      expect(helpers.copyFileAsync).toHaveBeenCalledTimes(3);
      expect(copyFileSpy.calls.all()[0].args[0]).toEqual(join(context.buildDir, '0.js.map'));
      expect(copyFileSpy.calls.all()[0].args[1]).toEqual(join(context.sourcemapDir, '0.js.map'));
      expect(copyFileSpy.calls.all()[1].args[0]).toEqual(join(context.buildDir, '1.js.map'));
      expect(copyFileSpy.calls.all()[1].args[1]).toEqual(join(context.sourcemapDir, '1.js.map'));
      expect(copyFileSpy.calls.all()[2].args[0]).toEqual(join(context.buildDir, 'main.js.map'));
      expect(copyFileSpy.calls.all()[2].args[1]).toEqual(join(context.sourcemapDir, 'main.js.map'));

      expect(helpers.unlinkAsync).toHaveBeenCalledTimes(5);
      expect(unlinkFileSpy.calls.all()[0].args[0]).toEqual(join(context.buildDir, '0.js.map'));
      expect(unlinkFileSpy.calls.all()[1].args[0]).toEqual(join(context.buildDir, '1.js.map'));
      expect(unlinkFileSpy.calls.all()[2].args[0]).toEqual(join(context.buildDir, 'main.js.map'));
      expect(unlinkFileSpy.calls.all()[3].args[0]).toEqual(join(context.buildDir, 'vendor.js.map'));
      expect(unlinkFileSpy.calls.all()[4].args[0]).toEqual(join(context.buildDir, 'main.css.map'));
    });

    it('should copy the files but not purge them after', async () => {
      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.callFake((argument: string) => {
        if (argument === Constants.ENV_VAR_MOVE_SOURCE_MAPS) {
          return true;
        }
      });

      spyOn(helpers, helpers.mkDirpAsync.name).and.returnValue(Promise.resolve());

      const knownFileNames = ['0.js', '0.js.map', '1.js', '1.js.map', 'main.js', 'main.js.map', 'vendor.js', 'vendor.js.map', 'main.css', 'polyfills.js', 'sw-toolbox.js', 'main.css', 'main.css.map'];

      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(knownFileNames));

      const context = {
        sourcemapDir: join(process.cwd(), 'sourceMapDir'),
        buildDir: join(process.cwd(), 'www', 'build')
      };

      const copyFileSpy = spyOn(helpers, helpers.copyFileAsync.name).and.returnValue(Promise.resolve());
      const unlinkFileSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      const result = await sourceMaps.copySourcemaps(context, false);
      expect(helpers.mkDirpAsync).toHaveBeenCalledTimes(1);
      expect(helpers.mkDirpAsync).toHaveBeenCalledWith(context.sourcemapDir);

      expect(helpers.readDirAsync).toHaveBeenCalledTimes(1);
      expect(helpers.readDirAsync).toHaveBeenLastCalledWith(context.buildDir);

      expect(helpers.copyFileAsync).toHaveBeenCalledTimes(3);
      expect(copyFileSpy.calls.all()[0].args[0]).toEqual(join(context.buildDir, '0.js.map'));
      expect(copyFileSpy.calls.all()[0].args[1]).toEqual(join(context.sourcemapDir, '0.js.map'));
      expect(copyFileSpy.calls.all()[1].args[0]).toEqual(join(context.buildDir, '1.js.map'));
      expect(copyFileSpy.calls.all()[1].args[1]).toEqual(join(context.sourcemapDir, '1.js.map'));
      expect(copyFileSpy.calls.all()[2].args[0]).toEqual(join(context.buildDir, 'main.js.map'));
      expect(copyFileSpy.calls.all()[2].args[1]).toEqual(join(context.sourcemapDir, 'main.js.map'));

      expect(helpers.unlinkAsync).toHaveBeenCalledTimes(0);
    });
  });
});
