import { join } from 'path';

import { removeUnusedFonts } from './remove-unused-fonts';
import * as helpers from '../util/helpers';

describe('Remove Fonts', () => {
  describe('removeUnusedFonts', () => {
    it('should not purge any fonts when target is not cordova', () => {
      const fakeFontDirPath = join(process.cwd(), 'www', 'assets', 'fonts');
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(fakeFontDirPath);
      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(getMockFontDirData()));
      spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      return removeUnusedFonts({ target: 'notCordova', platform: 'web' }).then(() => {
        expect(helpers.getStringPropertyValue).toHaveBeenCalled();
        expect(helpers.readDirAsync).toHaveBeenCalledWith(fakeFontDirPath);
        expect(helpers.unlinkAsync).not.toHaveBeenCalled();
      });
    });

    it('should purge all non-woffs for ionicons and roboto, and then all of noto-sans for ios', () => {
      const fakeFontDirPath = join(process.cwd(), 'www', 'assets', 'fonts');
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(fakeFontDirPath);
      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(getMockFontDirData()));
      const unlinkSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      return removeUnusedFonts({ target: 'cordova', platform: 'ios' }).then(() => {
        expect(helpers.readDirAsync).toHaveBeenCalledWith(fakeFontDirPath);
        expect(unlinkSpy.calls.all()[0].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.eot'));
        expect(unlinkSpy.calls.all()[1].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.scss'));
        expect(unlinkSpy.calls.all()[2].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.svg'));
        expect(unlinkSpy.calls.all()[3].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.ttf'));
        expect(unlinkSpy.calls.all()[4].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-bold.ttf'));
        expect(unlinkSpy.calls.all()[5].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-bold.woff'));
        expect(unlinkSpy.calls.all()[6].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-regular.ttf'));
        expect(unlinkSpy.calls.all()[7].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-regular.woff'));
        expect(unlinkSpy.calls.all()[8].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans.scss'));

        expect(unlinkSpy.calls.all()[9].args[0]).toEqual(join(fakeFontDirPath, 'roboto-bold.ttf'));
        expect(unlinkSpy.calls.all()[10].args[0]).toEqual(join(fakeFontDirPath, 'roboto-light.ttf'));
        expect(unlinkSpy.calls.all()[11].args[0]).toEqual(join(fakeFontDirPath, 'roboto-medium.ttf'));
        expect(unlinkSpy.calls.all()[12].args[0]).toEqual(join(fakeFontDirPath, 'roboto-regular.ttf'));
        expect(unlinkSpy.calls.all()[13].args[0]).toEqual(join(fakeFontDirPath, 'roboto.scss'));
      });
    });

    it('should purge all non-woffs for ionicons, all of roboto and noto-sans for android', () => {
      const fakeFontDirPath = join(process.cwd(), 'www', 'assets', 'fonts');
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(fakeFontDirPath);
      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(getMockFontDirData()));
      const unlinkSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      return removeUnusedFonts({ target: 'cordova', platform: 'android' }).then(() => {
        expect(helpers.readDirAsync).toHaveBeenCalledWith(fakeFontDirPath);
        expect(unlinkSpy.calls.all()[0].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.eot'));
        expect(unlinkSpy.calls.all()[1].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.scss'));
        expect(unlinkSpy.calls.all()[2].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.svg'));
        expect(unlinkSpy.calls.all()[3].args[0]).toEqual(join(fakeFontDirPath, 'ionicons.ttf'));
        expect(unlinkSpy.calls.all()[4].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-bold.ttf'));
        expect(unlinkSpy.calls.all()[5].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-bold.woff'));
        expect(unlinkSpy.calls.all()[6].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-regular.ttf'));
        expect(unlinkSpy.calls.all()[7].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans-regular.woff'));
        expect(unlinkSpy.calls.all()[8].args[0]).toEqual(join(fakeFontDirPath, 'noto-sans.scss'));

        expect(unlinkSpy.calls.all()[9].args[0]).toEqual(join(fakeFontDirPath, 'roboto-bold.ttf'));
        expect(unlinkSpy.calls.all()[10].args[0]).toEqual(join(fakeFontDirPath, 'roboto-bold.woff'));
        expect(unlinkSpy.calls.all()[11].args[0]).toEqual(join(fakeFontDirPath, 'roboto-bold.woff2'));
        expect(unlinkSpy.calls.all()[12].args[0]).toEqual(join(fakeFontDirPath, 'roboto-light.ttf'));
        expect(unlinkSpy.calls.all()[13].args[0]).toEqual(join(fakeFontDirPath, 'roboto-light.woff'));
        expect(unlinkSpy.calls.all()[14].args[0]).toEqual(join(fakeFontDirPath, 'roboto-light.woff2'));
        expect(unlinkSpy.calls.all()[15].args[0]).toEqual(join(fakeFontDirPath, 'roboto-medium.ttf'));
        expect(unlinkSpy.calls.all()[16].args[0]).toEqual(join(fakeFontDirPath, 'roboto-medium.woff'));
        expect(unlinkSpy.calls.all()[17].args[0]).toEqual(join(fakeFontDirPath, 'roboto-medium.woff2'));
        expect(unlinkSpy.calls.all()[18].args[0]).toEqual(join(fakeFontDirPath, 'roboto-regular.ttf'));
        expect(unlinkSpy.calls.all()[19].args[0]).toEqual(join(fakeFontDirPath, 'roboto-regular.woff'));
        expect(unlinkSpy.calls.all()[20].args[0]).toEqual(join(fakeFontDirPath, 'roboto-regular.woff2'));
        expect(unlinkSpy.calls.all()[21].args[0]).toEqual(join(fakeFontDirPath, 'roboto.scss'));

      });
    });

    it('should purge all non-woffs for ionicons, all of roboto and noto-sans for windows', () => {
      const fakeFontDirPath = join(process.cwd(), 'www', 'assets', 'fonts');
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(fakeFontDirPath);
      spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(getMockFontDirData()));
      const unlinkSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());

      return removeUnusedFonts({ target: 'cordova', platform: 'windows' }).then(() => {
        expect(helpers.readDirAsync).toHaveBeenCalledWith(fakeFontDirPath);
        expect(helpers.unlinkAsync).not.toHaveBeenCalled();
      });
    });
  });
});

function getMockFontDirData() {
  return [
    'ionicons.eot',
    'ionicons.scss',
    'ionicons.svg',
    'ionicons.ttf',
    'ionicons.woff',
    'ionicons.woff2',
    'noto-sans-bold.ttf',
    'noto-sans-bold.woff',
    'noto-sans-regular.ttf',
    'noto-sans-regular.woff',
    'noto-sans.scss',
    'roboto-bold.ttf',
    'roboto-bold.woff',
    'roboto-bold.woff2',
    'roboto-light.ttf',
    'roboto-light.woff',
    'roboto-light.woff2',
    'roboto-medium.ttf',
    'roboto-medium.woff',
    'roboto-medium.woff2',
    'roboto-regular.ttf',
    'roboto-regular.woff',
    'roboto-regular.woff2',
    'roboto.scss',
    'my-custom-font.eot',
    'my-custom-font.scss',
    'my-custom-font.svg',
    'my-custom-font.ttf',
    'my-custom-font.woff',
    'my-custom-font.woff2'
  ];
}
