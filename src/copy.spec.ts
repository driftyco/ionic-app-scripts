import * as copy from './copy';

import * as config from './util/config';

describe('copy task', () => {
  describe('copyConfigToWatchConfig', () => {
    it('should convert to watch config format', () => {
      // arrange
      const context = { };
      const configFile = 'configFile';
      const sampleConfig: copy.CopyConfig = {
        copyAssets: {
          src: ['{{SRC}}/assets/**/*'],
          dest: '{{WWW}}/assets'
        },
        copyIndexContent: {
          src: ['{{SRC}}/index.html', '{{SRC}}/manifest.json', '{{SRC}}/service-worker.js'],
          dest: '{{WWW}}'
        },
        copyFonts: {
          src: ['{{ROOT}}/node_modules/ionicons/dist/fonts/**/*', '{{ROOT}}/node_modules/ionic-angular/fonts/**/*'],
          dest: '{{WWW}}/assets/fonts'
        },
        copyPolyfills: {
          src: [`{{ROOT}}/node_modules/ionic-angular/polyfills/${process.env.POLLYFILL_NAME}.js`],
          dest: '{{BUILD}}'
        },
        someOtherOption: {
          src: ['{{ROOT}}/whatever'],
          dest: '{{BUILD}}'
        }
      };
      let combinedSource: string[] = [];
      Object.keys(sampleConfig).forEach(entry => combinedSource = combinedSource.concat(sampleConfig[entry].src));

      spyOn(config, config.generateContext.name).and.returnValue(context);
      spyOn(config, config.getUserConfigFile.name).and.returnValue(configFile);
      spyOn(config, config.fillConfigDefaults.name).and.returnValue(sampleConfig);

      // act
      const result = copy.copyConfigToWatchConfig(null);

      // assert
      expect(config.generateContext).toHaveBeenCalledWith(null);
      expect(config.getUserConfigFile).toHaveBeenCalledWith(context, copy.taskInfo, '');
      expect(config.fillConfigDefaults).toHaveBeenCalledWith(configFile, copy.taskInfo.defaultConfigFile);
      (result.paths as string[]).forEach(glob => {
        expect(combinedSource.indexOf(glob)).not.toEqual(-1);
      });
      expect(result.callback).toBeDefined();
      expect(result.options).toBeDefined();
    });
  });
});
