import { join } from 'path';
import * as util from './util';

import { FileCache } from '../util/file-cache';
import *  as helpers from '../util/helpers';
import { DeepLinkConfigEntry } from '../util/interfaces';
import * as tsUtils from '../util/typescript-utils';

describe('util', () => {
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

  describe('getNgModuleDataFromPage', () => {
    it('should throw when NgModule is not in cache', () => {
      const prefix = join('Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pagePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const fileCache = new FileCache();
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');
      const knownErrorMsg = 'Should never happen';
      try {
        util.getNgModuleDataFromPage(appNgModulePath, pagePath, fileCache, false);
        throw new Error(knownErrorMsg);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownErrorMsg);
      }
    });

    it('should return non-aot adjusted paths when not in AoT', () => {
      const pageNgModuleContent = `
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
      const prefix = join('Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pagePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const fileCache = new FileCache();
      fileCache.set(pageNgModulePath, { path: pageNgModulePath, content: pageNgModuleContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const result = util.getNgModuleDataFromPage(appNgModulePath, pagePath, fileCache, false);

      expect(result.absolutePath).toEqual(pageNgModulePath);
      expect(result.userlandModulePath).toEqual('../pages/page-one/page-one.module');
      expect(result.className).toEqual('HomePageModule');
    });

    it('should return adjusted paths to account for AoT', () => {
      const pageNgModuleContent = `
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
      const prefix = join('Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pagePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const fileCache = new FileCache();
      fileCache.set(pageNgModulePath, { path: pageNgModulePath, content: pageNgModuleContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const result = util.getNgModuleDataFromPage(appNgModulePath, pagePath, fileCache, true);
      expect(result.absolutePath).toEqual(helpers.changeExtension(pageNgModulePath, '.ngfactory.ts'));
      expect(result.userlandModulePath).toEqual('../pages/page-one/page-one.module.ngfactory');
      expect(result.className).toEqual('HomePageModuleNgFactory');
    });
  });

  describe('getDeepLinkData', () => {
    it('should return an empty list when no deep link decorators are found', () => {

      const pageOneContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';


@Component({
  selector: 'page-page-one',
  templateUrl: './page-one.html'
})
export class PageOne {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  nextPage() {
    this.navCtrl.push('PageTwo');
  }

  previousPage() {
    this.navCtrl.pop();
  }

}
      `;

      const pageOneNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageOne } from './page-one';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    DeepLinkModule.forChild(PageOne)
  ],
  entryComponents: [
    PageOne
  ]
})
export class PageOneModule {}

      `;

      const pageTwoContent = `
import { Component } from '@angular/core';
import { LoadingController, ModalController, NavController, PopoverController } from 'ionic-angular';


@Component({
  selector: 'page-page-two',
  templateUrl: './page-two.html'
})
export class PageTwo {

  constructor(public loadingController: LoadingController, public modalController: ModalController, public navCtrl: NavController, public popoverCtrl: PopoverController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

  showLoader() {
    const viewController = this.loadingController.create({
      duration: 2000
    });

    viewController.present();
  }

  openModal() {
    /*const viewController = this.modalController.create('PageThree');
    viewController.present();
    */

    const viewController = this.popoverCtrl.create('PageThree');
    viewController.present();


    //this.navCtrl.push('PageThree');
  }
}

      `;

      const pageTwoNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageTwo } from './page-two';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    DeepLinkModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';

/*
  Generated class for the PageTwo page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-three',
  templateUrl: './page-three.html'
})
export class PageThree {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

}

      `;

      const pageSettingsNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageThree } from './page-three';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    DeepLinkModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const prefix = join('Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pageOnePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(prefix, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(prefix, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(prefix, 'pages', 'settings-page', 'settings-page.module.ts');
      const pageSettingsPath = join(prefix, 'pages', 'settings-page', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const results = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(Array.isArray(results)).toBeTruthy();
      expect(results.length).toEqual(0);
    });

    it('should return an a list of deeplink configs from all pages that have them, and not include pages that dont', () => {

      const pageOneContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';


@DeepLink({
  name: 'SomeOtherName'
})
@Component({
  selector: 'page-page-one',
  templateUrl: './page-one.html'
})
export class PageOne {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  nextPage() {
    this.navCtrl.push('PageTwo');
  }

  previousPage() {
    this.navCtrl.pop();
  }

}
      `;

      const pageOneNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageOne } from './page-one';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    DeepLinkModule.forChild(PageOne)
  ],
  entryComponents: [
    PageOne
  ]
})
export class PageOneModule {}

      `;

      const pageTwoContent = `
import { Component } from '@angular/core';
import { LoadingController, ModalController, NavController, PopoverController } from 'ionic-angular';


@Component({
  selector: 'page-page-two',
  templateUrl: './page-two.html'
})
export class PageTwo {

  constructor(public loadingController: LoadingController, public modalController: ModalController, public navCtrl: NavController, public popoverCtrl: PopoverController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

  showLoader() {
    const viewController = this.loadingController.create({
      duration: 2000
    });

    viewController.present();
  }

  openModal() {
    /*const viewController = this.modalController.create('PageThree');
    viewController.present();
    */

    const viewController = this.popoverCtrl.create('PageThree');
    viewController.present();


    //this.navCtrl.push('PageThree');
  }
}

      `;

      const pageTwoNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageTwo } from './page-two';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    DeepLinkModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  segment: 'someSegmentBro',
  defaultHistory: ['page-one', 'page-two'],
  priority: 'high'
})
@Component({
  selector: 'page-three',
  templateUrl: './page-three.html'
})
export class PageThree {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

}

      `;

      const pageSettingsNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageThree } from './page-three';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    DeepLinkModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const prefix = join('Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pageOnePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(prefix, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(prefix, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(prefix, 'pages', 'settings-page', 'settings-page.module.ts');
      const pageSettingsPath = join(prefix, 'pages', 'settings-page', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const results = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(results.length).toEqual(2);
    });

    it('should return an a list of deeplink configs from all pages that have them', () => {

      const pageOneContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';


@DeepLink({
  name: 'SomeOtherName'
})
@Component({
  selector: 'page-page-one',
  templateUrl: './page-one.html'
})
export class PageOne {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  nextPage() {
    this.navCtrl.push('PageTwo');
  }

  previousPage() {
    this.navCtrl.pop();
  }

}
      `;

      const pageOneNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageOne } from './page-one';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    DeepLinkModule.forChild(PageOne)
  ],
  entryComponents: [
    PageOne
  ]
})
export class PageOneModule {}

      `;

      const pageTwoContent = `
import { Component } from '@angular/core';
import { LoadingController, ModalController, NavController, PopoverController } from 'ionic-angular';



@Component({
  selector: 'page-page-two',
  templateUrl: './page-two.html'
})
@DeepLink()
export class PageTwo {

  constructor(public loadingController: LoadingController, public modalController: ModalController, public navCtrl: NavController, public popoverCtrl: PopoverController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

  showLoader() {
    const viewController = this.loadingController.create({
      duration: 2000
    });

    viewController.present();
  }

  openModal() {
    /*const viewController = this.modalController.create('PageThree');
    viewController.present();
    */

    const viewController = this.popoverCtrl.create('PageThree');
    viewController.present();


    //this.navCtrl.push('PageThree');
  }
}

      `;

      const pageTwoNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageTwo } from './page-two';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    DeepLinkModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  segment: 'someSegmentBro',
  defaultHistory: ['page-one', 'page-two'],
  priority: 'high'
})
@Component({
  selector: 'page-three',
  templateUrl: './page-three.html'
})
export class PageThree {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

}

      `;

      const pageSettingsNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageThree } from './page-three';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    DeepLinkModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const prefix = join('/Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pageOnePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(prefix, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(prefix, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(prefix, 'pages', 'settings-page', 'fake-dir', 'settings-page.module.ts');
      const pageSettingsPath = join(prefix, 'pages', 'settings-page', 'fake-dir', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const results = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(results.length).toEqual(3);

      expect(results[0].name).toEqual('SomeOtherName');
      expect(results[0].segment).toEqual(null);
      expect(results[0].priority).toEqual('low');
      expect(results[0].defaultHistory.length).toEqual(0);
      expect(results[0].absolutePath).toEqual('/Users/dan/myApp/src/pages/page-one/page-one.module.ts');
      expect(results[0].userlandModulePath).toEqual('../pages/page-one/page-one.module');
      expect(results[0].className).toEqual('PageOneModule');

      expect(results[1].name).toEqual('PageTwo');
      expect(results[1].segment).toEqual(null);
      expect(results[1].priority).toEqual('low');
      expect(results[1].defaultHistory.length).toEqual(0);
      expect(results[1].absolutePath).toEqual('/Users/dan/myApp/src/pages/page-two/page-two.module.ts');
      expect(results[1].userlandModulePath).toEqual('../pages/page-two/page-two.module');
      expect(results[1].className).toEqual('PageTwoModule');

      expect(results[2].name).toEqual('PageThree');
      expect(results[2].segment).toEqual('someSegmentBro');
      expect(results[2].priority).toEqual('high');
      expect(results[2].defaultHistory.length).toEqual(2);
      expect(results[2].defaultHistory[0]).toEqual('page-one');
      expect(results[2].defaultHistory[1]).toEqual('page-two');
      expect(results[2].absolutePath).toEqual('/Users/dan/myApp/src/pages/settings-page/fake-dir/settings-page.module.ts');
      expect(results[2].userlandModulePath).toEqual('../pages/settings-page/fake-dir/settings-page.module');
      expect(results[2].className).toEqual('PageThreeModule');
    });

    it('should throw when it cant find an NgModule as a peer to the page with a deep link config', () => {
      const pageOneContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';


@DeepLink({
  name: 'SomeOtherName'
})
@Component({
  selector: 'page-page-one',
  templateUrl: './page-one.html'
})
export class PageOne {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  nextPage() {
    this.navCtrl.push('PageTwo');
  }

  previousPage() {
    this.navCtrl.pop();
  }

}
      `;

      const pageOneNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageOne } from './page-one';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    DeepLinkModule.forChild(PageOne)
  ],
  entryComponents: [
    PageOne
  ]
})
export class PageOneModule {}

      `;

      const pageTwoContent = `
