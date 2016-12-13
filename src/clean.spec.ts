import * as fs from 'fs-extra';
import * as clean from './clean';

describe('clean task', () => {

  describe('clean', () => {
    it('should empty the build directory', async (done: Function) => {
      // arrage
      spyOn(fs, fs.emptyDirSync.name).and.returnValue('hurray');
      const context = { buildDir: 'something' };

      // act
      const result = clean.clean(context);

      // assert
      await result;
      expect(fs.emptyDirSync).toHaveBeenCalledWith(context.buildDir);
      done();
    });

    it('should throw when failing to empty dir', (done: Function) => {
      // arrage
      spyOn(fs, fs.emptyDirSync.name).and.throwError('Simulating an error');
      const context = { buildDir: 'something' };

      // act
      let error: Error = null;
      try {
        clean.clean(context);
      } catch (ex) {
        error = ex;
      }

      // assert
      expect(error).toBeTruthy('Error is null');
      expect(error instanceof Error).toBe(true, 'Error is not an instance of type Error');
      expect(typeof error.message).toBe('string', 'error.message is not a string');
      done();
    });
  });
});