import * as babili from './babili';
import * as crossSpawn from 'cross-spawn';

describe('babili function', () => {

  beforeEach(() => {



  });



  it('should reject promise when non-zero status code', () => {
    const spawnMock: any = {
      on: () => {}
    };
    spyOn(crossSpawn, 'spawn').and.returnValue(spawnMock);
    const onSpy = spyOn(spawnMock, 'on');

    const context = {
      nodeModulesDir: '/Users/noone/Projects/ionic-conference-app/node_modules'
    };
    const knownError = 'should never get here';

    const promise = babili.runBabili(context);
    const spawnCallback = onSpy.calls.first().args[1];
    spawnCallback(1);

    return promise.then(() => {
      throw new Error(knownError);
    }).catch((err: Error) => {
      expect(err.message).not.toEqual(knownError);
    });
  });

  it('should resolve promise when zero status code', () => {
    const spawnMock: any = {
      on: () => {}
    };
    spyOn(crossSpawn, 'spawn').and.returnValue(spawnMock);
    const onSpy = spyOn(spawnMock, 'on');

    const context = {
      nodeModulesDir: '/Users/noone/Projects/ionic-conference-app/node_modules'
    };

    const promise = babili.runBabili(context);
    const spawnCallback = onSpy.calls.first().args[1];
    spawnCallback(0);

    return promise;
  });

  it('should throw if context does not have a rootDir', () => {
    const context = {};
    const knownError = 'should never get here';
    const promise = babili.runBabili(context);
    return promise.then(() => {
      throw new Error(knownError);
    }).catch((err: Error) => {
      expect(err.message).not.toEqual(knownError);
    });
  });
});
