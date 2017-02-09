import * as optimization from './optimization';
import * as decorators from './optimization/decorators';
import * as treeshake from './optimization/treeshake';
import * as helpers from './util/helpers';

import { FileCache } from './util/file-cache';

describe('optimization task', () => {
  describe('doOptimizations', () => {
    it('should not run optimizations unless flags are set', () => {
      // arrange
      const fileCache = new FileCache();
      fileCache.set('somePath', { path: 'somePath', content: 'someContent'});
      const context = {
        fileCache: fileCache
      };

      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);
      spyOn(decorators, decorators.purgeDecorators.name);
      spyOn(treeshake, treeshake.calculateUnusedComponents.name);

      // act
      const result = optimization.doOptimizations(context, new Map());

      // assert
      expect(result).toBeTruthy();
      expect(decorators.purgeDecorators).not.toHaveBeenCalled();
      expect(treeshake.calculateUnusedComponents).not.toHaveBeenCalled();
    });
  });
});
