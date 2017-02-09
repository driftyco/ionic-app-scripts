import * as optimization from './optimization';
import * as decorators from './optimization/decorators';
import * as treeshake from './optimization/treeshake';
import * as helpers from './util/helpers';

import { FileCache } from './util/file-cache';

describe('optimization task', () => {
  describe('processStatsImpl', () => {
    it('should convert object graph to known module map', () => {
      // arrange
      const moduleOne = '/Users/dan/myModuleOne.js';
      const moduleTwo = '/Users/dan/myModuleTwo.js';
      const moduleThree = '/Users/dan/myModuleThree.js';
      const moduleFour = '/Users/dan/myModuleFour.js';
      const objectGraph: any = {
        modules: [
          {
            identifier: moduleOne,
            reasons: [
              {
                moduleIdentifier: moduleTwo
              },
              {
                moduleIdentifier: moduleThree
              }
            ]
          },
          {
            identifier: moduleTwo,
            reasons: [
              {
                moduleIdentifier: moduleThree
              }
            ]
          },
          {
            identifier: moduleThree,
            reasons: [
              {
                moduleIdentifier: moduleOne
              }
            ]
          },
          {
            identifier: moduleFour,
            reasons: []
          }
        ]
      };
      // act
      const result = optimization.processStatsImpl(objectGraph);

      // assert
      const setOne = result.get(moduleOne);
      expect(setOne.has(moduleTwo)).toBeTruthy();
      expect(setOne.has(moduleThree)).toBeTruthy();

      const setTwo = result.get(moduleTwo);
      expect(setTwo.has(moduleThree)).toBeTruthy();

      const setThree = result.get(moduleThree);
      expect(setThree.has(moduleOne)).toBeTruthy();

      const setFour = result.get(moduleFour);
      expect(setFour.size).toEqual(0);
    });
  });

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
