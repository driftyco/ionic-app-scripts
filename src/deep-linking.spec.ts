import { join } from 'path';

import * as deepLinking from './deep-linking';
import * as deeplinkUtils from './deep-linking/util';
import * as Constants from './util/constants';
import { BuildState, ChangedFile, DeepLinkConfigEntry } from './util/interfaces';
import { FileCache } from './util/file-cache';
import * as helpers from './util/helpers';

describe('Deep Linking task', () => {
  describe('deepLinkingWorkerImpl', () => {

   it('should not update app ngmodule when it has an existing deeplink config', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache()
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(helpers, helpers.readAndCacheFile.name).and.returnValue(Promise.resolve(knownFileContent));
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(true);

      const promise = deepLinking.deepLinkingWorkerImpl(context, null);

      return promise.then((results: Map<string, DeepLinkConfigEntry>) => {
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalled();
        expect(results.size).toEqual(0);
      });
    });
  });
});
