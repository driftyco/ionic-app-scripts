import { BuildError } from './errors';
import * as helpers from './helpers';

let originalEnv: any = null;
describe('helpers', () => {

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getIntPropertyValue', () => {
    it('should return an int', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = '3000';
      process.env[propertyName] = propertyValue;

      // act
      const result = helpers.getIntPropertyValue(propertyName);

      // assert
      expect(result).toEqual(3000);
    });

    it('should round to an int', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = '3000.03';
      process.env[propertyName] = propertyValue;

      // act
      const result = helpers.getIntPropertyValue(propertyName);

      // assert
      expect(result).toEqual(3000);
    });

    it('should round to a NaN', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'tacos';
      process.env[propertyName] = propertyValue;

      // act
      const result = helpers.getIntPropertyValue(propertyName);

      // assert
      expect(result).toEqual(NaN);
    });
  });

  describe('getBooleanPropertyValue', () => {

    beforeEach(() => {
      originalEnv = process.env;
      process.env = {};
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true when value is "true"', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'true';
      process.env[propertyName] = propertyValue;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(true);
    });

    it('should return false when value is undefined/null', () => {
      // arrange
      const propertyName = 'test';
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(false);
    });

    it('should return false when value is not "true"', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'taco';
      process.env[propertyName] = propertyValue;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(false);
    });
  });

  describe('processStatsImpl', () => {
    it('should convert object graph to known module map', () => {
      // arrange
      const moduleOne = '/Users/noone/myModuleOne.js';
      const moduleTwo = '/Users/noone/myModuleTwo.js';
      const moduleThree = '/Users/noone/myModuleThree.js';
      const moduleFour = '/Users/noone/myModuleFour.js';
      const objectGraph: any = {
        modules: [
          {
            identifier: moduleOne,
            reasons: [
              {
                moduleIdentifier: moduleTwo
              },
              {
                moduleIdentifier: moduleThree
              }
            ]
          },
          {
            identifier: moduleTwo,
            reasons: [
              {
                moduleIdentifier: moduleThree
              }
            ]
          },
          {
            identifier: moduleThree,
            reasons: [
              {
                moduleIdentifier: moduleOne
              }
            ]
          },
          {
            identifier: moduleFour,
            reasons: []
          }
        ]
      };
      // act
      const result = helpers.processStatsImpl(objectGraph);

      // assert
      const setOne = result.get(moduleOne);
      expect(setOne.has(moduleTwo)).toBeTruthy();
      expect(setOne.has(moduleThree)).toBeTruthy();

      const setTwo = result.get(moduleTwo);
      expect(setTwo.has(moduleThree)).toBeTruthy();

      const setThree = result.get(moduleThree);
      expect(setThree.has(moduleOne)).toBeTruthy();

      const setFour = result.get(moduleFour);
      expect(setFour.size).toEqual(0);
    });
  });

  describe('ensureSuffix', () => {
    it('should not include the suffix of a string that already has the suffix', () => {
      expect(helpers.ensureSuffix('dan dan the sunshine man', ' man')).toEqual('dan dan the sunshine man');
    });

    it('should ensure the suffix of a string without the suffix', () => {
      expect(helpers.ensureSuffix('dan dan the sunshine', ' man')).toEqual('dan dan the sunshine man');
    });
  });

  describe('removeSuffix', () => {
    it('should remove the suffix of a string that has the suffix', () => {
      expect(helpers.removeSuffix('dan dan the sunshine man', ' man')).toEqual('dan dan the sunshine');
    });

    it('should do nothing if the string does not have the suffix', () => {
      expect(helpers.removeSuffix('dan dan the sunshine man', ' woman')).toEqual('dan dan the sunshine man');
    });
  });

  describe('replaceAll', () => {
    it('should replace a variable', () => {
      expect(helpers.replaceAll('hello $VAR world', '$VAR', 'my')).toEqual('hello my world');
    });

    it('should replace a variable with newlines', () => {
      expect(helpers.replaceAll('hello\n $VARMORETEXT\n world', '$VAR', 'NO')).toEqual('hello\n NOMORETEXT\n world');
    });

    it('should replace a variable and handle undefined', () => {
      expect(helpers.replaceAll('hello $VAR world', '$VAR', undefined)).toEqual('hello  world');
    });
  });

  describe('buildErrorToJson', () => {
    it('should return a pojo', () => {
      const buildError = new BuildError('message1');
      buildError.name = 'name1';
      buildError.stack = 'stack1';
      buildError.isFatal = true;
      buildError.hasBeenLogged = false;

      const object = helpers.buildErrorToJson(buildError);
      expect(object.message).toEqual('message1');
      expect(object.name).toEqual(buildError.name);
      expect(object.stack).toEqual(buildError.stack);
      expect(object.isFatal).toEqual(buildError.isFatal);
      expect(object.hasBeenLogged).toEqual(buildError.hasBeenLogged);
    });
  });

  describe('upperCaseFirst', () => {
    it('should capitalize a one character string', () => {
      const result = helpers.upperCaseFirst('t');
      expect(result).toEqual('T');
    });

    it('should capitalize the first character of string', () => {
      const result = helpers.upperCaseFirst('taco');
      expect(result).toEqual('Taco');
    });
  });

  describe('removeCaseFromString', () => {
    const map = new Map<string, string>();
    map.set('test', 'test');
    map.set('TEST', 'test');
    map.set('testString', 'test string');
    map.set('testString123', 'test string123');
    map.set('testString_1_2_3', 'test string 1 2 3');
    map.set('x_256', 'x 256');
    map.set('anHTMLTag', 'an html tag');
    map.set('ID123String', 'id123 string');
    map.set('Id123String', 'id123 string');
    map.set('foo bar123', 'foo bar123');
    map.set('a1bStar', 'a1b star');
    map.set('CONSTANT_CASE', 'constant case');
    map.set('CONST123_FOO', 'const123 foo');
    map.set('FOO_bar', 'foo bar');
    map.set('dot.case', 'dot case');
    map.set('path/case', 'path case');
    map.set('snake_case', 'snake case');
    map.set('snake_case123', 'snake case123');
    map.set('snake_case_123', 'snake case 123');
    map.set('"quotes"', 'quotes');
    map.set('version 0.45.0', 'version 0 45 0');
    map.set('version 0..78..9', 'version 0 78 9');
    map.set('version 4_99/4', 'version 4 99 4');
    map.set('amazon s3 data', 'amazon s3 data');
    map.set('foo_13_bar', 'foo 13 bar');

    map.forEach((value: string, key: string) => {
      const result = helpers.removeCaseFromString(key);
      expect(result).toEqual(value);
    });
  });

  describe('sentenceCase', () => {
    it('should lower case a single word', () => {
      const resultOne = helpers.sentenceCase('test');
      const resultTwo = helpers.sentenceCase('TEST');
      expect(resultOne).toEqual('Test');
      expect(resultTwo).toEqual('Test');
    });

    it('should sentence case regular sentence cased strings', () => {
      const resultOne = helpers.sentenceCase('test string');
      const resultTwo = helpers.sentenceCase('Test String');

      expect(resultOne).toEqual('Test string');
      expect(resultTwo).toEqual('Test string');
    });

    it('should sentence case non-alphanumeric separators', () => {
      const resultOne = helpers.sentenceCase('dot.case');
      const resultTwo = helpers.sentenceCase('path/case');
      expect(resultOne).toEqual('Dot case');
      expect(resultTwo).toEqual('Path case');
    });
  });

  describe('camelCase', () => {
    it('should lower case a single word', () => {
      const resultOne = helpers.camelCase('test');
      const resultTwo = helpers.camelCase('TEST');
      expect(resultOne).toEqual('test');
      expect(resultTwo).toEqual('test');
    });

    it('should camel case regular sentence cased strings', () => {
      expect(helpers.camelCase('test string')).toEqual('testString');
      expect(helpers.camelCase('Test String')).toEqual('testString');
    });

    it('should camel case non-alphanumeric separators', () => {
      expect(helpers.camelCase('dot.case')).toEqual('dotCase');
      expect(helpers.camelCase('path/case')).toEqual('pathCase');
    });

    it('should underscore periods inside numbers', () => {
      expect(helpers.camelCase('version 1.2.10')).toEqual('version_1_2_10');
      expect(helpers.camelCase('version 1.21.0')).toEqual('version_1_21_0');
    });

    it('should camel case pascal cased strings', () => {
      expect(helpers.camelCase('TestString')).toEqual('testString');
    });

    it('should camel case non-latin strings', () => {
      expect(helpers.camelCase('simple éxample')).toEqual('simpleÉxample');
    });
  });

  describe('paramCase', () => {
    it('should param case a single word', () => {
      expect(helpers.paramCase('test')).toEqual('test');
      expect(helpers.paramCase('TEST')).toEqual('test');
    });

    it('should param case regular sentence cased strings', () => {
      expect(helpers.paramCase('test string')).toEqual('test-string');
      expect(helpers.paramCase('Test String')).toEqual('test-string');
    });

    it('should param case non-alphanumeric separators', () => {
      expect(helpers.paramCase('dot.case')).toEqual('dot-case');
      expect(helpers.paramCase('path/case')).toEqual('path-case');
    });

    it('should param case param cased strings', () => {
      expect(helpers.paramCase('TestString')).toEqual('test-string');
      expect(helpers.paramCase('testString1_2_3')).toEqual('test-string1-2-3');
      expect(helpers.paramCase('testString_1_2_3')).toEqual('test-string-1-2-3');
    });

    it('should param case non-latin strings', () => {
      expect(helpers.paramCase('My Entrée')).toEqual('my-entrée');
    });
  });

  describe('pascalCase', () => {
    it('should pascal case a single word', () => {
      expect(helpers.pascalCase('test')).toEqual('Test');
      expect(helpers.pascalCase('TEST')).toEqual('Test');
    });

    it('should pascal case regular sentence cased strings', () => {
      expect(helpers.pascalCase('test string')).toEqual('TestString');
      expect(helpers.pascalCase('Test String')).toEqual('TestString');
    });

    it('should pascal case non-alphanumeric separators', () => {
      expect(helpers.pascalCase('dot.case')).toEqual('DotCase');
      expect(helpers.pascalCase('path/case')).toEqual('PathCase');
    });

    it('should pascal case pascal cased strings', () => {
      expect(helpers.pascalCase('TestString')).toEqual('TestString');
    });
  });

  describe('snakeCase', () => {
    it('should convert the phrase to use underscores', () => {
      expect(helpers.snakeCase('taco bell')).toEqual('taco_bell');
    });
  });

  describe('constantCase', () => {
    it('should capitalize and separate words by underscore', () => {
      expect(helpers.constantCase('taco bell')).toEqual('TACO_BELL');
    });

    it('should convert camel case to correct case', () => {
      expect(helpers.constantCase('TacoBell')).toEqual('TACO_BELL');
    });
  });
});
