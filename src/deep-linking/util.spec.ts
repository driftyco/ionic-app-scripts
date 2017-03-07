import { join } from 'path';
import * as util from './util';

import { FileCache } from '../util/file-cache';
import *  as helpers from '../util/helpers';
import * as tsUtils from '../util/typescript-utils';

describe('util', () => {
  describe('extractDeepLinkPathData', () => {
    it('should return the parsed deep link metadata', () => {
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
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
      { name: 'SomePage2', Component: MyComponent2 }
    ]
  });
}
      `;
      const results = util.extractDeepLinkPathData(fileContent);
      expect(results).toBeTruthy();

      expect(results[0].component).toEqual(null);
      expect(results[0].name).toBe('Home');
      expect(results[0].modulePath).toBe('../pages/home/home.module');
      expect(results[0].namedExport).toBe('HomePageModule');

      expect(results[1].component).toEqual(null);
      expect(results[1].name).toBe('PageOne');
      expect(results[1].modulePath).toBe('../pages/page-one/page-one.module');
      expect(results[1].namedExport).toBe('PageOneModule');

      expect(results[2].component).toEqual(null);
      expect(results[2].name).toBe('PageTwo');
      expect(results[2].modulePath).toBe('../pages/page-two/page-two.module');
      expect(results[2].namedExport).toBe('PageTwoModule');

      expect(results[3].component).toEqual('MyComponent');
      expect(results[3].name).toBe('SomePage');
      expect(results[3].modulePath).toBe(null);
      expect(results[3].namedExport).toBe(null);

      expect(results[4].component).toEqual('MyComponent2');
      expect(results[4].name).toBe('SomePage2');
      expect(results[4].modulePath).toBe(null);
      expect(results[4].namedExport).toBe(null);
    });

    it('should handle configs with arrays in them', () => {
      const knownContent = `
        @NgModule({
  declarations: [
    E2EApp,
    FirstPage,
    RedirectPage,
    AnotherPage,
    MyCmpTest,
    MyCmpTest2,
    PrimaryHeaderPage,
    TabsPage,
    Tab1,
    Tab2,
    Tab3,
    TabItemPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(E2EApp, {
      swipeBackEnabled: true
    }, {
      links: [
        { component: FirstPage, name: 'first-page' },
        { component: AnotherPage, name: 'another-page' },
        { component: MyCmpTest, name: 'tab1-page1' },

        { loadChildren: './pages/full-page/full-page.module#LinkModule', name: 'full-page', defaultHistory: ['first-page', 'another-page'] },

        { component: PrimaryHeaderPage, name: 'primary-header-page', defaultHistory: ['first-page', 'full-page'] },
        { component: Tabs, name: 'tabs' },
        { component: Tab1, name: 'tab1' },
        { component: TabItemPage, name: 'item' }
      ]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    E2EApp,
    FirstPage,
    RedirectPage,
    AnotherPage,
    PrimaryHeaderPage,
    TabsPage,
    Tab1,
    Tab2,
    Tab3,
    TabItemPage
  ]
})
export class AppModule {}
      `;

      const results = util.extractDeepLinkPathData(knownContent);

      expect(results[0].component).toEqual('FirstPage');
      expect(results[0].name).toEqual('first-page');
      expect(results[0].modulePath).toEqual(null);
      expect(results[0].namedExport).toEqual(null);

      expect(results[1].component).toEqual('AnotherPage');
      expect(results[1].name).toEqual('another-page');
      expect(results[1].modulePath).toEqual(null);
      expect(results[1].namedExport).toEqual(null);

      expect(results[2].component).toEqual('MyCmpTest');
      expect(results[2].name).toEqual('tab1-page1');
      expect(results[2].modulePath).toEqual(null);
      expect(results[2].namedExport).toEqual(null);

      expect(results[3].component).toEqual(null);
      expect(results[3].name).toEqual('full-page');
      expect(results[3].modulePath).toEqual('./pages/full-page/full-page.module');
      expect(results[3].namedExport).toEqual('LinkModule');

      expect(results[4].component).toEqual('PrimaryHeaderPage');
      expect(results[4].name).toEqual('primary-header-page');
      expect(results[4].modulePath).toEqual(null);
      expect(results[4].namedExport).toEqual(null);

      expect(results[5].component).toEqual('Tabs');
      expect(results[5].name).toEqual('tabs');
      expect(results[5].modulePath).toEqual(null);
      expect(results[5].namedExport).toEqual(null);

      expect(results[6].component).toEqual('Tab1');
      expect(results[6].name).toEqual('tab1');
      expect(results[6].modulePath).toEqual(null);
      expect(results[6].namedExport).toEqual(null);

      expect(results[7].component).toEqual('TabItemPage');
      expect(results[7].name).toEqual('item');
      expect(results[7].modulePath).toEqual(null);
      expect(results[7].namedExport).toEqual(null);
    });

    it('should throw an exception when there is an invalid deep link config', () => {
      // arrange
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
      { loadChildren: '../pages/home/home.module#HomePageModule'},
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
      { name: 'SomePage2', Component: MyComponent2 }
    ]
  });
}
      `;
      // act
      const knownMessage = 'Should never get here';
      try {
        util.extractDeepLinkPathData(fileContent);
        throw new Error(knownMessage);
      } catch (ex) {
        // assert
        expect(ex.message).not.toEqual(knownMessage);
      }
    });
  });

  describe('getDeepLinkData', () => {
    it('should return an empty list when no valid deep links are found', () => {

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
  return IonicModule.forRoot(MyApp, {});
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent, false);
      expect(result).toBeTruthy();
      expect(result.length).toEqual(0);
    });

    it('should return a hydrated deep link config', () => {

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
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
    ]
  });
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent, false);
      expect(result[0].modulePath).toEqual('../pages/home/home.module');
      expect(result[0].namedExport).toEqual('HomePageModule');
      expect(result[0].name).toEqual('Home');
      expect(result[0].component).toEqual(null);
      expect(result[0].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/home/home.module.ts');

      expect(result[1].modulePath).toEqual('../pages/page-one/page-one.module');
      expect(result[1].namedExport).toEqual('PageOneModule');
      expect(result[1].name).toEqual('PageOne');
      expect(result[1].component).toEqual(null);
      expect(result[1].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-one/page-one.module.ts');

      expect(result[2].modulePath).toEqual('../pages/page-two/page-two.module');
      expect(result[2].namedExport).toEqual('PageTwoModule');
      expect(result[2].name).toEqual('PageTwo');
      expect(result[2].component).toEqual(null);
      expect(result[2].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-two/page-two.module.ts');

      expect(result[3].modulePath).toEqual(null);
      expect(result[3].namedExport).toEqual(null);
      expect(result[3].name).toEqual('SomePage');
      expect(result[3].component).toEqual('MyComponent');
      expect(result[3].absolutePath).toEqual(null);
    });

    it('should return a deep link data adjusted for AoT', () => {

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
      { name: "PageOne", loadChildren: "../pages/page-one/page-one.module#PageOneModule" },
      { loadChildren: \`../pages/page-two/page-two.module#PageTwoModule\`, name: \`PageTwo\` },
      { Component: MyComponent, name: 'SomePage'},
    ]
  });
}
      `;

      const srcDir = '/Users/dan/Dev/myApp/src';
      const result = util.getDeepLinkData(join(srcDir, 'app/app.module.ts'), fileContent, true);
      expect(result[0].modulePath).toEqual('../pages/home/home.module.ngfactory');
      expect(result[0].namedExport).toEqual('HomePageModuleNgFactory');
      expect(result[0].name).toEqual('Home');
      expect(result[0].component).toEqual(null);
      expect(result[0].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/home/home.module.ngfactory.ts');

      expect(result[1].modulePath).toEqual('../pages/page-one/page-one.module.ngfactory');
      expect(result[1].namedExport).toEqual('PageOneModuleNgFactory');
      expect(result[1].name).toEqual('PageOne');
      expect(result[1].component).toEqual(null);
      expect(result[1].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-one/page-one.module.ngfactory.ts');

      expect(result[2].modulePath).toEqual('../pages/page-two/page-two.module.ngfactory');
      expect(result[2].namedExport).toEqual('PageTwoModuleNgFactory');
      expect(result[2].name).toEqual('PageTwo');
      expect(result[2].component).toEqual(null);
      expect(result[2].absolutePath).toEqual('/Users/dan/Dev/myApp/src/pages/page-two/page-two.module.ngfactory.ts');

      expect(result[3].modulePath).toEqual(null);
      expect(result[3].namedExport).toEqual(null);
      expect(result[3].name).toEqual('SomePage');
      expect(result[3].component).toEqual('MyComponent');
      expect(result[3].absolutePath).toEqual(null);
    });
  });

  describe('validateDeepLinks', () => {
    it('should return false when one entry is missing name', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: null,
       component: {}
      };
      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when one entry has empty name', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: '',
       component: {}
      };
      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when missing component and (modulePath or namedExport)', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: null,
       modulePath: null
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when missing component and (modulePath or namedExport)', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: '',
       modulePath: ''
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return false when missing component and has valid modulePath but missing namedExport', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: '',
       modulePath: 'somePath',
       namedExport: ''
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(false);
    });

    it('should return true when it has a valid modulePath and namedExport', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: '',
       modulePath: 'somePath',
       namedExport: 'someNamedExport'
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(true);
    });

    it('should return true when it has a valid component', () => {
      // arrange
      const invalidDeepLinkConfig: any = {
       name: 'someName',
       component: 'MyComponent',
       modulePath: null,
       namedExport: null
      };

      // act
      const result = util.validateDeepLinks([invalidDeepLinkConfig]);

      // assert
      expect(result).toEqual(true);
    });
  });

  describe('parseDeepLinkDecorator', () => {
    it('should return the decorator content from fully hydrated decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  name: 'someName',
  segment: 'someSegmentBro',
  defaultHistory: ['page-one', 'page-two'],
  priority: 'high'
})
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('someName');
      expect(result.segment).toEqual('someSegmentBro');
      expect(result.defaultHistory[0]).toEqual('page-one');
      expect(result.defaultHistory[1]).toEqual('page-two');
      expect(result.priority).toEqual('high');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should default to using class name when name is missing', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  segment: 'someSegmentBro',
  defaultHistory: ['page-one', 'page-two'],
  priority: 'high'
})
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual('someSegmentBro');
      expect(result.defaultHistory[0]).toEqual('page-one');
      expect(result.defaultHistory[1]).toEqual('page-two');
      expect(result.priority).toEqual('high');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return null segment when not in decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  defaultHistory: ['page-one', 'page-two'],
  priority: 'high'
})
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual(null);
      expect(result.defaultHistory[0]).toEqual('page-one');
      expect(result.defaultHistory[1]).toEqual('page-two');
      expect(result.priority).toEqual('high');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return empty array for defaultHistory when not in decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  priority: 'high'
})
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual(null);
      expect(result.defaultHistory).toBeTruthy();
      expect(result.defaultHistory.length).toEqual(0);
      expect(result.priority).toEqual('high');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return priority of low when not in decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
})
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual(null);
      expect(result.defaultHistory).toBeTruthy();
      expect(result.defaultHistory.length).toEqual(0);
      expect(result.priority).toEqual('low');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return correct defaults when no param passed to decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink()
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual(null);
      expect(result.defaultHistory).toBeTruthy();
      expect(result.defaultHistory.length).toEqual(0);
      expect(result.priority).toEqual('low');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should throw an error when multiple deeplink decorators are found', () => {

      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
})
@DeepLink({
})
@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);
      const knownErrorMsg = 'Should never get here';

      try {

        util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
        throw new Error(knownErrorMsg);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownErrorMsg);
      }
    });

    it('should return null when no deeplink decorator is found', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { DeepLink, NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  template: \`
  <ion-header>
    <ion-navbar>
      <ion-title>
        Ionic Blank
      </ion-title>
    </ion-navbar>
  </ion-header>

  <ion-content padding>
    The world is your oyster.
    <p>
      If you get lost, the <a href="http://ionicframework.com/docs/v2">docs</a> will be your guide.
    </p>
    <button ion-button (click)="nextPage()">Next Page</button>
  </ion-content>
  \`
})
export class HomePage {

  constructor(public navCtrl: NavController) {
  }

  nextPage() {
    this.navCtrl.push('PageOne');
    console.log()
  }
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);
      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result).toEqual(null);
    });

    it('should return null when there isn\'t a class declaration', () => {
      const knownContent = `
import {
  CallExpression,
  createSourceFile,
  Identifier,
  ImportClause,
  ImportDeclaration,
  ImportSpecifier,
  NamedImports,
  Node,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  SyntaxKind
} from 'typescript';

import { rangeReplace, stringSplice } from './helpers';

export function getTypescriptSourceFile(filePath: string, fileContent: string, languageVersion: ScriptTarget = ScriptTarget.Latest, setParentNodes: boolean = false): SourceFile {
  return createSourceFile(filePath, fileContent, languageVersion, setParentNodes);
}

export function removeDecorators(fileName: string, source: string): string {
  const sourceFile = createSourceFile(fileName, source, ScriptTarget.Latest);
  const decorators = findNodes(sourceFile, sourceFile, SyntaxKind.Decorator, true);
  decorators.sort((a, b) => b.pos - a.pos);
  decorators.forEach(d => {
    source = source.slice(0, d.pos) + source.slice(d.end);
  });

  return source;
}

      `;

      const knownPath = '/some/fake/path';

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);
      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result).toEqual(null);
    });
  });

  describe('getNgModuleDataFromCorrespondingPage', () => {
    it('should call the file cache with the path to an ngmodule', () => {
      const basePath = join('Some', 'Fake', 'Path');
      const pagePath = join(basePath, 'my-page', 'my-page.ts');
      const ngModulePath = join(basePath, 'my-page', 'my-page.module.ts');

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const result = util.getNgModulePathFromCorrespondingPage(pagePath);
      expect(result).toEqual(ngModulePath);
    });
  });

  describe('getNgModuleClassName', () => {
    it('should return the NgModule class name', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class HomePageModule {}
      `;

      const knownPath = '/Users/dan/idk/some-path.module.ts';

      const result = util.getNgModuleClassName(knownPath, knownContent);
      expect(result).toEqual('HomePageModule');
    });

    it('should return the NgModule class name when there are multiple class declarations but only one is decorated', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class HomePageModule {}

export class TacoBell {
  constructor() {
  }

  ionViewDidEnter() {
    console.log('tacos yo');
  }
}
      `;

      const knownPath = '/Users/dan/idk/some-path.module.ts';

      const result = util.getNgModuleClassName(knownPath, knownContent);
      expect(result).toEqual('HomePageModule');
    });

    it('should throw an error an NgModule isn\'t found', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

export class HomePageModule {}

      `;

      const knownPath = '/Users/dan/idk/some-path.module.ts';

      const knownError = 'Should never happen';
      try {
        util.getNgModuleClassName(knownPath, knownContent);
        throw new Error(knownError);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownError);
      }
    });

    it('should throw an error an multiple NgModules are found', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class HomePageModule {}

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    DeepLinkModule.forChild(HomePage),
  ]
})
export class TacoBellModule {}

      `;

      const knownPath = '/Users/dan/idk/some-path.module.ts';

      const knownError = 'Should never happen';
      try {
        util.getNgModuleClassName(knownPath, knownContent);
        throw new Error(knownError);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownError);
      }
    });
  });

  describe('getRelativePathToPageNgModuleFromAppNgModule', () => {
    const prefix = join('Users', 'dan', 'myApp', 'src');
    const appNgModulePath = join(prefix, 'app', 'app.module.ts');
    const pageNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
    const result = util.getRelativePathToPageNgModuleFromAppNgModule(appNgModulePath, pageNgModulePath);
    expect(result).toEqual('../pages/page-one/page-one.module.ts');
  });
});
