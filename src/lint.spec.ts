import * as Constants from './util/constants';
import * as workerClient from './worker-client';
import { lint } from './lint';

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

    it('should return a resolved promise', (done: Function) => {
      spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.resolve());

      lint(null).then(() => {
        done();
      });
    });

    it('should return resolved promise when bailOnLintError is not set', (done: Function) => {
      spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error('Simulating an error')));

      lint(null).then(() => {
        done();
      });
    });

    it('should return rejected promise when bailOnLintError is set', (done: Function) => {
      spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error('Simulating an error')));
      process.env[Constants.ENV_BAIL_ON_LINT_ERROR] = 'true';

      lint(null).catch(() => {
        done();
      });
    });
  });
});
