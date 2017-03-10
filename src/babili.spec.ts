import * as babili from './babili';
import * as configUtil from './util/config';

describe('babili function', () => {
  beforeEach(() => {
    spyOn(configUtil, 'getUserConfigFile').and.returnValue('fileContents');
  });

  it('should call main babili function', () => {
    const context = {
      rootDir: '/Users/justinwillis/Projects/ionic-conference-app'
    };
    const configFile = 'configFileContents';

    return babili.babili(context, configFile).then(() => {
      expect(configUtil.getUserConfigFile).toHaveBeenCalledWith(context, babili.taskInfo, configFile);
    });
  });

  it('should throw if context does not have a rootDir', () => {
    const context = {};
    const configFile = 'configFileContents';

    expect(babili.babili(context, configFile)).toThrow();
  });

  it('should fail because it does not have a valid build context', () => {
    const context: null = null;
    const configFile = 'configFileContents';

    expect(babili.babili(context, configFile)).toThrow();
  });

  it('should fail because it does not have a valid config file', () => {
    const context = {};
    const configFile: null = null;

    expect(babili.babili(context, configFile)).toThrow();
  });

});
