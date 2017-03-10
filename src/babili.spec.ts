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

  it('should fail without a rootDir', () => {
    const context = {};
    const configFile = 'configFileContents';

    return babili.babili(context, configFile).then(() => {
      expect(configUtil.getUserConfigFile).toHaveBeenCalledWith(context, babili.taskInfo, configFile);
    });
  });
});
