import { join } from 'path';

import * as deepLinking from './deep-linking';
import * as deeplinkUtils from './deep-linking/util';
import * as Constants from './util/constants';
import { ChangedFile } from './util/interfaces';
import { FileCache } from './util/file-cache';
import * as helpers from './util/helpers';

describe('Deep Linking task', () => {
  describe('deepLinkingWorkerImpl', () => {

    beforeEach(() => {
      deepLinking.reset();
    });

    it('should not update app ngmodule when it has an existing deeplink config', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache()
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue([1]);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(true);
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);
      spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, null);

      return promise.then(() => {
        expect(deepLinking.cachedUnmodifiedAppNgModuleFileContent).toEqual(knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).not.toHaveBeenCalled();
        expect(deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig).not.toHaveBeenCalled();
      });
    });

    it('should not update app ngmodule when no deeplinks were found', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache()
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue([]);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);
      spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, null);

      return promise.then(() => {
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).not.toHaveBeenCalled();
        expect(deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig).not.toHaveBeenCalled();
      });
    });

    it('should update deeplink config', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache(),
        runAot: true
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      const knownMockDeepLinkArray = [1];
      const changedFiles: ChangedFile[] = [];
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue(knownMockDeepLinkArray);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);
      spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, changedFiles);

      return promise.then(() => {
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString);
        expect(helpers.getStringPropertyValue).toBeCalledWith(Constants.ENV_APP_NG_MODULE_PATH);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig).toHaveBeenCalledWith(context, knownDeepLinkString, changedFiles, context.runAot);
      });
    });

    it('should update deeplink config on subsequent updates when the deeplink string is different', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache(),
        runAot: true
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      const knownDeepLinkString2 = 'someDeepLinkString2';
      const knownMockDeepLinkArray = [1];
      const changedFiles: ChangedFile[] = null;
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue(knownMockDeepLinkArray);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);

      let hasConvertDeepLinkConfigToStringBeenCalled = false;
      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.callFake(() => {
        if (!hasConvertDeepLinkConfigToStringBeenCalled) {
          hasConvertDeepLinkConfigToStringBeenCalled = true;
          return knownDeepLinkString;
        }
        return knownDeepLinkString2;
      });

      const spy = spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, changedFiles);

      return promise.then(() => {
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString);
        expect(helpers.getStringPropertyValue).toBeCalledWith(Constants.ENV_APP_NG_MODULE_PATH);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(spy.calls.first().args[0]).toEqual(context);
        expect(spy.calls.first().args[1]).toEqual(knownDeepLinkString);
        expect(spy.calls.first().args[2]).toEqual(changedFiles);
        expect(spy.calls.first().args[3]).toEqual(context.runAot);

        return deepLinking.deepLinkingWorkerImpl(context, changedFiles);
      }).then((result) => {
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString2);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledTimes(2);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledTimes(2);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.mostRecent().args[0]).toEqual(context);
        expect(spy.calls.mostRecent().args[1]).toEqual(knownDeepLinkString2);
        expect(spy.calls.mostRecent().args[2]).toEqual(changedFiles);
        expect(spy.calls.mostRecent().args[3]).toEqual(context.runAot);
      });
    });

    it('should not update deeplink config on subsequent updates when the deeplink string is the same', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache(),
        runAot: true
      };
      const knownFileContent = 'someFileContent';
      const knownDeepLinkString = 'someDeepLinkString';
      const knownMockDeepLinkArray = [1];
      const changedFiles: ChangedFile[] = null;
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue(knownMockDeepLinkArray);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);

      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);

      const spy = spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, changedFiles);

      return promise.then(() => {
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString);
        expect(helpers.getStringPropertyValue).toBeCalledWith(Constants.ENV_APP_NG_MODULE_PATH);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(spy.calls.first().args[0]).toEqual(context);
        expect(spy.calls.first().args[1]).toEqual(knownDeepLinkString);
        expect(spy.calls.first().args[2]).toEqual(changedFiles);
        expect(spy.calls.first().args[3]).toEqual(context.runAot);

        return deepLinking.deepLinkingWorkerImpl(context, changedFiles);
      }).then((result) => {
        expect(result).toEqual(knownMockDeepLinkArray);
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledTimes(2);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledTimes(2);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    it('should update the deeplink config and cached deeplink string no matter what when the app.module.ts is changed', () => {
      const appNgModulePath = join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
      const context = {
        fileCache: new FileCache(),
        runAot: true
      };
      const knownFileContent = `
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgModule, ErrorHandler } from '@angular/core';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SplashScreen } from '@ionic-native/splash-screen';

import { IonicStorageModule } from '@ionic/storage';

import { ConferenceApp } from './app.component';

import { ConferenceData } from '../providers/conference-data';
import { UserData } from '../providers/user-data';

@NgModule({
  declarations: [
    ConferenceApp
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(ConferenceApp, {
      preloadModules: true
    }),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    ConferenceApp
  ],
  providers: [
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    ConferenceData,
    UserData,
    InAppBrowser,
    SplashScreen
  ]
})
export class AppModule { }
`;

      const knownFileContent2 = `
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgModule, ErrorHandler } from '@angular/core';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SplashScreen } from '@ionic-native/splash-screen';

import { IonicStorageModule } from '@ionic/storage';

import { ConferenceApp } from './app.component';

import { ConferenceData } from '../providers/conference-data';
import { UserData } from '../providers/user-data';

@NgModule({
  declarations: [
    ConferenceApp,
    SomeNewComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(ConferenceApp, {
      preloadModules: true
    }),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    ConferenceApp
  ],
  providers: [
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    ConferenceData,
    UserData,
    InAppBrowser,
    SplashScreen
  ]
})
export class AppModule { }
`;
      const knownDeepLinkString = 'someDeepLinkString';
      const knownMockDeepLinkArray = [1];
      const changedFiles: ChangedFile[] = [];
      context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
      spyOn(deeplinkUtils, deeplinkUtils.getDeepLinkData.name).and.returnValue(knownMockDeepLinkArray);
      spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(false);

      spyOn(deeplinkUtils, deeplinkUtils.convertDeepLinkConfigEntriesToString.name).and.returnValue(knownDeepLinkString);

      const spy = spyOn(deeplinkUtils, deeplinkUtils.updateAppNgModuleAndFactoryWithDeepLinkConfig.name);

      const promise = deepLinking.deepLinkingWorkerImpl(context, changedFiles);

      return promise.then(() => {
        expect(deepLinking.cachedUnmodifiedAppNgModuleFileContent).toEqual(knownFileContent);
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString);
        expect(helpers.getStringPropertyValue).toBeCalledWith(Constants.ENV_APP_NG_MODULE_PATH);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(spy.calls.first().args[0]).toEqual(context);
        expect(spy.calls.first().args[1]).toEqual(knownDeepLinkString);
        expect(spy.calls.first().args[2]).toEqual(changedFiles);
        expect(spy.calls.first().args[3]).toEqual(context.runAot);

        // add a changed file to the fray
        changedFiles.push({
          event: 'change',
          ext: '.ts',
          filePath: appNgModulePath
        });
        context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent2 });
        return deepLinking.deepLinkingWorkerImpl(context, changedFiles);
      }).then((result) => {
        expect(result).toEqual(knownMockDeepLinkArray);
        expect(deepLinking.cachedDeepLinkString).toEqual(knownDeepLinkString);
        expect(deepLinking.cachedUnmodifiedAppNgModuleFileContent).toEqual(knownFileContent2);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledTimes(2);
        expect(deeplinkUtils.getDeepLinkData).toHaveBeenCalledWith(appNgModulePath, context.fileCache, context.runAot);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledTimes(2);
        expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalledWith(appNgModulePath, knownFileContent);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledWith(knownMockDeepLinkArray);
        expect(deeplinkUtils.convertDeepLinkConfigEntriesToString).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
