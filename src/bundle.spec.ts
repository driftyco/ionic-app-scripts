import * as bundle from './bundle';
import * as rollup from './rollup';
import * as webpack from './webpack';
import * as Constants from './util/constants';
import { ChangedFile } from './util/interfaces';

describe('bundle task', () => {

  describe('bundle', () => {
    it('should return the value rollup task returns', () => {
      // arrange
      spyOn(rollup, rollup.rollup.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_ROLLUP};

      // act
      return bundle.bundle(context).then(() => {
        // assert
        expect(rollup.rollup).toHaveBeenCalled();
      });
    });

    it('should throw when rollup throws', () => {
      const errorText = 'simulating an error';
      // arrange
      spyOn(rollup, rollup.rollup.name).and.returnValue(Promise.reject(new Error(errorText)));
      const context = { bundler: Constants.BUNDLER_ROLLUP};

      // act
      return bundle.bundle(context).then(() => {
        throw new Error('Should never happen');
      }).catch(err => {
        // assert
        expect(rollup.rollup).toHaveBeenCalled();
        expect(err.message).toBe(errorText);
      });
    });

    it('should return the value webpack task returns', () => {
      // arrange
      spyOn(webpack, webpack.webpack.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_WEBPACK};

      // act
      return bundle.bundle(context).then(() => {
        // assert
        expect(webpack.webpack).toHaveBeenCalled();
      });
    });

    it('should throw when rollup throws', () => {
      const errorText = 'simulating an error';
      // arrange
      spyOn(webpack, webpack.webpack.name).and.returnValue(Promise.reject(new Error(errorText)));
      const context = { bundler: Constants.BUNDLER_WEBPACK};

      // act
      return bundle.bundle(context).then(() => {
        throw new Error('Should never happen');
      }).catch(err => {
        // assert
        expect(webpack.webpack).toHaveBeenCalled();
        expect(err.message).toBe(errorText);
      });
    });
  });

  describe('bundleUpdate', () => {
    it('should return the value rollup returns', () => {
      // arrange
      spyOn(rollup, rollup.rollupUpdate.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_ROLLUP};
      const changedFiles: ChangedFile[] = [];

      // act
      return bundle.bundleUpdate(changedFiles, context).then(() => {
        // assert
        expect(rollup.rollupUpdate).toHaveBeenCalledWith(changedFiles, context);
      });
    });

    it('should throw when rollup throws', () => {
      const errorText = 'simulating an error';
      // arrange
      spyOn(rollup, rollup.rollupUpdate.name).and.returnValue(Promise.reject(new Error(errorText)));
      const context = { bundler: Constants.BUNDLER_ROLLUP};
      const changedFiles: ChangedFile[] = [];

      // act
      return bundle.bundleUpdate(changedFiles, context).then(() => {
        throw new Error('Should never happen');
      }).catch(err => {
        // assert
        expect(rollup.rollupUpdate).toHaveBeenCalled();
        expect(err.message).toBe(errorText);
      });
    });

    it('should return the value webpack returns', () => {
      // arrange
      spyOn(webpack, webpack.webpackUpdate.name).and.returnValue(Promise.resolve());
      const context = { bundler: Constants.BUNDLER_WEBPACK};
      const changedFiles: ChangedFile[] = [];

      // act
      return bundle.bundleUpdate(changedFiles, context).then(() => {
        // assert
        expect(webpack.webpackUpdate).toHaveBeenCalledWith(changedFiles, context);
      });
    });

    it('should throw when webpack throws', () => {
      const errorText = 'simulating an error';
      try {
        // arrange
        spyOn(webpack, webpack.webpackUpdate.name).and.returnValue(Promise.reject(new Error(errorText)));
        const context = { bundler: Constants.BUNDLER_WEBPACK};
        const changedFiles: ChangedFile[] = [];

        // act
        return bundle.bundleUpdate(changedFiles, context).then(() => {
          throw new Error('Should never happen');
        }).catch(err => {
          // assert
          expect(webpack.webpackUpdate).toHaveBeenCalled();
          expect(err.message).toBe(errorText);
        });

      } catch (ex) {

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
      expect(result).toEqual(config.sourceMap);
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
      expect(result).toEqual(false);
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
      expect(result).toEqual(true);
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
      expect(result).toEqual(returnValue);
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
      expect(result).toEqual(returnValue);
    });
  });
});
