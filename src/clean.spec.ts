import * as fs from 'fs-extra';
import * as clean from './clean';

describe('clean task', () => {

  describe('clean', () => {
    it('should empty the build directory', () => {
      // arrage
      spyOn(fs, fs.emptyDirSync.name).and.returnValue('things');
      const context = { buildDir: 'something' };

      // act
      return clean.clean(context).then(() => {
        // assert
        expect(fs.emptyDirSync).toHaveBeenCalledWith(context.buildDir);
      });
    });

    it('should throw when failing to empty dir', () => {
      // arrage
      spyOn(fs, fs.emptyDirSync.name).and.throwError('Simulating an error');
      const context = { buildDir: 'something' };

      // act
      return clean.clean(context).catch((ex) => {
        expect(ex instanceof Error).toBe(true);
        expect(typeof ex.message).toBe('string');
      });
    });
  });
});
