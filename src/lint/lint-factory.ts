import { createProgram as lintCreateProgram, findConfiguration, getFileNames as lintGetFileNames } from 'tslint';
import * as Linter from 'tslint';
import { Program } from 'typescript';

export function getLinter(filePath: string, fileContent: string, program: Program) {
  const configuration = findConfiguration(null, filePath);

  const linter = new Linter(filePath, fileContent, {
    configuration: configuration,
    formatter: null,
    formattersDirectory: null,
    rulesDirectory: null,
  }, program);

  return linter;
}

export function createProgram(configFilePath: string, sourceDir: string) {
  return lintCreateProgram(configFilePath, sourceDir);
}

export function getFileNames(program: Program) {
  return lintGetFileNames(program);
}
