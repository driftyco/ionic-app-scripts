import { join } from 'path';

import * as webpack from './webpack';
import { FileCache } from './util/file-cache';
import * as helpers from './util/helpers';

describe('Webpack Task', () => {
  describe('writeBundleFilesToDisk', () => {
    it('should write all build artifacts to disk except css', () => {
      const appDir = join('some', 'fake', 'dir', 'myApp');
      const buildDir = join(appDir, 'www', 'build');

      const context = {
        fileCache: new FileCache(),
        buildDir: buildDir
      };

      const fileOnePath = join(buildDir, 'main.js');
      const fileTwoPath = join(buildDir, 'main.js.map');
      const fileThreePath = join(buildDir, '0.main.js');
      const fileFourPath = join(buildDir, '0.main.js.map');
      const fileFivePath = join(buildDir, '1.main.js');
      const fileSixPath = join(buildDir, '1.main.js.map');
      const fileSevenPath = join(appDir, 'pages', 'page-one.ts');
      const fileEightPath = join(appDir, 'pages', 'page-one.js');
      const fileNinePath = join(buildDir, 'main.css');
      const fileTenPath = join(buildDir, 'main.css.map');
      const fileElevenPath = join(buildDir, 'secondary.css');
      const fileTwelvePath = join(buildDir, 'secondary.css.map');

      context.fileCache.set(fileOnePath, { path: fileOnePath, content: fileOnePath + 'content'});
      context.fileCache.set(fileTwoPath, { path: fileTwoPath, content: fileTwoPath + 'content'});
      context.fileCache.set(fileThreePath, { path: fileThreePath, content: fileThreePath + 'content'});
      context.fileCache.set(fileFourPath, { path: fileFourPath, content: fileFourPath + 'content'});
      context.fileCache.set(fileFivePath, { path: fileFivePath, content: fileFivePath + 'content'});
      context.fileCache.set(fileSixPath, { path: fileSixPath, content: fileSixPath + 'content'});
      context.fileCache.set(fileSevenPath, { path: fileSevenPath, content: fileSevenPath + 'content'});
      context.fileCache.set(fileEightPath, { path: fileEightPath, content: fileEightPath + 'content'});
      context.fileCache.set(fileNinePath, { path: fileNinePath, content: fileNinePath + 'content'});
      context.fileCache.set(fileTenPath, { path: fileTenPath, content: fileTenPath + 'content'});
      context.fileCache.set(fileElevenPath, { path: fileElevenPath, content: fileElevenPath + 'content'});
      context.fileCache.set(fileTwelvePath, { path: fileTwelvePath, content: fileTwelvePath + 'content'});

      const writeFileSpy = spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());

      const promise = webpack.writeBundleFilesToDisk(context);

      return promise.then(() => {
        expect(writeFileSpy).toHaveBeenCalledTimes(6);
        expect(writeFileSpy.calls.all()[0].args[0]).toEqual(fileOnePath);
        expect(writeFileSpy.calls.all()[0].args[1]).toEqual(fileOnePath + 'content');

        expect(writeFileSpy.calls.all()[1].args[0]).toEqual(fileTwoPath);
        expect(writeFileSpy.calls.all()[1].args[1]).toEqual(fileTwoPath + 'content');

        expect(writeFileSpy.calls.all()[2].args[0]).toEqual(fileThreePath);
        expect(writeFileSpy.calls.all()[2].args[1]).toEqual(fileThreePath + 'content');

        expect(writeFileSpy.calls.all()[3].args[0]).toEqual(fileFourPath);
        expect(writeFileSpy.calls.all()[3].args[1]).toEqual(fileFourPath + 'content');

        expect(writeFileSpy.calls.all()[4].args[0]).toEqual(fileFivePath);
        expect(writeFileSpy.calls.all()[4].args[1]).toEqual(fileFivePath + 'content');

        expect(writeFileSpy.calls.all()[5].args[0]).toEqual(fileSixPath);
        expect(writeFileSpy.calls.all()[5].args[1]).toEqual(fileSixPath + 'content');
      });
    });

    it('should preprend ionic core info', () => {
      const appDir = join('some', 'fake', 'dir', 'myApp');
      const buildDir = join(appDir, 'www', 'build');

      const context = {
        fileCache: new FileCache(),
        buildDir: buildDir,
        outputJsFileName: 'main.js'
      };

      const fileOnePath = join(buildDir, 'main.js');
      const fileTwoPath = join(buildDir, 'main.js.map');

      context.fileCache.set(fileOnePath, { path: fileOnePath, content: fileOnePath + 'content'});
      context.fileCache.set(fileTwoPath, { path: fileTwoPath, content: fileTwoPath + 'content'});

      const writeFileSpy = spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());

      const promise = webpack.writeBundleFilesToDisk(context);

      return promise.then(() => {
        expect(writeFileSpy).toHaveBeenCalledTimes(2);

        expect(writeFileSpy.calls.all()[0].args[0]).toEqual(fileOnePath);

        expect(writeFileSpy.calls.all()[1].args[0]).toEqual(fileTwoPath);
      });
    });
  });
});
