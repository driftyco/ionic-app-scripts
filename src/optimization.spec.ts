import { join } from 'path';

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
      fileCache.set('somePath', { path: 'somePath', content: 'someContent' });
      const context = {
        fileCache: fileCache
      };

      spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);
      spyOn(decorators, decorators.purgeStaticFieldDecorators.name);
      spyOn(decorators, decorators.purgeStaticCtorFields.name);
      spyOn(decorators, decorators.purgeTranspiledDecorators.name);
      spyOn(treeshake, treeshake.calculateUnusedComponents.name);

      // act
      const result = optimization.doOptimizations(context, new Map());

      // assert
      expect(result).toBeTruthy();
      expect(decorators.purgeStaticFieldDecorators).not.toHaveBeenCalled();
      expect(decorators.purgeStaticCtorFields).not.toHaveBeenCalled();
      expect(decorators.purgeTranspiledDecorators).not.toHaveBeenCalled();
      expect(treeshake.calculateUnusedComponents).not.toHaveBeenCalled();
    });
  });

  describe('purgeGeneratedFiles', () => {
    it('should remove files in buildDir with suffix from the cache', () => {
      const buildDir = join(process.cwd(), 'some', 'fake', 'dir', 'myApp', 'www', 'build');
      const context = {
        fileCache: new FileCache(),
        buildDir: buildDir
      };
      const suffix = 'deptree.js';
      const filePathOne = join(buildDir, `0.${suffix}`);
      const filePathTwo = join(buildDir, `1.${suffix}`);
      const filePathThree = join(buildDir, `main.js`);
      const filePathFour = join(buildDir, `main.css`);
      const filePathFive = join(process.cwd(), 'some', 'fake', 'dir', 'myApp', 'src', `app.ts`);
      const filePathSix = join(process.cwd(), 'some', 'fake', 'dir', 'myApp', 'src', `app.js`);
      const filePathSeven = join(process.cwd(), 'some', 'fake', 'dir', 'myApp', 'src', 'pages', `1.${suffix}`);
      context.fileCache.set(filePathOne, { path: filePathOne, content: filePathOne });
      context.fileCache.set(filePathTwo, { path: filePathTwo, content: filePathTwo });
      context.fileCache.set(filePathThree, { path: filePathThree, content: filePathThree });
      context.fileCache.set(filePathFour, { path: filePathFour, content: filePathFour });
      context.fileCache.set(filePathFive, { path: filePathFive, content: filePathFive });
      context.fileCache.set(filePathSix, { path: filePathSix, content: filePathSix });
      context.fileCache.set(filePathSeven, { path: filePathSeven, content: filePathSeven });

      optimization.purgeGeneratedFiles(context, suffix);

      expect(context.fileCache.getAll().length).toEqual(5);
      expect(context.fileCache.get(filePathOne)).toBeFalsy();
      expect(context.fileCache.get(filePathTwo)).toBeFalsy();
    });
  });
});
