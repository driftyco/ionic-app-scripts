import * as uglifyjs from './uglifyjs';
import * as configUtil from './util/config';
import * as workerClient from './worker-client';

describe('uglifyjs function', () => {
  beforeEach(() => {
    spyOn(configUtil, 'getUserConfigFile').and.returnValue('fileContents');
    spyOn(workerClient, 'runWorker').and.returnValue(Promise.resolve());
  });

  it('should call workerClient function', () => {
    const context = {};
    const configFile = 'configFileContents';

    return uglifyjs.uglifyjs(context, configFile).then(() => {
      expect(configUtil.getUserConfigFile).toHaveBeenCalledWith(context, uglifyjs.taskInfo, configFile);
      expect(workerClient.runWorker).toHaveBeenCalledWith('uglifyjs', 'uglifyjsWorker', context, 'fileContents');
    });
  });

  it('should fail because it does not have a valid build context', () => {
    const context: null = null;
    const configFile = 'configFileContents';

    expect(uglifyjs.uglifyjs(context, configFile)).toThrow();
  });

  it('should fail because it does not have a valid config file', () => {
    const context = {};
    const configFile: null = null;

    expect(uglifyjs.uglifyjs(context, configFile)).toThrow();
  });

  it('should not fail if a config is not passed', () => {
    const context = {};
    let configFile: any;

    return uglifyjs.uglifyjs(context).then(() => {
      expect(configUtil.getUserConfigFile).toHaveBeenCalledWith(context, uglifyjs.taskInfo, configFile);
      expect(workerClient.runWorker).toHaveBeenCalledWith('uglifyjs', 'uglifyjsWorker', context, 'fileContents');
    });
  });
});
