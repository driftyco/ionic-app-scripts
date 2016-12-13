import * as bundle from './bundle';
import * as rollup from './rollup';
import * as webpack from './webpack';
import * as Constants from './util/constants';
import { ChangedFile } from './util/interfaces';

describe('bundle task', () => {

  describe('bundle', () => {
    it('should return the value rollup task returns', async (done: Function) => {
      // arrange
      spyOn(rollup, rollup.rollup.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_ROLLUP};

      // act
      await bundle.bundle(context);

      // assert
      expect(rollup.rollup).toHaveBeenCalled();
      done();
    });

    it('should throw when rollup throws', async (done: Function) => {
      const errorText = 'simulating an error';
      try {
        // arrange
        spyOn(rollup, rollup.rollup.name).and.throwError(errorText);
        const context = { bundler: Constants.BUNDLER_ROLLUP};

        // act
        await bundle.bundle(context);
        throw new Error('Should never happen');
      } catch (ex) {
         // assert
        expect(rollup.rollup).toHaveBeenCalled();
        expect(ex.message).toBe(errorText, `Received ${ex.message} instead of expected ${errorText}`);
        done();
      }
    });

    it('should return the value webpack task returns', async (done: Function) => {
      // arrange
      spyOn(webpack, webpack.webpack.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_WEBPACK};

      // act
      await bundle.bundle(context);

      // assert
      expect(webpack.webpack).toHaveBeenCalled();
      done();
    });

    it('should throw when rollup throws', async (done: Function) => {
      const errorText = 'simulating an error';
      try {
        // arrange
        spyOn(webpack, webpack.webpack.name).and.throwError(errorText);
        const context = { bundler: Constants.BUNDLER_WEBPACK};

        // act
        await bundle.bundle(context);
        throw new Error('Should never happen');
      } catch (ex) {
         // assert
        expect(webpack.webpack).toHaveBeenCalled();
        expect(ex.message).toBe(errorText, `Received ${ex.message} instead of expected ${errorText}`);
        done();
      }
    });
  });

  describe('bundleUpdate', () => {
    it('should return the value rollup returns', async (done: Function) => {
      // arrange
      spyOn(rollup, rollup.rollupUpdate.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_ROLLUP};
      const changedFiles: ChangedFile[] = [];

      // act
      await bundle.bundleUpdate(changedFiles, context);

      // assert
      expect(rollup.rollupUpdate).toHaveBeenCalledWith(changedFiles, context);
      done();
    });

    it('should throw when rollup throws', async (done: Function) => {
      const errorText = 'simulating an error';
      try {
        // arrange
        spyOn(rollup, rollup.rollupUpdate.name).and.throwError(errorText);
        const context = { bundler: Constants.BUNDLER_ROLLUP};
        const changedFiles: ChangedFile[] = [];

        // act
        await bundle.bundleUpdate(changedFiles, context);
        throw new Error('Should never happen');
      } catch (ex) {
         // assert
        expect(rollup.rollupUpdate).toHaveBeenCalled();
        expect(ex.message).toBe(errorText, `Received ${ex.message} instead of expected ${errorText}`);
        done();
      }
    });

    it('should return the value webpack returns', async (done: Function) => {
      // arrange
      spyOn(webpack, webpack.webpackUpdate.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_WEBPACK};
      const changedFiles: ChangedFile[] = [];

      // act
      await bundle.bundleUpdate(changedFiles, context);

      // assert
      expect(webpack.webpackUpdate).toHaveBeenCalledWith(changedFiles, context);
      done();
    });

    it('should throw when webpack throws', async (done: Function) => {
      const errorText = 'simulating an error';
      try {
        // arrange
        spyOn(webpack, webpack.webpackUpdate.name).and.throwError(errorText);
        const context = { bundler: Constants.BUNDLER_WEBPACK};
        const changedFiles: ChangedFile[] = [];

        // act
        await bundle.bundleUpdate(changedFiles, context);
        throw new Error('Should never happen');
      } catch (ex) {
         // assert
        expect(webpack.webpackUpdate).toHaveBeenCalled();
        expect(ex.message).toBe(errorText, `Received ${ex.message} instead of expected ${errorText}`);
        done();
      }
    });
  });

  describe('buildJsSourceMaps', () => {
    it('should get the value from the rollup config', () => {
      // arrange
      const config = {
        sourceMap: true
      };
      spyOn(rollup, rollup.getRollupConfig.name).and.returnValue(config);
      const context = { bundler: Constants.BUNDLER_ROLLUP};
      // act
      const result = bundle.buildJsSourceMaps(context);

      // assert
      expect(rollup.getRollupConfig).toHaveBeenCalledWith(context, null);
      expect(result).toEqual(config.sourceMap, `Expected result ${result} to equal ${config.sourceMap}`);
    });

    it('should get false when devtool is null for webpack', () => {
      // arrange
      const config = { };
      spyOn(webpack, webpack.getWebpackConfig.name).and.returnValue(config);
      const context = { bundler: Constants.BUNDLER_WEBPACK};
      // act
      const result = bundle.buildJsSourceMaps(context);

      // assert
      expect(webpack.getWebpackConfig).toHaveBeenCalledWith(context, null);
      expect(result).toEqual(false, `Expected result ${result} to equal false`);
    });

    it('should get false when devtool is valid', () => {
      // arrange
      const config = { devtool: 'someValue'};
      spyOn(webpack, webpack.getWebpackConfig.name).and.returnValue(config);
      const context = { bundler: Constants.BUNDLER_WEBPACK};
      // act
      const result = bundle.buildJsSourceMaps(context);

      // assert
      expect(webpack.getWebpackConfig).toHaveBeenCalledWith(context, null);
      expect(result).toEqual(true, `Expected result ${result} to equal true`);
    });
  });

  describe('getJsOutputDest', () => {
    it('should get the value from rollup', () => {
      // arrange
      const config = { };
      const returnValue = 'someString';
      spyOn(rollup, rollup.getRollupConfig.name).and.returnValue(config);
      spyOn(rollup, rollup.getOutputDest.name).and.returnValue(returnValue);
      const context = { bundler: Constants.BUNDLER_ROLLUP};
      // act
      const result = bundle.getJsOutputDest(context);

      // assert
      expect(rollup.getRollupConfig).toHaveBeenCalledWith(context, null);
      expect(rollup.getOutputDest).toHaveBeenCalledWith(context, config);
      expect(result).toEqual(returnValue, `Expected result ${result} to equal ${returnValue}`);
    });

    it('should get the value from webpack', () => {
      // arrange
      const returnValue = 'someString';
      spyOn(webpack, webpack.getOutputDest.name).and.returnValue(returnValue);
      const context = { bundler: Constants.BUNDLER_WEBPACK};
      // act
      const result = bundle.getJsOutputDest(context);

      // assert
      expect(webpack.getOutputDest).toHaveBeenCalledWith(context);
      expect(result).toEqual(returnValue, `Expected result ${result} to equal ${returnValue}`);
    });
  });
});
