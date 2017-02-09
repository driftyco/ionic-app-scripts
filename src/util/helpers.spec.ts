import * as helpers from './helpers';

describe('helpers', () => {
  describe('getBooleanPropertyValue', () => {
    it('should return true when value is "true"', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'true';
      let environment: any = { };
      environment[propertyName] = propertyValue;
      process.env = environment;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(true);
    });

    it('should return false when value is undefined/null', () => {
      // arrange
      const propertyName = 'test';
      let environment: any = { };
      process.env = environment;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(false);
    });

    it('should return false when value is not "true"', () => {
      // arrange
      const propertyName = 'test';
      const propertyValue = 'taco';
      let environment: any = { };
      environment[propertyName] = propertyValue;
      process.env = environment;
      // act
      const result = helpers.getBooleanPropertyValue(propertyName);
      // assert
      expect(result).toEqual(false);
    });
  });

  describe('processStatsImpl', () => {
    it('should convert object graph to known module map', () => {
      // arrange
      const moduleOne = '/Users/dan/myModuleOne.js';
      const moduleTwo = '/Users/dan/myModuleTwo.js';
      const moduleThree = '/Users/dan/myModuleThree.js';
      const moduleFour = '/Users/dan/myModuleFour.js';
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
});
