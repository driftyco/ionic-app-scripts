import * as fs from 'fs';
import { LintResult } from 'tslint';
import { DiagnosticCategory } from 'typescript';
import * as helpers from '../util/helpers';
import * as loggerDiagnostics from '../logger/logger-diagnostics';
import * as tsLogger from '../logger/logger-typescript';
import * as tsLintLogger from '../logger/logger-tslint';
import * as linter from './lint-factory';
import * as utils from './lint-utils';


describe('lint utils', () => {
  describe('lintFile()', () => {
    it('should return lint details', () => {
      const filePath = 'test.ts';
      const fileContent = `
        export const foo = 'bar';
      `;
      const context: any = {};
      const linterOptions = {
        typeCheck: true
      };
      const mockLintResult: any = {
        errorCount: 0,
        warningCount: 0,
        failures: [],
        fixes: [],
        format: '',
        output: ''
      };

      spyOn(linter, linter.lint.name).and.returnValue(mockLintResult);

      // Mock the file read
      spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));
      spyOn(fs, 'openSync').and.returnValue(null);
      spyOn(fs, 'readSync').and.returnValue(null);
      spyOn(fs, 'closeSync').and.returnValue(null);

      return utils.lintFile(context, null, filePath, linterOptions)
        .then((result: LintResult) => {
          expect(result).toEqual(mockLintResult);
          expect(linter.lint)
            .toHaveBeenCalledWith(context, null, filePath, fileContent, linterOptions);
        });
    });
  });

  describe('processTypeCheckDiagnostics()', () => {
    it('should not throw an error when there are no files with errors or warnings', () => {
      utils.processTypeCheckDiagnostics({}, []);
    });

    it('should throw an error when one or more file has failures', () => {
      const knownError = new Error('Should never get here');
      const results: any[] = [
        {
          file: {},
          start: 0,
          length: 10,
          messageText: 'Something failed',
          category: DiagnosticCategory.Warning,
          code: 100
        }
      ];

      spyOn(tsLogger, tsLogger.runTypeScriptDiagnostics.name).and.returnValue(null);
      spyOn(loggerDiagnostics, loggerDiagnostics.printDiagnostics.name).and.returnValue(null);

      try {
        utils.processTypeCheckDiagnostics({}, results);
        throw knownError;
      } catch (e) {
        expect(loggerDiagnostics.printDiagnostics).toHaveBeenCalledTimes(1);
        expect(e).not.toEqual(knownError);
      }
    });
  });

  describe('processLintResults()', () => {
    it('should not throw an error when there are no files with errors or warnings', () => {
      utils.processLintResults({}, [
        {
          errorCount: 0,
          warningCount: 0,
          failures: [],
          fixes: [],
          format: '',
          output: ''
        }
      ]);
    });

    it('should throw an error when one or more file has failures', () => {
      const knownError = new Error('Should never get here');
      const results: any[] = [
        {
          errorCount: 1,
          warningCount: 0,
          failures: [
            {
              getFileName() {
                return 'test.ts';
              }
            }
          ],
          fixes: [],
          format: '',
          output: ''
        }
      ];

      spyOn(tsLintLogger, tsLintLogger.runTsLintDiagnostics.name).and.returnValue(null);
      spyOn(loggerDiagnostics, loggerDiagnostics.printDiagnostics.name).and.returnValue(null);

      try {
        utils.processLintResults({}, results);
        throw knownError;
      } catch (ex) {
        expect(loggerDiagnostics.printDiagnostics).toHaveBeenCalledTimes(1);
        expect(ex).not.toEqual(knownError);
      }
    });
  });
});
