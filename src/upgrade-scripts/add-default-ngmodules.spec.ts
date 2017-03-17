import * as fs from 'fs';
import { join } from 'path';

import * as upgradeScript from './add-default-ngmodules';
import * as deeplinkUtils from '../deep-linking/util';
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

  describe('generateAndWriteNgModules', () => {
    it('should generate NgModules for only the pages with deeplink decorator AND if the module.ts file doesnt exist', () => {
      const srcDirectory = join('Users', 'noone', 'this', 'path', 'is', 'fake', 'src');
      const knownFileOne = join(srcDirectory, 'pages', 'page-one', 'page-one.ts');
      const knownFileTwo = join(srcDirectory, 'pages', 'page-two', 'page-two.ts');
      const knownFileThree = join(srcDirectory, 'pages', 'page-three', 'page-three.ts');
      const knownFileThreeModule = join(srcDirectory, 'pages', 'page-three', 'page-three.module.ts');
      const knownFileFour = join(srcDirectory, 'util', 'some-util.ts');
      const knownFileFive = join(srcDirectory, 'pages', 'page-three', 'provider.ts');
      const knownFileSix = join(srcDirectory, 'modals', 'modal-one', 'modal-one.ts');

      const context = {
        fileCache: new FileCache()
      };

      context.fileCache.set(knownFileOne, { path: knownFileOne, content: getClassContent('PageOne', 'page-one')});
      context.fileCache.set(knownFileTwo, { path: knownFileTwo, content: getClassContent('PageTwo', 'page-two')});
      context.fileCache.set(knownFileThree, { path: knownFileThree, content: getClassContent('PageThree', 'page-three')});
      context.fileCache.set(knownFileThreeModule, { path: knownFileThreeModule, content: deeplinkUtils.generateDefaultDeepLinkNgModuleContent(knownFileThree, 'PageThree')});
      context.fileCache.set(knownFileFour, { path: knownFileFour, content: `${knownFileFour} content`});
      context.fileCache.set(knownFileFive, { path: knownFileFive, content: `${knownFileFive} content`});
      context.fileCache.set(knownFileSix, { path: knownFileSix, content: getClassContent('ModalOne', 'modal-one')});

      const ngModuleFileExtension = '.module.ts';

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(ngModuleFileExtension);
      const fsSpy = spyOn(fs, 'writeFileSync');

      upgradeScript.generateAndWriteNgModules(context.fileCache);

      expect(fsSpy.calls.count()).toEqual(3);
      expect(fsSpy.calls.argsFor(0)[0]).toEqual(helpers.changeExtension(knownFileOne, ngModuleFileExtension));
      expect(fsSpy.calls.argsFor(0)[1]).toEqual(deeplinkUtils.generateDefaultDeepLinkNgModuleContent(knownFileOne, 'PageOne'));

      expect(fsSpy.calls.argsFor(1)[0]).toEqual(helpers.changeExtension(knownFileTwo, ngModuleFileExtension));
      expect(fsSpy.calls.argsFor(1)[1]).toEqual(deeplinkUtils.generateDefaultDeepLinkNgModuleContent(knownFileTwo, 'PageTwo'));

      expect(fsSpy.calls.argsFor(2)[0]).toEqual(helpers.changeExtension(knownFileSix, ngModuleFileExtension));
      expect(fsSpy.calls.argsFor(2)[1]).toEqual(deeplinkUtils.generateDefaultDeepLinkNgModuleContent(knownFileSix, 'ModalOne'));
    });
  });
});

function getClassContent(className: string, folderName: string) {
  return `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';

@DeepLink()
@Component({
  selector: '${folderName}',
  templateUrl: './${folderName}.html'
})
export class ${className} {

  constructor(public navCtrl: NavController) {}

}
`;
}
