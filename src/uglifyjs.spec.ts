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
});
