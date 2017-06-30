import { Configuration, Linter } from 'tslint';
import { DiagnosticCategory } from 'typescript';
import * as ts from 'typescript';
import { isObject } from 'util';
import {
  createLinter,
  createProgram,
  getFileNames,
  getLintResult,
  getTsLintConfig,
  lint,
  typeCheck
} from './lint-factory';


describe('lint factory', () => {
  describe('createProgram()', () => {
    it('should create a TS Program', () => {
      const context: any = {rootDir: ''};
      const program: any = createProgram(context, '');
      const fns = [
        'getSourceFiles',
        'getTypeChecker'
      ];

      expect(isObject(program)).toBeTruthy();
      for (const fn of fns) {
        expect(typeof program[fn]).toEqual('function');
      }
    });
  });

  describe('getTsLintConfig()', () => {
    it('should fetch the TSLint configuration from file path', () => {
      const tsConfigFilePath = 'tsconfig.json';
      const mockConfig = {rulesDirectory: ['node_modules/@ionic']};
      spyOn(Configuration, Configuration.loadConfigurationFromPath.name).and.returnValue(mockConfig);

      const config = getTsLintConfig(tsConfigFilePath);

      expect(isObject(config)).toBeTruthy();
      expect(Configuration.loadConfigurationFromPath).toHaveBeenLastCalledWith(tsConfigFilePath);
      expect(config).toEqual(mockConfig);
    });

    it('should extend configuration with {linterOptions} if provided', () => {
      const tsConfigFilePath = 'tsconfig.json';
      const mockConfig = {rulesDirectory: ['node_modules/@ionic']};
      spyOn(Configuration, Configuration.loadConfigurationFromPath.name).and.returnValue(mockConfig);
      const config = getTsLintConfig(tsConfigFilePath, {
        typeCheck: true
      });

      expect(config.linterOptions).toEqual({
        typeCheck: true
      });
    });
  });

  describe('createLinter()', () => {
    it('should create a Linter', () => {
      const context: any = {rootDir: ''};
      const program = createProgram(context, '');
      const linter = createLinter(context, program);

      expect(linter instanceof Linter).toBeTruthy();
    });
  });

  describe('getFileNames()', () => {
    it('should get the file names referenced in the tsconfig.json', () => {
      const context: any = {rootDir: ''};
      const program = createProgram(context, '');
      const mockFiles = ['test.ts'];
      spyOn(Linter, 'getFileNames').and.returnValue(mockFiles);
      const files = getFileNames(context, program);

      expect(Array.isArray(files)).toBeTruthy();
      expect(files).toEqual(mockFiles);
    });
  });

  describe('typeCheck()', () => {
    it('should not be called if {typeCheck} is false', done => {
      const context: any = {rootDir: ''};
      const program = createProgram(context, '');

      spyOn(ts, ts.getPreEmitDiagnostics.name).and.returnValue([]);

      typeCheck(context, program, {typeCheck: false})
        .then((result) => {
          expect(ts.getPreEmitDiagnostics).toHaveBeenCalledTimes(0);
          expect(result).toEqual([]);
          done();
        });
    });

    it('should type check if {typeCheck} is true', done => {
      const context: any = {rootDir: ''};
      const program = createProgram(context, '');

      const diagnostics: any = [{
        file: {},
        start: 2,
        length: 10,
        messageText: 'Oops',
        category: DiagnosticCategory.Warning,
        code: 120
      }];

      spyOn(ts, ts.getPreEmitDiagnostics.name).and.returnValue(diagnostics);

      typeCheck(context, program, {typeCheck: true})
        .then((result) => {
          expect(ts.getPreEmitDiagnostics).toHaveBeenCalledWith(program);
          expect(result).toEqual(diagnostics);
          done();
        });
    });
  });

  describe('lint()', () => {
    it('should lint a file', () => {
      const context: any = {rootDir: ''};
      const program = createProgram(context, '');
      const linter = createLinter(context, program);
      spyOn(linter, 'lint').and.returnValue(undefined);
      const config = {};
      const filePath = 'test.ts';
      const fileContents = 'const test = true;';

      lint(linter, config, filePath, fileContents);

      expect(linter.lint).toHaveBeenCalledWith(filePath, fileContents, config);
    });
  });
  describe('getLintResult()', () => {
    it('should get the lint results after linting a file', () => {
      const context: any = {rootDir: ''};
      const program = createProgram(context, '');
      const linter = createLinter(context, program);
      spyOn(linter, 'lint').and.returnValue(undefined);
      const mockResult: any = {};
      spyOn(linter, 'getResult').and.returnValue(mockResult);
      const config = {
        jsRules: new Map(),
        rules: new Map()
      };
      const filePath = 'test.ts';
      const fileContents = 'const test = true;';

      lint(linter, config, filePath, fileContents);

      const result = getLintResult(linter);
      expect(isObject(result)).toBeTruthy();
      expect(result).toEqual(mockResult);
    });
  });
});
