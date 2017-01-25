import { FileCache } from '../util/file-cache';
import { BuildContext } from '../util/interfaces';
import { dirname, join, resolve } from 'path';
import { resolveId } from './ionic-rollup-resolver-plugin';

const importer = '/Users/dan/Dev/ionic-conference-app/src/app/app.module.ts';

describe('ion-rollup-resolver', () => {

  describe('resolveId', () => {

    it('should return null when given an undefined/null import', () => {
      // arrange
      // no arrange needed
      // act
      const result = resolveId(null, '', null);

      // assert
      expect(result).toEqual(null);
    });

    it('should return null when tsfiles is undefined/null', () => {
      // arrange
      let context: BuildContext = {};
      context.fileCache = null;

      // act
      const result = resolveId('importee', importer, context);

      // assert
      expect(result).toEqual(null);
    });

    it('should return null when importer is not found in list of files', () => {
      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();

      // act
      const result = resolveId('importee', importer, context);

      // assert
      expect(result).toEqual(null);
    });

    it('should return null when importer content is null', () => {
      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: null
      });

      // act
      const result = resolveId('importee', importer, context);

      // assert
      expect(result).toEqual(null);
    });

    it('should return null when importer content is empty', () => {
      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: ''
      });

      // act
      const result = resolveId('importee', importer, context);

      // assert
      expect(result).toEqual(null);
    });

    it('should return path to file when file is found with ref to forward dir', () => {
      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: 'fake irrelevant data'
      });

      const importee = './test-folder';
      const importerBasename = dirname(importer);
      const importeeFullPath = resolve(join(importerBasename, importee)) + '.ts';

       context.fileCache.set(importeeFullPath, {
         path: importeeFullPath,
         content: 'someContent'
       });

      // act
      const result = resolveId(importee, importer, context);

      // assert
      expect(result).toEqual(importeeFullPath);
    });

    it('should return path to file when file is found with ref to backward dir', () => {

      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: 'fake irrelevant data'
      });

      const importee = '../pages/test-folder';
      const importerBasename = dirname(importer);
      const importeeFullPath = resolve(join(importerBasename, importee)) + '.ts';

      context.fileCache.set(importeeFullPath, { path: importeeFullPath, content: null});

      // act
      const result = resolveId(importee, importer, context);

      // assert
      expect(result).toEqual(importeeFullPath);
    });

    it('should return path to index file when file is found but index file is for forward path', () => {

      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: 'fake irrelevant data'
      });

      const importee = './test-folder';
      const importerBasename = dirname(importer);
      const importeeFullPath = join(resolve(join(importerBasename, importee)), 'index.ts');

      context.fileCache.set(importeeFullPath, { path: importeeFullPath, content: null });

      // act
      const result = resolveId(importee, importer, context);

      // assert
      expect(result).toEqual(importeeFullPath);
    });

    it('should return path to index file when file is found but index file is for backward path', () => {

      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: 'fake irrelevant data'
      });

      const importee = '../pages/test-folder';
      const importerBasename = dirname(importer);
      const importeeFullPath = join(resolve(join(importerBasename, importee)), 'index.ts');

      context.fileCache.set(importeeFullPath, { path: importeeFullPath, content: null});

      // act
      const result = resolveId(importee, importer, context);

      // assert
      expect(result).toEqual(importeeFullPath);
    });

    it('should return null when importee isn\'t found in memory', () => {
      // arrange
      let context: BuildContext = {};
      context.fileCache = new FileCache();
      context.fileCache.set(importer, {
        path: importer,
        content: 'fake irrelevant data'
      });

      const importee = '../pages/test-folder';

      // act
      const result = resolveId(importee, importer, context);

      // assert
      expect(result).toEqual(null);
    });
  });
});
