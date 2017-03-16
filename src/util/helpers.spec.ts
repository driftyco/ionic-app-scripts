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

  describe('getPropertyValue', () => {
    beforeEach(() => {
      originalEnv = process.env;
      process.env = {};
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return the property value', () => {
      const propertyName = 'test';
      const propertyValue = 'taco';
      process.env[propertyName] = propertyValue;
      const result = helpers.getPropertyValue(propertyName);
      expect(result).toEqual(propertyValue);
      const nullResult = helpers.getPropertyValue('somePropertyNotFound');
      expect(nullResult).toBeFalsy();
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
});
