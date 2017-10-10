import { join } from 'path';
import * as preprocess from './preprocess';
import * as deeplink from './deep-linking';
import * as helpers from './util/helpers';
import * as globUtil from './util/glob-util';

describe('Preprocess Task', () => {
  describe('preprocess', () => {
    it('should call deepLink but not write files to disk', () => {
      // arrange
      const context = {
        optimizeJs: false
      };

      const mockDirName = join('some', 'fake', 'dir');
      const mockGlobResults = [];
      mockGlobResults.push({ absolutePath: mockDirName});
      mockGlobResults.push({ absolutePath: mockDirName + '2'});
      spyOn(deeplink, deeplink.deepLinking.name).and.returnValue(Promise.resolve());
      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(mockDirName);
      spyOn(globUtil, globUtil.globAll.name).and.returnValue(Promise.resolve(mockGlobResults));

      // act
      return preprocess.preprocess(context);
    });
  });
});
