import * as transpile from './transpile';

import { FileCache } from './util/file-cache';
import { BuildContext } from './util/interfaces';

describe('transpile', () => {
  describe('resetSourceFiles', () => {
    it('should remove any files with temporary suffix, and reset content to the original, non-modified value', () => {
      const context = {
        fileCache: new FileCache()
      };

      const aboutFilePath = 'about.ts';
      const aboutFile = { path: aboutFilePath, content: 'modifiedContent'};
      const originalAboutFilePath = aboutFilePath + transpile.inMemoryFileCopySuffix;
      const originalAboutFile = { path: originalAboutFilePath, content: 'originalContent'};
      context.fileCache.set(aboutFilePath, aboutFile);
      context.fileCache.set(originalAboutFilePath, originalAboutFile);

      transpile.resetSourceFiles(context.fileCache);

      expect(context.fileCache.get(originalAboutFilePath)).toBeFalsy();
      expect(context.fileCache.get(aboutFilePath).content).toEqual(originalAboutFile.content);
    });
  });
});
