import { join } from 'path';
import * as Constants from './constants';
import * as sourceMaps from './source-maps';
import * as helpers from './helpers';

describe('source maps', () => {
  describe('purgeSourceMapsIfNeeded', () => {
    it('should return a promise call unlink on all files with a .map extensin', () => {
      // arrange
      let env: any = {};
      env[Constants.ENV_VAR_GENERATE_SOURCE_MAP] = null;
      process.env = env;
      const buildDir = '/some/fake/build/dir';
      const context = { buildDir: buildDir };

      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(['test.js', 'test.js.map', 'test2.js', 'test2.js.map']));
      const unlinkSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      // act
      const resultPromise = sourceMaps.purgeSourceMapsIfNeeded(context);

      // assert
      return resultPromise.then(() => {
        expect(unlinkSpy.calls.argsFor(0)[0]).toEqual(join(buildDir, 'test.js.map'));
        expect(unlinkSpy.calls.argsFor(1)[0]).toEqual(join(buildDir, 'test2.js.map'));
      });
    });
  });
});