import { Component } from '@angular/core';
import { LoadingController, ModalController, NavController, PopoverController } from 'ionic-angular';



@Component({
  selector: 'page-page-two',
  templateUrl: './page-two.html'
})
@DeepLink()
export class PageTwo {

  constructor(public loadingController: LoadingController, public modalController: ModalController, public navCtrl: NavController, public popoverCtrl: PopoverController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

  showLoader() {
    const viewController = this.loadingController.create({
      duration: 2000
    });

    viewController.present();
  }

  openModal() {
    /*const viewController = this.modalController.create('PageThree');
    viewController.present();
    */

    const viewController = this.popoverCtrl.create('PageThree');
    viewController.present();


    //this.navCtrl.push('PageThree');
  }
}

      `;

      const pageTwoNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageTwo } from './page-two';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    DeepLinkModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { DeepLink, NavController } from 'ionic-angular';

@DeepLink({
  segment: 'someSegmentBro',
  defaultHistory: ['page-one', 'page-two'],
  priority: 'high'
})
@Component({
  selector: 'page-three',
  templateUrl: './page-three.html'
})
export class PageThree {

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
  }

  goBack() {
    this.navCtrl.pop();
  }

}

      `;

      const pageSettingsNgModuleContent = `
import { NgModule } from '@angular/core';
import { PageThree } from './page-three';
import { DeepLinkModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    DeepLinkModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const prefix = join('/Users', 'dan', 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.not-module.ts');
      const pageOnePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(prefix, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(prefix, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(prefix, 'pages', 'settings-page', 'fake-dir', 'settings-page.module.ts');
      const pageSettingsPath = join(prefix, 'pages', 'settings-page', 'fake-dir', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const knownError = 'should never get here';

      try {
        util.getDeepLinkData(appNgModulePath, fileCache, false);
        throw new Error(knownError);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownError);
      }
    });
  });

  describe('hasExistingDeepLinkConfig', () => {
    it('should return true when there is an existing deep link config', () => {
      const knownContent = `
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePageModule } from '../pages/home/home.module';

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {}, {
      links: [
        { loadChildren: '../pages/page-one/page-one.module#PageOneModule', name: 'PageOne' },
        { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo' },
        { loadChildren: '../pages/page-three/page-three.module#PageThreeModule', name: 'PageThree' }
      ]
    }),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = '/idk/yo/some/path';

      const result = util.hasExistingDeepLinkConfig(knownPath, knownContent);
      expect(result).toEqual(true);
    });


    it('should return false when there isnt a deeplink config', () => {
      const knownContent = `
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePageModule } from '../pages/home/home.module';

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {}),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = '/idk/yo/some/path';

      const result = util.hasExistingDeepLinkConfig(knownPath, knownContent);
      expect(result).toEqual(false);
    });

    it('should return false when null/undefined is passed in place on deeplink config', () => {
      const knownContent = `
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePageModule } from '../pages/home/home.module';

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {}, null),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = '/idk/yo/some/path';

      const result = util.hasExistingDeepLinkConfig(knownPath, knownContent);
      expect(result).toEqual(false);
    });
  });

  describe('convertDeepLinkEntryToJsObjectString', () => {
    it('should convert to a flat string format', () => {
      const entry: DeepLinkConfigEntry = {
        name: 'HomePage',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: '/Users/dan/test/taco',
        userlandModulePath: '../pages/home-page/home-page.module',
        className: 'HomePageModule'
      };

      const result = util.convertDeepLinkEntryToJsObjectString(entry);
      expect(result).toEqual(`{ loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: null, priority: 'low', defaultHistory: [] }`);
    });

    it('should handle defaultHistory entries and segment', () => {
      const entry: DeepLinkConfigEntry = {
        name: 'HomePage',
        segment: 'idkMan',
        defaultHistory: ['page-two', 'page-three', 'page-four'],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: '/Users/dan/test/taco',
        userlandModulePath: '../pages/home-page/home-page.module',
        className: 'HomePageModule'
      };

      const result = util.convertDeepLinkEntryToJsObjectString(entry);
      expect(result).toEqual(`{ loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] }`);
    });
  });

  describe('convertDeepLinkConfigEntriesToString', () => {
    it('should convert list of decorator data to legacy ionic data structure as a string', () => {
      const list: DeepLinkConfigEntry[] = [];
      list.push({
        name: 'HomePage',
        segment: 'idkMan',
        defaultHistory: ['page-two', 'page-three', 'page-four'],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: '/Users/dan/test/taco',
        userlandModulePath: '../pages/home-page/home-page.module',
        className: 'HomePageModule'
      });
      list.push({
        name: 'PageTwo',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: '/Users/dan/test/taco',
        userlandModulePath: '../pages/page-two/page-two.module',
        className: 'PageTwoModule'
      });
      list.push({
        name: 'SettingsPage',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: '/Users/dan/test/taco',
        userlandModulePath: '../pages/settings-page/setting-page.module',
        className: 'SettingsPageModule'
      });

      const result = util.convertDeepLinkConfigEntriesToString(list);
      expect(result).toBeTruthy();
      /*expect(result).toEqual(`{
        links: [
          { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
          { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
          { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
        ]
      }`);
      */
    });
  });
});
