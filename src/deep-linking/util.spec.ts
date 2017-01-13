import { join } from 'path';
import * as util from './util';

describe('util', () => {
  describe('extractDeepLinkPathData', () => {
    it('should return the deep link metadata', () => {
      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {}, {
    links: [
      { loadChildren: '../pages/home/home.module#HomePageModule', name: 'Home' },
      { loadChildren: '../pages/page-one/page-one.module#PageOneModule', name: 'PageOne' },
      { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo' }
    ]
  });
}
      `;
      const results = util.extractDeepLinkPathData(fileContent);

      expect(results).toBeTruthy();
      expect(Array.isArray(results)).toBeTruthy();
      expect(results[0].modulePath).toEqual('../pages/home/home.module');
      expect(results[0].namedExport).toEqual('HomePageModule');
      expect(results[0].name).toEqual('Home');
      expect(results[1].modulePath).toEqual('../pages/page-one/page-one.module');
      expect(results[1].namedExport).toEqual('PageOneModule');
      expect(results[1].name).toEqual('PageOne');
      expect(results[2].modulePath).toEqual('../pages/page-two/page-two.module');
      expect(results[2].namedExport).toEqual('PageTwoModule');
      expect(results[2].name).toEqual('PageTwo');
    });
  });
  /*describe('getDeepLinkData', () => {
    it('should convert the paths to absolute paths', () => {

      const fileContent = `
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import * as Constants from '../util/constants';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    getSharedIonicModule()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule {}

export function getSharedIonicModule() {
  return IonicModule.forRoot(MyApp, {}, {
    links: [
      { path: '../pages/home/home.module', namedExport: 'HomePageModule', name: 'Home' },
      { path: '../pages/page-one/page-one.module', namedExport: 'PageOneModule', name: 'PageOne' },
      { path: '../pages/page-two/page-two.module', namedExport: 'PageTwoModule', name: 'PageTwo' }
    ]
  });
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent);
      expect(result).toBeTruthy();
      expect(result[0].absolutePath).toEqual(join(srcDir, 'pages/home/home.module.ts'));
      expect(result[1].absolutePath).toEqual(join(srcDir, 'page-one/page-one.module.ts'));
      expect(result[2].absolutePath).toEqual(join(srcDir, 'page-two/page-two.module.ts'));
    });
  });
  */
});