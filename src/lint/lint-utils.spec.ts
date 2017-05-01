import * as lintUtils from './lint-utils';
import * as lintFactory from './lint-factory';
import * as helpers from '../util/helpers';
import * as fs from 'fs';

import * as tsLintLogger from '../logger/logger-tslint';
import * as loggerDiagnostics from '../logger/logger-diagnostics';

describe('lint utils', () => {
  describe('lintFile', () => {
    it('should return lint details', () => {
      // arrange
      const mockLintResults: any = {
        failures: []
      };
      const mockLinter = {
        lint: () => {
          return mockLintResults;
        }
      };
      const filePath = '/Users/noone/someFile.ts';
      const fileContent = 'someContent';
      const mockProgram: any = {};
      spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));
      spyOn(lintFactory, lintFactory.getLinter.name).and.returnValue(mockLinter);
      spyOn(fs, 'openSync').and.returnValue(null);
      spyOn(fs, 'readSync').and.returnValue(null);
      spyOn(fs, 'closeSync').and.returnValue(null);
      // act

      const result = lintUtils.lintFile(null, mockProgram, filePath);

      // assert
      return result.then((result: lintUtils.LintResult) => {
        expect(result.filePath).toEqual(filePath);
        expect(result.failures).toEqual(mockLintResults.failures);
        expect(lintFactory.getLinter).toHaveBeenCalledWith(filePath, fileContent, mockProgram);
      });
    });
  });

  describe('processLintResults', () => {
    it('should complete when no files have an error', () => {
      // arrange
      const lintResults: any[] = [
        {
          failures: [],
          filePath: '/Users/myFileOne.ts'
        },
        {
          failures: [],
          filePath: '/Users/myFileTwo.ts'
        }
      ];

      // act
      lintUtils.processLintResults(null, lintResults);

      // assert

    });

    it('should throw an error when one or more file has failures', () => {
      // arrange

      spyOn(loggerDiagnostics, loggerDiagnostics.printDiagnostics.name).and.returnValue(null);
      spyOn(tsLintLogger, tsLintLogger.runTsLintDiagnostics.name).and.returnValue(null);
      const lintResults: any[] = [
        {
          failures: [
            {}
          ],
          filePath: '/Users/myFileOne.ts'
        },
        {
          failures: [
          ],
          filePath: '/Users/myFileTwo.ts'
        }
      ];
      const knownError = new Error('Should never get here');

      // act
      try {
        lintUtils.processLintResults(null, lintResults);
        throw knownError;
      } catch (ex) {
        expect(loggerDiagnostics.printDiagnostics).toHaveBeenCalledTimes(1);
        expect(loggerDiagnostics.printDiagnostics).toHaveBeenCalledTimes(1);
        expect(ex).not.toEqual(knownError);
      }
    });
  });
});
