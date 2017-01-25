import *  as lint from './lint';
import * as workerClient from './worker-client';
import * as Constants from './util/constants';

let originalEnv = process.env;

describe('lint task', () => {
  describe('lint', () => {

    beforeEach(() => {
      originalEnv = process.env;
      process.env = {};
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('Should return resolved promise', (done: Function) => {
      // arrange
      spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.resolve());
      // act
      const promise = lint.lint(null);

      // assert
      promise.then(() => {
        done();
      });
    });

    it('Should return resolved promise when bail on error is not set', (done: Function) => {
      // arrange
      spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error('Simulating an error')));
      // act
      const promise = lint.lint(null);

      // assert
      promise.then(() => {
        done();
      });
    });

    it('Should return rejected promise when bail on error is set', (done: Function) => {

      spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error('Simulating an error')));
      process.env[Constants.ENV_BAIL_ON_LINT_ERROR] = 'true';

      // act
      const promise = lint.lint(null);

      // assert
      promise.catch(() => {
        done();
      });
    });
  });
});
