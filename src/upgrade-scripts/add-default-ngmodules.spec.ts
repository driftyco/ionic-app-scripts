import { join } from 'path';

import * as upgradeScript from './add-default-ngmodules';
import { FileCache } from '../util/file-cache';
import * as globUtil from '../util/glob-util';
import * as helpers from '../util/helpers';

describe('add default ngmodules upgrade script', () => {
  describe('getTsFilePaths', () => {
    it('should return a list of absolute file paths', () => {
      const srcDirectory = join('Users', 'noone', 'this', 'path', 'is', 'fake', 'src');
      const context = {
        srcDir: srcDirectory
      };

      const knownFileOne = join(srcDirectory, 'pages', 'page-one', 'page-one.ts');
      const knownFileTwo = join(srcDirectory, 'pages', 'page-two', 'page-two.ts');
      const knownFileThree = join(srcDirectory, 'pages', 'page-three', 'page-three.ts');
      const knownFileFour = join(srcDirectory, 'util', 'some-util.ts');
      const globResults = [
                            { absolutePath: knownFileOne},
                            { absolutePath: knownFileTwo},
                            { absolutePath: knownFileThree},
                            { absolutePath: knownFileFour},
                          ];
      spyOn(globUtil, globUtil.globAll.name).and.returnValue(Promise.resolve(globResults));
      const promise = upgradeScript.getTsFilePaths(context);

      return promise.then((filePaths: string[]) => {
        expect(filePaths.length).toEqual(4);
        expect(filePaths[0]).toEqual(knownFileOne);
        expect(filePaths[1]).toEqual(knownFileTwo);
        expect(filePaths[2]).toEqual(knownFileThree);
        expect(filePaths[3]).toEqual(knownFileFour);
      });
    });
  });

  describe('readTsFiles', () => {
    it('should read the ts files', () => {
      const context = {
        fileCache: new FileCache()
      };
      const srcDirectory = join('Users', 'noone', 'this', 'path', 'is', 'fake', 'src');
      const knownFileOne = join(srcDirectory, 'pages', 'page-one', 'page-one.ts');
      const knownFileTwo = join(srcDirectory, 'pages', 'page-two', 'page-two.ts');
      const knownFileThree = join(srcDirectory, 'pages', 'page-three', 'page-three.ts');
      const knownFileFour = join(srcDirectory, 'util', 'some-util.ts');

      const fileList = [knownFileOne, knownFileTwo, knownFileThree, knownFileFour];

      spyOn(helpers, helpers.readFileAsync.name).and.callFake((filePath: string) => {
        // just set the file content to the path name + 'content' to keep things simple
        return Promise.resolve(filePath + 'content');
      });

      const promise = upgradeScript.readTsFiles(context, fileList);

      return promise.then(() => {
        // the files should be cached now
        const fileOne = context.fileCache.get(knownFileOne);
        expect(fileOne.content).toEqual(knownFileOne + 'content');

        const fileTwo = context.fileCache.get(knownFileTwo);
        expect(fileTwo.content).toEqual(knownFileTwo + 'content');

        const fileThree = context.fileCache.get(knownFileThree);
        expect(fileThree.content).toEqual(knownFileThree + 'content');

        const fileFour = context.fileCache.get(knownFileFour);
        expect(fileFour.content).toEqual(knownFileFour + 'content');

      });
    });
  });
});
