import * as fs from 'fs';
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
      const context: any = {
        rootDir: ''
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
      spyOn(linter, linter.createProgram.name).and.returnValue({});
      spyOn(linter, linter.createLinter.name).and.returnValue({});

      // Mock the file read
      spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));
      spyOn(fs, 'openSync').and.returnValue(null);
      spyOn(fs, 'readSync').and.returnValue(null);
      spyOn(fs, 'closeSync').and.returnValue(null);

      const mockProgram = linter.createProgram(context, '');
      const mockLinter = linter.createLinter(context, mockProgram);
      const mockConfig = {};

      return utils.lintFile(mockLinter, mockConfig, filePath)
        .then(() => {
          expect(linter.lint)
            .toHaveBeenCalledWith(mockLinter, mockConfig, filePath, fileContent);
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

  describe('processLintResult()', () => {
    it('should not throw an error when there are no files with errors or warnings', () => {
      utils.processLintResult({}, {
          errorCount: 0,
          warningCount: 0,
          failures: [],
          fixes: [],
          format: '',
          output: ''
        });
    });

    it('should throw an error when one or more file has failures', () => {
      const knownError = new Error('Should never get here');
      const result: any = {
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
      };

      spyOn(tsLintLogger, tsLintLogger.runTsLintDiagnostics.name).and.returnValue(null);
      spyOn(loggerDiagnostics, loggerDiagnostics.printDiagnostics.name).and.returnValue(null);

      try {
        utils.processLintResult({}, result);
        throw knownError;
      } catch (ex) {
        expect(loggerDiagnostics.printDiagnostics).toHaveBeenCalledTimes(1);
        expect(ex).not.toEqual(knownError);
      }
    });
  });

  describe('generateErrorMessageForFiles()', () => {
    it('should generate a string from an array of files', () => {
      expect(utils.generateErrorMessageForFiles(['test_one.ts', 'test_two.ts'], 'Just testing:'))
        .toEqual('Just testing:\ntest_one.ts\ntest_two.ts');
    });
  });

  describe('getFileNames()', () => {
    it('should retrieve file names from an array of RuleFailure objects', () => {
      const ruleFailures: any[] = [
          {
            getFileName() {
              return '/User/john/test.ts';
            }
          }
      ];
      const fileNames = utils.getFileNames({rootDir: '/User/john'}, ruleFailures);

      expect(fileNames)
        .toEqual(['test.ts']);
    });
  });

  describe('removeDuplicateFileNames()', () => {
    it('should remove duplicate string entries in arrays', () => {
      expect(utils.removeDuplicateFileNames(['test.ts', 'test.ts']))
        .toEqual(['test.ts']);
    });
  });
});
