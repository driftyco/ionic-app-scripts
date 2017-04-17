import { join } from 'path';

import * as util from './util';
import * as transpile from '../transpile';

import * as Constants from '../util/constants';
import { FileCache } from '../util/file-cache';
import *  as helpers from '../util/helpers';
import { BuildContext, ChangedFile, DeepLinkConfigEntry } from '../util/interfaces';
import * as tsUtils from '../util/typescript-utils';

describe('util', () => {
  describe('filterTypescriptFilesForDeepLinks', () => {
    it('should return a list of files that are in the directory specified for deeplinking', () => {
      const pagesDir = join(process.cwd(), 'myApp', 'src', 'pages');

      const knownFileContent = 'Some string';
      const pageOneTs = join(pagesDir, 'page-one', 'page-one.ts');
      const pageOneHtml = join(pagesDir, 'page-one', 'page-one.html');
      const pageOneModule = join(pagesDir, 'page-one', 'page-one.module.ts');

      const pageTwoTs = join(pagesDir, 'page-two', 'page-two.ts');
      const pageTwoHtml = join(pagesDir, 'page-two', 'page-two.html');
      const pageTwoModule = join(pagesDir, 'page-two', 'page-two.module.ts');

      const pageThreeTs = join(pagesDir, 'page-three', 'page-three.ts');
      const pageThreeHtml = join(pagesDir, 'page-three', 'page-three.html');
      const pageThreeModule = join(pagesDir, 'page-three', 'page-three.module.ts');

      const someOtherFile = join('Users', 'hans-gruber', 'test.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOneTs, { path: pageOneTs, content: knownFileContent});
      fileCache.set(pageOneHtml, { path: pageOneHtml, content: knownFileContent});
      fileCache.set(pageOneModule, { path: pageOneModule, content: knownFileContent});
      fileCache.set(pageTwoTs, { path: pageTwoTs, content: knownFileContent});
      fileCache.set(pageTwoHtml, { path: pageTwoHtml, content: knownFileContent});
      fileCache.set(pageTwoModule, { path: pageTwoModule, content: knownFileContent});
      fileCache.set(pageThreeTs, { path: pageThreeTs, content: knownFileContent});
      fileCache.set(pageThreeHtml, { path: pageThreeHtml, content: knownFileContent});
      fileCache.set(pageThreeModule, { path: pageThreeModule, content: knownFileContent});
      fileCache.set(someOtherFile, { path: someOtherFile, content: knownFileContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValues(pagesDir, '.module.ts');

      const results = util.filterTypescriptFilesForDeepLinks(fileCache);
      expect(results.length).toEqual(3);
      expect(results[0].path).toEqual(pageOneTs);
      expect(results[1].path).toEqual(pageTwoTs);
      expect(results[2].path).toEqual(pageThreeTs);
    });
  });
  describe('parseDeepLinkDecorator', () => {
    it('should return the decorator content from fully hydrated decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

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

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

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

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual('path');
      expect(result.defaultHistory[0]).toEqual('page-one');
      expect(result.defaultHistory[1]).toEqual('page-two');
      expect(result.priority).toEqual('high');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return empty array for defaultHistory when not in decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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

      const knownPath = join(process.cwd(), 'myApp', 'src', 'pages', 'about.ts');

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual('about');
      expect(result.defaultHistory).toBeTruthy();
      expect(result.defaultHistory.length).toEqual(0);
      expect(result.priority).toEqual('high');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return priority of low when not in decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual('path');
      expect(result.defaultHistory).toBeTruthy();
      expect(result.defaultHistory.length).toEqual(0);
      expect(result.priority).toEqual('low');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should return correct defaults when no param passed to decorator', () => {
      const knownContent = `
import { Component } from '@angular/core';

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage()
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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path.ts');

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);

      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result.name).toEqual('HomePage');
      expect(result.segment).toEqual('path');
      expect(result.defaultHistory).toBeTruthy();
      expect(result.defaultHistory.length).toEqual(0);
      expect(result.priority).toEqual('low');
      expect(knownContent.indexOf(result.rawString)).toBeGreaterThan(-1);

    });

    it('should throw an error when multiple deeplink decorators are found', () => {

      const knownContent = `
import { Component } from '@angular/core';

import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
})
@IonicPage({
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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

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

import { IonicPage, NavController } from 'ionic-angular';

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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

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

      const knownPath = join(process.cwd(), 'some', 'fake', 'path');

      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);
      const result = util.getDeepLinkDecoratorContentForSourceFile(sourceFile);
      expect(result).toEqual(null);
    });
  });

  describe('getNgModuleDataFromCorrespondingPage', () => {
    it('should call the file cache with the path to an ngmodule', () => {
      const basePath = join(process.cwd(), 'some', 'fake', 'path');
      const pagePath = join(basePath, 'my-page', 'my-page.ts');
      const ngModulePath = join(basePath, 'my-page', 'my-page.module.ts');

      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const result = util.getNgModulePathFromCorrespondingPage(pagePath);
      expect(result).toEqual(ngModulePath);
    });
  });

  describe('getRelativePathToPageNgModuleFromAppNgModule', () => {
    it('should return the relative path', () => {
      const prefix = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const result = util.getRelativePathToPageNgModuleFromAppNgModule(appNgModulePath, pageNgModulePath);
      expect(result).toEqual(join('..', 'pages', 'page-one', 'page-one.module.ts'));
    });
  });

  describe('getNgModuleDataFromPage', () => {
    it('should throw when NgModule is not in cache and create default ngModule flag is off', () => {
      const prefix = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pagePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const knownClassName = 'PageOne';
      const fileCache = new FileCache();
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const knownErrorMsg = 'Should never happen';
      try {
        util.getNgModuleDataFromPage(appNgModulePath, pagePath, knownClassName, fileCache, false);
        throw new Error(knownErrorMsg);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownErrorMsg);
      }
    });

    it('should return non-aot adjusted paths when not in AoT', () => {
      const pageNgModuleContent = `
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
  ]
})
export class HomePageModule {}
      `;
      const prefix = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pagePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const knownClassName = 'PageOne';
      const fileCache = new FileCache();
      fileCache.set(pageNgModulePath, { path: pageNgModulePath, content: pageNgModuleContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const result = util.getNgModuleDataFromPage(appNgModulePath, pagePath, knownClassName, fileCache, false);

      expect(result.absolutePath).toEqual(pageNgModulePath);
      expect(result.userlandModulePath).toEqual('../pages/page-one/page-one.module');
      expect(result.className).toEqual('HomePageModule');
    });

    it('should return adjusted paths to account for AoT', () => {
      const pageNgModuleContent = `
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
  ]
})
export class HomePageModule {}
      `;
      const prefix = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(prefix, 'app', 'app.module.ts');
      const pageNgModulePath = join(prefix, 'pages', 'page-one', 'page-one.module.ts');
      const pagePath = join(prefix, 'pages', 'page-one', 'page-one.ts');
      const knownClassName = 'PageOne';
      const fileCache = new FileCache();
      fileCache.set(pageNgModulePath, { path: pageNgModulePath, content: pageNgModuleContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue('.module.ts');

      const result = util.getNgModuleDataFromPage(appNgModulePath, pagePath, knownClassName, fileCache, true);
      expect(result.absolutePath).toEqual(helpers.changeExtension(pageNgModulePath, '.ngfactory.ts'));
      expect(result.userlandModulePath).toEqual('../pages/page-one/page-one.module.ngfactory');
      expect(result.className).toEqual('HomePageModuleNgFactory');
    });
  });

  describe('getDeepLinkData', () => {
    it('should return an empty list when no deep link decorators are found', () => {

      const pageOneContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';


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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    IonicPageModule.forChild(PageOne)
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    IonicPageModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    IonicPageModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const prefix = join(process.cwd(), 'myApp', 'src');
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
import { IonicPage, NavController } from 'ionic-angular';


@IonicPage({
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    IonicPageModule.forChild(PageOne)
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    IonicPageModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    IonicPageModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const srcDir = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(srcDir, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(srcDir, 'pages', 'page-one', 'page-one.module.ts');
      const pageOnePath = join(srcDir, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(srcDir, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(srcDir, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(srcDir, 'pages', 'settings-page', 'settings-page.module.ts');
      const pageSettingsPath = join(srcDir, 'pages', 'settings-page', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.callFake((input: string) => {
        if (input === Constants.ENV_VAR_DEEPLINKS_DIR) {
          return srcDir;
        } else {
          return '.module.ts';
        }
      });

      const results = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(results.length).toEqual(2);
    });

    it('should return an a list of deeplink configs from all pages that have them', () => {

      const pageOneContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';


@IonicPage({
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    IonicPageModule.forChild(PageOne)
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
@IonicPage()
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    IonicPageModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    IonicPageModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const srcDir = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(srcDir, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(srcDir, 'pages', 'page-one', 'page-one.module.ts');
      const pageOnePath = join(srcDir, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(srcDir, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(srcDir, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(srcDir, 'pages', 'settings-page', 'fake-dir', 'settings-page.module.ts');
      const pageSettingsPath = join(srcDir, 'pages', 'settings-page', 'fake-dir', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.callFake((input: string) => {
        if (input === Constants.ENV_VAR_DEEPLINKS_DIR) {
          return srcDir;
        } else {
          return '.module.ts';
        }
      });

      const results = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(results.length).toEqual(3);

      expect(results[0].name).toEqual('SomeOtherName');
      expect(results[0].segment).toEqual('page-one');
      expect(results[0].priority).toEqual('low');
      expect(results[0].defaultHistory.length).toEqual(0);
      expect(results[0].absolutePath).toEqual(join(srcDir, 'pages', 'page-one', 'page-one.module.ts'));
      expect(results[0].userlandModulePath).toEqual('../pages/page-one/page-one.module');
      expect(results[0].className).toEqual('PageOneModule');

      expect(results[1].name).toEqual('PageTwo');
      expect(results[1].segment).toEqual('page-two');
      expect(results[1].priority).toEqual('low');
      expect(results[1].defaultHistory.length).toEqual(0);
      expect(results[1].absolutePath).toEqual(join(srcDir, 'pages', 'page-two', 'page-two.module.ts'));
      expect(results[1].userlandModulePath).toEqual('../pages/page-two/page-two.module');
      expect(results[1].className).toEqual('PageTwoModule');

      expect(results[2].name).toEqual('PageThree');
      expect(results[2].segment).toEqual('someSegmentBro');
      expect(results[2].priority).toEqual('high');
      expect(results[2].defaultHistory.length).toEqual(2);
      expect(results[2].defaultHistory[0]).toEqual('page-one');
      expect(results[2].defaultHistory[1]).toEqual('page-two');
      expect(results[2].absolutePath).toEqual(join(srcDir, 'pages', 'settings-page', 'fake-dir', 'settings-page.module.ts'));
      expect(results[2].userlandModulePath).toEqual('../pages/settings-page/fake-dir/settings-page.module');
      expect(results[2].className).toEqual('PageThreeModule');
    });

    it('should throw when it cant find an NgModule as a peer to the page with a deep link config', () => {
      const pageOneContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';


@IonicPage({
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    IonicPageModule.forChild(PageOne)
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
@IonicPage()
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageTwo,
  ],
  imports: [
    IonicPageModule.forChild(PageTwo)
  ]
})
export class PageTwoModule {

}
      `;

      const pageSettingsContent = `
import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

@IonicPage({
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
import { IonicPageModule } from 'ionic-angular';

@NgModule({
  declarations: [
    PageThree,
  ],
  imports: [
    IonicPageModule.forChild(PageThree)
  ]
})
export class PageThreeModule {

}

      `;

      const srcDir = join(process.cwd(), 'myApp', 'src');
      const appNgModulePath = join(srcDir, 'app', 'app.module.ts');
      const pageOneNgModulePath = join(srcDir, 'pages', 'page-one', 'page-one.not-module.ts');
      const pageOnePath = join(srcDir, 'pages', 'page-one', 'page-one.ts');
      const pageTwoNgModulePath = join(srcDir, 'pages', 'page-two', 'page-two.module.ts');
      const pageTwoPath = join(srcDir, 'pages', 'page-two', 'page-two.ts');
      const pageSettingsNgModulePath = join(srcDir, 'pages', 'settings-page', 'fake-dir', 'settings-page.module.ts');
      const pageSettingsPath = join(srcDir, 'pages', 'settings-page', 'fake-dir', 'settings-page.ts');

      const fileCache = new FileCache();
      fileCache.set(pageOnePath, { path: pageOnePath, content: pageOneContent});
      fileCache.set(pageOneNgModulePath, { path: pageOneNgModulePath, content: pageOneNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageTwoPath, { path: pageTwoPath, content: pageTwoContent});
      fileCache.set(pageTwoNgModulePath, { path: pageTwoNgModulePath, content: pageTwoNgModuleContent});
      fileCache.set(pageSettingsPath, { path: pageSettingsPath, content: pageSettingsContent});
      fileCache.set(pageSettingsNgModulePath, { path: pageSettingsNgModulePath, content: pageSettingsNgModuleContent});

      spyOn(helpers, helpers.getStringPropertyValue.name).and.callFake((input: string) => {
        if (input === Constants.ENV_VAR_DEEPLINKS_DIR) {
          return srcDir;
        } else {
          return '.module.ts';
        }
      });

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

      const knownPath = join(process.cwd(), 'idk', 'some', 'fake', 'path');

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

      const knownPath = join(process.cwd(), 'idk', 'some', 'fake', 'path');

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
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
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
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
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
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
        userlandModulePath: '../pages/home-page/home-page.module',
        className: 'HomePageModule'
      });
      list.push({
        name: 'PageTwo',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
        userlandModulePath: '../pages/page-two/page-two.module',
        className: 'PageTwoModule'
      });
      list.push({
        name: 'SettingsPage',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
        userlandModulePath: '../pages/settings-page/setting-page.module',
        className: 'SettingsPageModule'
      });

      const result = util.convertDeepLinkConfigEntriesToString(list);
      expect(result.indexOf('links: [')).toBeGreaterThanOrEqual(0);
      expect(result.indexOf(`{ loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },`)).toBeGreaterThanOrEqual(0);
      expect(result.indexOf(`{ loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },`)).toBeGreaterThanOrEqual(0);
      expect(result.indexOf(`{ loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }`)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUpdatedAppNgModuleContentWithDeepLinkConfig', () => {
    it('should add a default argument for the second param of forRoot, then add the deeplink config', () => {
      const knownStringToInject = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

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
    IonicModule.forRoot(MyApp),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const expectedResult = `
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
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = join('some', 'fake', 'path');

      const result = util.getUpdatedAppNgModuleContentWithDeepLinkConfig(knownPath, knownContent, knownStringToInject);
      expect(result).toEqual(expectedResult);

    });

    it('should append the deeplink config as the third argument when second arg is null', () => {
      const knownStringToInject = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

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
    IonicModule.forRoot(MyApp, null),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const expectedResult = `
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
    IonicModule.forRoot(MyApp, null, {
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = join('some', 'fake', 'path');

      const result = util.getUpdatedAppNgModuleContentWithDeepLinkConfig(knownPath, knownContent, knownStringToInject);
      expect(result).toEqual(expectedResult);

    });

    it('should append the deeplink config as the third argument when second arg is object', () => {
      const knownStringToInject = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

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

      const expectedResult = `
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
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = join('some', 'fake', 'path');

      const result = util.getUpdatedAppNgModuleContentWithDeepLinkConfig(knownPath, knownContent, knownStringToInject);
      expect(result).toEqual(expectedResult);

    });

    it('should replace the third argument with deeplink config', () => {
      const knownStringToInject = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

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

      const expectedResult = `
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
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = join('some', 'fake', 'path');

      const result = util.getUpdatedAppNgModuleContentWithDeepLinkConfig(knownPath, knownContent, knownStringToInject);
      expect(result).toEqual(expectedResult);

    });
  });

  describe('getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig', () => {
    it('should find and replace the content for DeepLinkConfigToken when existing content is null', () => {

      const knownDeepLinkString = `this._DeepLinkConfigToken_21 = (null as any);`;

      const knownContent = `
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties}
 */
 /* tslint:disable */

import * as import0 from '@angular/core';
import * as import1 from './app.module';
import * as import2 from '@angular/common';
import * as import3 from '@angular/platform-browser';
import * as import4 from '@angular/forms';
import * as import5 from 'ionic-angular/index';
import * as import6 from '../pages/home/home.module';
import * as import7 from 'ionic-angular/platform/dom-controller';
import * as import8 from 'ionic-angular/components/menu/menu-controller';
import * as import9 from 'ionic-angular/components/app/app';
import * as import10 from 'ionic-angular/gestures/gesture-controller';
import * as import11 from 'ionic-angular/util/ng-module-loader';
import * as import12 from 'ionic-angular/components/action-sheet/action-sheet-controller';
import * as import13 from 'ionic-angular/components/alert/alert-controller';
import * as import14 from 'ionic-angular/util/events';
import * as import15 from 'ionic-angular/util/form';
import * as import16 from 'ionic-angular/tap-click/haptic';
import * as import17 from 'ionic-angular/platform/keyboard';
import * as import18 from 'ionic-angular/components/loading/loading-controller';
import * as import19 from 'ionic-angular/components/modal/modal-controller';
import * as import20 from 'ionic-angular/components/picker/picker-controller';
import * as import21 from 'ionic-angular/components/popover/popover-controller';
import * as import22 from 'ionic-angular/tap-click/tap-click';
import * as import23 from 'ionic-angular/components/toast/toast-controller';
import * as import24 from 'ionic-angular/transitions/transition-controller';
import * as import25 from '../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory';
import * as import26 from '../../node_modules/ionic-angular/components/alert/alert-component.ngfactory';
import * as import27 from '../../node_modules/ionic-angular/components/app/app-root.ngfactory';
import * as import28 from '../../node_modules/ionic-angular/components/loading/loading-component.ngfactory';
import * as import29 from '../../node_modules/ionic-angular/components/modal/modal-component.ngfactory';
import * as import30 from '../../node_modules/ionic-angular/components/picker/picker-component.ngfactory';
import * as import31 from '../../node_modules/ionic-angular/components/popover/popover-component.ngfactory';
import * as import32 from '../../node_modules/ionic-angular/components/toast/toast-component.ngfactory';
import * as import33 from '../pages/home/home.ngfactory';
import * as import34 from './app.component.ngfactory';
import * as import35 from '../pages/home/home';
import * as import36 from './app.component';
import * as import37 from 'ionic-angular/navigation/url-serializer';
import * as import38 from 'ionic-angular/navigation/deep-linker';
import * as import39 from 'ionic-angular/platform/platform-registry';
import * as import40 from 'ionic-angular/platform/platform';
import * as import41 from 'ionic-angular/config/config';
import * as import42 from 'ionic-angular/util/module-loader';
import * as import43 from 'ionic-angular/config/mode-registry';
import * as import44 from 'ionic-angular/components/app/app-root';
class AppModuleInjector extends import0.ɵNgModuleInjector<import1.AppModule> {
  _CommonModule_0:import2.CommonModule;
  _ApplicationModule_1:import0.ApplicationModule;
  _BrowserModule_2:import3.BrowserModule;
  _ɵba_3:import4.ɵba;
  _FormsModule_4:import4.FormsModule;
  _ReactiveFormsModule_5:import4.ReactiveFormsModule;
  _IonicModule_6:import5.IonicModule;
  _IonicPageModule_7:import5.IonicPageModule;
  _HomePageModule_8:import6.HomePageModule;
  _AppModule_9:import1.AppModule;
  __LOCALE_ID_10:any;
  __NgLocalization_11:import2.NgLocaleLocalization;
  _ErrorHandler_12:any;
  _ConfigToken_13:any;
  _PlatformConfigToken_14:any;
  _Platform_15:any;
  _Config_16:any;
  _DomController_17:import7.DomController;
  _MenuController_18:import8.MenuController;
  _App_19:import9.App;
  _GestureController_20:import10.GestureController;
  _DeepLinkConfigToken_21:any;
  _Compiler_22:import0.Compiler;
  _NgModuleLoader_23:import11.NgModuleLoader;
  _ModuleLoader_24:any;
  _APP_INITIALIZER_25:any[];
  _ApplicationInitStatus_26:import0.ApplicationInitStatus;
  _ɵf_27:import0.ɵf;
  __ApplicationRef_28:any;
  __APP_ID_29:any;
  __IterableDiffers_30:any;
  __KeyValueDiffers_31:any;
  __DomSanitizer_32:import3.ɵe;
  __Sanitizer_33:any;
  __HAMMER_GESTURE_CONFIG_34:import3.HammerGestureConfig;
  __EVENT_MANAGER_PLUGINS_35:any[];
  __EventManager_36:import3.EventManager;
  _ɵDomSharedStylesHost_37:import3.ɵDomSharedStylesHost;
  __ɵDomRendererFactoryV2_38:import3.ɵDomRendererFactoryV2;
  __RendererFactoryV2_39:any;
  __ɵSharedStylesHost_40:any;
  __Testability_41:import0.Testability;
  __Meta_42:import3.Meta;
  __Title_43:import3.Title;
  __ɵi_44:import4.ɵi;
  __FormBuilder_45:import4.FormBuilder;
  __LAZY_LOADED_TOKEN_46:any;
  __AppRootToken_47:any;
  __APP_BASE_HREF_48:any;
  __ActionSheetController_49:import12.ActionSheetController;
  __AlertController_50:import13.AlertController;
  __Events_51:import14.Events;
  __Form_52:import15.Form;
  __Haptic_53:import16.Haptic;
  __Keyboard_54:import17.Keyboard;
  __LoadingController_55:import18.LoadingController;
  __LocationStrategy_56:any;
  __Location_57:import2.Location;
  __UrlSerializer_58:any;
  __DeepLinker_59:any;
  __ModalController_60:import19.ModalController;
  __PickerController_61:import20.PickerController;
  __PopoverController_62:import21.PopoverController;
  __TapClick_63:import22.TapClick;
  __ToastController_64:import23.ToastController;
  __TransitionController_65:import24.TransitionController;
  constructor(parent:import0.Injector) {
    super(parent,[
      import25.ActionSheetCmpNgFactory,
      import26.AlertCmpNgFactory,
      import27.IonicAppNgFactory,
      import28.LoadingCmpNgFactory,
      import29.ModalCmpNgFactory,
      import30.PickerCmpNgFactory,
      import31.PopoverCmpNgFactory,
      import32.ToastCmpNgFactory,
      import33.HomePageNgFactory,
      import34.MyAppNgFactory
    ]
    ,[import27.IonicAppNgFactory]);
  }
  get _LOCALE_ID_10():any {
    if ((this.__LOCALE_ID_10 == null)) { (this.__LOCALE_ID_10 = import0.ɵo(this.parent.get(import0.LOCALE_ID,(null as any)))); }
    return this.__LOCALE_ID_10;
  }
  get _NgLocalization_11():import2.NgLocaleLocalization {
    if ((this.__NgLocalization_11 == null)) { (this.__NgLocalization_11 = new import2.NgLocaleLocalization(this._LOCALE_ID_10)); }
    return this.__NgLocalization_11;
  }
  get _ApplicationRef_28():any {
    if ((this.__ApplicationRef_28 == null)) { (this.__ApplicationRef_28 = this._ɵf_27); }
    return this.__ApplicationRef_28;
  }
  get _APP_ID_29():any {
    if ((this.__APP_ID_29 == null)) { (this.__APP_ID_29 = import0.ɵg()); }
    return this.__APP_ID_29;
  }
  get _IterableDiffers_30():any {
    if ((this.__IterableDiffers_30 == null)) { (this.__IterableDiffers_30 = import0.ɵm()); }
    return this.__IterableDiffers_30;
  }
  get _KeyValueDiffers_31():any {
    if ((this.__KeyValueDiffers_31 == null)) { (this.__KeyValueDiffers_31 = import0.ɵn()); }
    return this.__KeyValueDiffers_31;
  }
  get _DomSanitizer_32():import3.ɵe {
    if ((this.__DomSanitizer_32 == null)) { (this.__DomSanitizer_32 = new import3.ɵe(this.parent.get(import3.DOCUMENT))); }
    return this.__DomSanitizer_32;
  }
  get _Sanitizer_33():any {
    if ((this.__Sanitizer_33 == null)) { (this.__Sanitizer_33 = this._DomSanitizer_32); }
    return this.__Sanitizer_33;
  }
  get _HAMMER_GESTURE_CONFIG_34():import3.HammerGestureConfig {
    if ((this.__HAMMER_GESTURE_CONFIG_34 == null)) { (this.__HAMMER_GESTURE_CONFIG_34 = new import3.HammerGestureConfig()); }
    return this.__HAMMER_GESTURE_CONFIG_34;
  }
  get _EVENT_MANAGER_PLUGINS_35():any[] {
    if ((this.__EVENT_MANAGER_PLUGINS_35 == null)) { (this.__EVENT_MANAGER_PLUGINS_35 = [
      new import3.ɵDomEventsPlugin(this.parent.get(import3.DOCUMENT)),
      new import3.ɵKeyEventsPlugin(this.parent.get(import3.DOCUMENT)),
      new import3.ɵHammerGesturesPlugin(this.parent.get(import3.DOCUMENT),this._HAMMER_GESTURE_CONFIG_34)
    ]
    ); }
    return this.__EVENT_MANAGER_PLUGINS_35;
  }
  get _EventManager_36():import3.EventManager {
    if ((this.__EventManager_36 == null)) { (this.__EventManager_36 = new import3.EventManager(this._EVENT_MANAGER_PLUGINS_35,this.parent.get(import0.NgZone))); }
    return this.__EventManager_36;
  }
  get _ɵDomRendererFactoryV2_38():import3.ɵDomRendererFactoryV2 {
    if ((this.__ɵDomRendererFactoryV2_38 == null)) { (this.__ɵDomRendererFactoryV2_38 = new import3.ɵDomRendererFactoryV2(this._EventManager_36,this._ɵDomSharedStylesHost_37)); }
    return this.__ɵDomRendererFactoryV2_38;
  }
  get _RendererFactoryV2_39():any {
    if ((this.__RendererFactoryV2_39 == null)) { (this.__RendererFactoryV2_39 = this._ɵDomRendererFactoryV2_38); }
    return this.__RendererFactoryV2_39;
  }
  get _ɵSharedStylesHost_40():any {
    if ((this.__ɵSharedStylesHost_40 == null)) { (this.__ɵSharedStylesHost_40 = this._ɵDomSharedStylesHost_37); }
    return this.__ɵSharedStylesHost_40;
  }
  get _Testability_41():import0.Testability {
    if ((this.__Testability_41 == null)) { (this.__Testability_41 = new import0.Testability(this.parent.get(import0.NgZone))); }
    return this.__Testability_41;
  }
  get _Meta_42():import3.Meta {
    if ((this.__Meta_42 == null)) { (this.__Meta_42 = new import3.Meta(this.parent.get(import3.DOCUMENT))); }
    return this.__Meta_42;
  }
  get _Title_43():import3.Title {
    if ((this.__Title_43 == null)) { (this.__Title_43 = new import3.Title(this.parent.get(import3.DOCUMENT))); }
    return this.__Title_43;
  }
  get _ɵi_44():import4.ɵi {
    if ((this.__ɵi_44 == null)) { (this.__ɵi_44 = new import4.ɵi()); }
    return this.__ɵi_44;
  }
  get _FormBuilder_45():import4.FormBuilder {
    if ((this.__FormBuilder_45 == null)) { (this.__FormBuilder_45 = new import4.FormBuilder()); }
    return this.__FormBuilder_45;
  }
  get _LAZY_LOADED_TOKEN_46():any {
    if ((this.__LAZY_LOADED_TOKEN_46 == null)) { (this.__LAZY_LOADED_TOKEN_46 = import35.HomePage); }
    return this.__LAZY_LOADED_TOKEN_46;
  }
  get _AppRootToken_47():any {
    if ((this.__AppRootToken_47 == null)) { (this.__AppRootToken_47 = import36.MyApp); }
    return this.__AppRootToken_47;
  }
  get _APP_BASE_HREF_48():any {
    if ((this.__APP_BASE_HREF_48 == null)) { (this.__APP_BASE_HREF_48 = '/'); }
    return this.__APP_BASE_HREF_48;
  }
  get _ActionSheetController_49():import12.ActionSheetController {
    if ((this.__ActionSheetController_49 == null)) { (this.__ActionSheetController_49 = new import12.ActionSheetController(this._App_19,this._Config_16)); }
    return this.__ActionSheetController_49;
  }
  get _AlertController_50():import13.AlertController {
    if ((this.__AlertController_50 == null)) { (this.__AlertController_50 = new import13.AlertController(this._App_19,this._Config_16)); }
    return this.__AlertController_50;
  }
  get _Events_51():import14.Events {
    if ((this.__Events_51 == null)) { (this.__Events_51 = new import14.Events()); }
    return this.__Events_51;
  }
  get _Form_52():import15.Form {
    if ((this.__Form_52 == null)) { (this.__Form_52 = new import15.Form()); }
    return this.__Form_52;
  }
  get _Haptic_53():import16.Haptic {
    if ((this.__Haptic_53 == null)) { (this.__Haptic_53 = new import16.Haptic(this._Platform_15)); }
    return this.__Haptic_53;
  }
  get _Keyboard_54():import17.Keyboard {
    if ((this.__Keyboard_54 == null)) { (this.__Keyboard_54 = new import17.Keyboard(this._Config_16,this._Platform_15,this.parent.get(import0.NgZone),this._DomController_17)); }
    return this.__Keyboard_54;
  }
  get _LoadingController_55():import18.LoadingController {
    if ((this.__LoadingController_55 == null)) { (this.__LoadingController_55 = new import18.LoadingController(this._App_19,this._Config_16)); }
    return this.__LoadingController_55;
  }
  get _LocationStrategy_56():any {
    if ((this.__LocationStrategy_56 == null)) { (this.__LocationStrategy_56 = import5.provideLocationStrategy(this.parent.get(import2.PlatformLocation),this._APP_BASE_HREF_48,this._Config_16)); }
    return this.__LocationStrategy_56;
  }
  get _Location_57():import2.Location {
    if ((this.__Location_57 == null)) { (this.__Location_57 = new import2.Location(this._LocationStrategy_56)); }
    return this.__Location_57;
  }
  get _UrlSerializer_58():any {
    if ((this.__UrlSerializer_58 == null)) { (this.__UrlSerializer_58 = import37.setupUrlSerializer(this._DeepLinkConfigToken_21)); }
    return this.__UrlSerializer_58;
  }
  get _DeepLinker_59():any {
    if ((this.__DeepLinker_59 == null)) { (this.__DeepLinker_59 = import38.setupDeepLinker(this._App_19,this._UrlSerializer_58,this._Location_57,this._ModuleLoader_24,this)); }
    return this.__DeepLinker_59;
  }
  get _ModalController_60():import19.ModalController {
    if ((this.__ModalController_60 == null)) { (this.__ModalController_60 = new import19.ModalController(this._App_19,this._Config_16,this._DeepLinker_59)); }
    return this.__ModalController_60;
  }
  get _PickerController_61():import20.PickerController {
    if ((this.__PickerController_61 == null)) { (this.__PickerController_61 = new import20.PickerController(this._App_19,this._Config_16)); }
    return this.__PickerController_61;
  }
  get _PopoverController_62():import21.PopoverController {
    if ((this.__PopoverController_62 == null)) { (this.__PopoverController_62 = new import21.PopoverController(this._App_19,this._Config_16,this._DeepLinker_59)); }
    return this.__PopoverController_62;
  }
  get _TapClick_63():import22.TapClick {
    if ((this.__TapClick_63 == null)) { (this.__TapClick_63 = new import22.TapClick(this._Config_16,this._Platform_15,this._DomController_17,this._App_19,this.parent.get(import0.NgZone),this._GestureController_20)); }
    return this.__TapClick_63;
  }
  get _ToastController_64():import23.ToastController {
    if ((this.__ToastController_64 == null)) { (this.__ToastController_64 = new import23.ToastController(this._App_19,this._Config_16)); }
    return this.__ToastController_64;
  }
  get _TransitionController_65():import24.TransitionController {
    if ((this.__TransitionController_65 == null)) { (this.__TransitionController_65 = new import24.TransitionController(this._Platform_15,this._Config_16)); }
    return this.__TransitionController_65;
  }
  createInternal():import1.AppModule {
    this._CommonModule_0 = new import2.CommonModule();
    this._ApplicationModule_1 = new import0.ApplicationModule();
    this._BrowserModule_2 = new import3.BrowserModule(this.parent.get(import3.BrowserModule,(null as any)));
    this._ɵba_3 = new import4.ɵba();
    this._FormsModule_4 = new import4.FormsModule();
    this._ReactiveFormsModule_5 = new import4.ReactiveFormsModule();
    this._IonicModule_6 = new import5.IonicModule();
    this._IonicPageModule_7 = new import5.IonicPageModule();
    this._HomePageModule_8 = new import6.HomePageModule();
    this._AppModule_9 = new import1.AppModule();
    this._ErrorHandler_12 = import3.ɵa();
    this._ConfigToken_13 = {};
    this._PlatformConfigToken_14 = import39.providePlatformConfigs();
    this._Platform_15 = import40.setupPlatform(this.parent.get(import3.DOCUMENT),this._PlatformConfigToken_14,this.parent.get(import0.NgZone));
    this._Config_16 = import41.setupConfig(this._ConfigToken_13,this._Platform_15);
    this._DomController_17 = new import7.DomController(this._Platform_15);
    this._MenuController_18 = new import8.MenuController();
    this._App_19 = new import9.App(this._Config_16,this._Platform_15,this._MenuController_18);
    this._GestureController_20 = new import10.GestureController(this._App_19);
    ${knownDeepLinkString}
    this._Compiler_22 = new import0.Compiler();
    this._NgModuleLoader_23 = new import11.NgModuleLoader(this._Compiler_22,this.parent.get(import11.NgModuleLoaderConfig,(null as any)));
    this._ModuleLoader_24 = import42.provideModuleLoader(this._NgModuleLoader_23,this);
    this._APP_INITIALIZER_25 = [
      import0.ɵp,
      import3.ɵc(this.parent.get(import3.NgProbeToken,(null as any)),this.parent.get(import0.NgProbeToken,(null as any))),
      import43.registerModeConfigs(this._Config_16),
      import14.setupProvideEvents(this._Platform_15,this._DomController_17),
      import22.setupTapClick(this._Config_16,this._Platform_15,this._DomController_17,this._App_19,this.parent.get(import0.NgZone),this._GestureController_20),
      import42.setupPreloading(this._Config_16,this._DeepLinkConfigToken_21,this._ModuleLoader_24,this.parent.get(import0.NgZone))
    ]
    ;
    this._ApplicationInitStatus_26 = new import0.ApplicationInitStatus(this._APP_INITIALIZER_25);
    this._ɵf_27 = new import0.ɵf(this.parent.get(import0.NgZone),this.parent.get(import0.ɵConsole),this,this._ErrorHandler_12,this,this._ApplicationInitStatus_26);
    this._ɵDomSharedStylesHost_37 = new import3.ɵDomSharedStylesHost(this.parent.get(import3.DOCUMENT));
    return this._AppModule_9;
  }
  getInternal(token:any,notFoundResult:any):any {
    if ((token === import2.CommonModule)) { return this._CommonModule_0; }
    if ((token === import0.ApplicationModule)) { return this._ApplicationModule_1; }
    if ((token === import3.BrowserModule)) { return this._BrowserModule_2; }
    if ((token === import4.ɵba)) { return this._ɵba_3; }
    if ((token === import4.FormsModule)) { return this._FormsModule_4; }
    if ((token === import4.ReactiveFormsModule)) { return this._ReactiveFormsModule_5; }
    if ((token === import5.IonicModule)) { return this._IonicModule_6; }
    if ((token === import5.IonicPageModule)) { return this._IonicPageModule_7; }
    if ((token === import6.HomePageModule)) { return this._HomePageModule_8; }
    if ((token === import1.AppModule)) { return this._AppModule_9; }
    if ((token === import0.LOCALE_ID)) { return this._LOCALE_ID_10; }
    if ((token === import2.NgLocalization)) { return this._NgLocalization_11; }
    if ((token === import0.ErrorHandler)) { return this._ErrorHandler_12; }
    if ((token === import41.ConfigToken)) { return this._ConfigToken_13; }
    if ((token === import39.PlatformConfigToken)) { return this._PlatformConfigToken_14; }
    if ((token === import40.Platform)) { return this._Platform_15; }
    if ((token === import41.Config)) { return this._Config_16; }
    if ((token === import7.DomController)) { return this._DomController_17; }
    if ((token === import8.MenuController)) { return this._MenuController_18; }
    if ((token === import9.App)) { return this._App_19; }
    if ((token === import10.GestureController)) { return this._GestureController_20; }
    if ((token === import37.DeepLinkConfigToken)) { return this._DeepLinkConfigToken_21; }
    if ((token === import0.Compiler)) { return this._Compiler_22; }
    if ((token === import11.NgModuleLoader)) { return this._NgModuleLoader_23; }
    if ((token === import42.ModuleLoader)) { return this._ModuleLoader_24; }
    if ((token === import0.APP_INITIALIZER)) { return this._APP_INITIALIZER_25; }
    if ((token === import0.ApplicationInitStatus)) { return this._ApplicationInitStatus_26; }
    if ((token === import0.ɵf)) { return this._ɵf_27; }
    if ((token === import0.ApplicationRef)) { return this._ApplicationRef_28; }
    if ((token === import0.APP_ID)) { return this._APP_ID_29; }
    if ((token === import0.IterableDiffers)) { return this._IterableDiffers_30; }
    if ((token === import0.KeyValueDiffers)) { return this._KeyValueDiffers_31; }
    if ((token === import3.DomSanitizer)) { return this._DomSanitizer_32; }
    if ((token === import0.Sanitizer)) { return this._Sanitizer_33; }
    if ((token === import3.HAMMER_GESTURE_CONFIG)) { return this._HAMMER_GESTURE_CONFIG_34; }
    if ((token === import3.EVENT_MANAGER_PLUGINS)) { return this._EVENT_MANAGER_PLUGINS_35; }
    if ((token === import3.EventManager)) { return this._EventManager_36; }
    if ((token === import3.ɵDomSharedStylesHost)) { return this._ɵDomSharedStylesHost_37; }
    if ((token === import3.ɵDomRendererFactoryV2)) { return this._ɵDomRendererFactoryV2_38; }
    if ((token === import0.RendererFactoryV2)) { return this._RendererFactoryV2_39; }
    if ((token === import3.ɵSharedStylesHost)) { return this._ɵSharedStylesHost_40; }
    if ((token === import0.Testability)) { return this._Testability_41; }
    if ((token === import3.Meta)) { return this._Meta_42; }
    if ((token === import3.Title)) { return this._Title_43; }
    if ((token === import4.ɵi)) { return this._ɵi_44; }
    if ((token === import4.FormBuilder)) { return this._FormBuilder_45; }
    if ((token === import42.LAZY_LOADED_TOKEN)) { return this._LAZY_LOADED_TOKEN_46; }
    if ((token === import44.AppRootToken)) { return this._AppRootToken_47; }
    if ((token === import2.APP_BASE_HREF)) { return this._APP_BASE_HREF_48; }
    if ((token === import12.ActionSheetController)) { return this._ActionSheetController_49; }
    if ((token === import13.AlertController)) { return this._AlertController_50; }
    if ((token === import14.Events)) { return this._Events_51; }
    if ((token === import15.Form)) { return this._Form_52; }
    if ((token === import16.Haptic)) { return this._Haptic_53; }
    if ((token === import17.Keyboard)) { return this._Keyboard_54; }
    if ((token === import18.LoadingController)) { return this._LoadingController_55; }
    if ((token === import2.LocationStrategy)) { return this._LocationStrategy_56; }
    if ((token === import2.Location)) { return this._Location_57; }
    if ((token === import37.UrlSerializer)) { return this._UrlSerializer_58; }
    if ((token === import38.DeepLinker)) { return this._DeepLinker_59; }
    if ((token === import19.ModalController)) { return this._ModalController_60; }
    if ((token === import20.PickerController)) { return this._PickerController_61; }
    if ((token === import21.PopoverController)) { return this._PopoverController_62; }
    if ((token === import22.TapClick)) { return this._TapClick_63; }
    if ((token === import23.ToastController)) { return this._ToastController_64; }
    if ((token === import24.TransitionController)) { return this._TransitionController_65; }
    return notFoundResult;
  }
  destroyInternal():void {
    this._ɵf_27.ngOnDestroy();
    this._ɵDomSharedStylesHost_37.ngOnDestroy();
  }
}
export const AppModuleNgFactory:import0.NgModuleFactory<import1.AppModule> = new import0.NgModuleFactory<any>(AppModuleInjector,import1.AppModule);
      `;

      const contentToInject = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

  const expectedDeepLinkString = `this._DeepLinkConfigToken_21 =${contentToInject}`;

      const result = util.getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig(knownContent, contentToInject);
      expect(result.indexOf(knownDeepLinkString)).toEqual(-1);
      expect(result.indexOf(expectedDeepLinkString)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateDefaultDeepLinkNgModuleContent', () => {
    it('should generate a default NgModule for a DeepLinked component', () => {
      const knownFileContent = `
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PageOne } from './page-one';

@NgModule({
  declarations: [
    PageOne,
  ],
  imports: [
    IonicPageModule.forChild(PageOne)
  ]
})
export class PageOneModule {}

`;
      const knownFilePath = join(process.cwd(), 'myApp', 'src', 'pages', 'page-one', 'page-one.ts');
      const knownClassName = 'PageOne';
      const fileContent = util.generateDefaultDeepLinkNgModuleContent(knownFilePath, knownClassName);
      expect(fileContent).toEqual(knownFileContent);
    });
  });

  describe('updateAppNgModuleAndFactoryWithDeepLinkConfig', () => {
    it('should throw when app ng module is not in cache', () => {
      const fileCache = new FileCache();
      const knownContext = {
        fileCache: fileCache
      };

      const knownDeepLinkString = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;
      const knownAppNgModulePath = join(process.cwd(), 'myApp', 'src', 'app.module.ts');
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(knownAppNgModulePath);
      spyOn(fileCache, 'get').and.callThrough();

      const knownErrorMsg = 'should never get here';
      try {
        util.updateAppNgModuleAndFactoryWithDeepLinkConfig(knownContext, knownDeepLinkString, null, false);
        throw new Error(knownErrorMsg);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownErrorMsg);
        expect(fileCache.get).toHaveBeenCalledWith(knownAppNgModulePath);
      }
    });

    it('should update the cache with updated ts file, transpiled js file and map w/o aot', () => {
      const fileCache = new FileCache();
      const knownContext = {
        fileCache: fileCache
      };

      const knownDeepLinkString = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

      const ngModuleContent = `
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

      const knownAppNgModulePath = join(process.cwd(), 'myApp', 'src', 'app.module.ts');
      fileCache.set(knownAppNgModulePath, { path: knownAppNgModulePath, content: ngModuleContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(knownAppNgModulePath);
      spyOn(fileCache, 'get').and.callThrough();
      spyOn(transpile, transpile.transpileTsString.name).and.callFake((context: BuildContext, filePath: string, contentToTranspile: string) => {
        return {
          sourceMapText: 'sourceMapText',
          outputText: contentToTranspile
        };
      });

      const changedFiles: ChangedFile[] = [];
      util.updateAppNgModuleAndFactoryWithDeepLinkConfig(knownContext, knownDeepLinkString, changedFiles, false);

      expect(fileCache.getAll().length).toEqual(3);
      expect(fileCache.get(knownAppNgModulePath).content.indexOf(knownDeepLinkString)).toBeGreaterThanOrEqual(0);
      expect(fileCache.get(helpers.changeExtension(knownAppNgModulePath, '.js')).content.indexOf(knownDeepLinkString)).toBeGreaterThanOrEqual(0);
      expect(fileCache.get(helpers.changeExtension(knownAppNgModulePath, '.js.map')).content).toEqual('sourceMapText');
      expect(changedFiles.length).toEqual(1);
      expect(changedFiles[0].event).toEqual('change');
      expect(changedFiles[0].ext).toEqual('.ts');
      expect(changedFiles[0].filePath).toEqual(knownAppNgModulePath);

    });

    it('should throw when ng factory is not in cache', () => {
      const fileCache = new FileCache();
      const knownContext = {
        fileCache: fileCache
      };

      const knownDeepLinkString = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

      const ngModuleContent = `
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

      const knownAppNgModulePath = join(process.cwd(), 'myApp', 'src', 'app.module.ts');
      fileCache.set(knownAppNgModulePath, { path: knownAppNgModulePath, content: ngModuleContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(knownAppNgModulePath);
      spyOn(fileCache, 'get').and.callThrough();
      spyOn(transpile, transpile.transpileTsString.name).and.callFake((context: BuildContext, filePath: string, contentToTranspile: string) => {
        return {
          sourceMapText: 'sourceMapText',
          outputText: contentToTranspile
        };
      });

      const changedFiles: ChangedFile[] = [];
      const knownErrorMsg = 'should never happen';
      try {
        util.updateAppNgModuleAndFactoryWithDeepLinkConfig(knownContext, knownDeepLinkString, changedFiles, true);
        throw new Error(knownErrorMsg);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownErrorMsg);
      }

    });

    it('should update the cache with updated ts file, transpiled js file and map with aot', () => {
      const fileCache = new FileCache();
      const knownContext = {
        fileCache: fileCache
      };

      const knownDeepLinkString = `{
  links: [
    { loadChildren: '../pages/home-page/home-page.module#HomePageModule', name: 'HomePage', segment: 'idkMan', priority: 'low', defaultHistory: ['page-two', 'page-three', 'page-four'] },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo', segment: null, priority: 'low', defaultHistory: [] },
    { loadChildren: '../pages/settings-page/setting-page.module#SettingsPageModule', name: 'SettingsPage', segment: null, priority: 'low', defaultHistory: [] }
  ]
}
`;

      const ngModuleContent = `
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

      const knownNgFactoryContent = `
/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties}
 */
 /* tslint:disable */

import * as import0 from '@angular/core';
import * as import1 from './app.module';
import * as import2 from '@angular/common';
import * as import3 from '@angular/platform-browser';
import * as import4 from '@angular/forms';
import * as import5 from 'ionic-angular/index';
import * as import6 from '../pages/home/home.module';
import * as import7 from 'ionic-angular/platform/dom-controller';
import * as import8 from 'ionic-angular/components/menu/menu-controller';
import * as import9 from 'ionic-angular/components/app/app';
import * as import10 from 'ionic-angular/gestures/gesture-controller';
import * as import11 from 'ionic-angular/util/ng-module-loader';
import * as import12 from 'ionic-angular/components/action-sheet/action-sheet-controller';
import * as import13 from 'ionic-angular/components/alert/alert-controller';
import * as import14 from 'ionic-angular/util/events';
import * as import15 from 'ionic-angular/util/form';
import * as import16 from 'ionic-angular/tap-click/haptic';
import * as import17 from 'ionic-angular/platform/keyboard';
import * as import18 from 'ionic-angular/components/loading/loading-controller';
import * as import19 from 'ionic-angular/components/modal/modal-controller';
import * as import20 from 'ionic-angular/components/picker/picker-controller';
import * as import21 from 'ionic-angular/components/popover/popover-controller';
import * as import22 from 'ionic-angular/tap-click/tap-click';
import * as import23 from 'ionic-angular/components/toast/toast-controller';
import * as import24 from 'ionic-angular/transitions/transition-controller';
import * as import25 from '../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory';
import * as import26 from '../../node_modules/ionic-angular/components/alert/alert-component.ngfactory';
import * as import27 from '../../node_modules/ionic-angular/components/app/app-root.ngfactory';
import * as import28 from '../../node_modules/ionic-angular/components/loading/loading-component.ngfactory';
import * as import29 from '../../node_modules/ionic-angular/components/modal/modal-component.ngfactory';
import * as import30 from '../../node_modules/ionic-angular/components/picker/picker-component.ngfactory';
import * as import31 from '../../node_modules/ionic-angular/components/popover/popover-component.ngfactory';
import * as import32 from '../../node_modules/ionic-angular/components/toast/toast-component.ngfactory';
import * as import33 from '../pages/home/home.ngfactory';
import * as import34 from './app.component.ngfactory';
import * as import35 from '../pages/home/home';
import * as import36 from './app.component';
import * as import37 from 'ionic-angular/navigation/url-serializer';
import * as import38 from 'ionic-angular/navigation/deep-linker';
import * as import39 from 'ionic-angular/platform/platform-registry';
import * as import40 from 'ionic-angular/platform/platform';
import * as import41 from 'ionic-angular/config/config';
import * as import42 from 'ionic-angular/util/module-loader';
import * as import43 from 'ionic-angular/config/mode-registry';
import * as import44 from 'ionic-angular/components/app/app-root';
class AppModuleInjector extends import0.ɵNgModuleInjector<import1.AppModule> {
  _CommonModule_0:import2.CommonModule;
  _ApplicationModule_1:import0.ApplicationModule;
  _BrowserModule_2:import3.BrowserModule;
  _ɵba_3:import4.ɵba;
  _FormsModule_4:import4.FormsModule;
  _ReactiveFormsModule_5:import4.ReactiveFormsModule;
  _IonicModule_6:import5.IonicModule;
  _IonicPageModule_7:import5.IonicPageModule;
  _HomePageModule_8:import6.HomePageModule;
  _AppModule_9:import1.AppModule;
  __LOCALE_ID_10:any;
  __NgLocalization_11:import2.NgLocaleLocalization;
  _ErrorHandler_12:any;
  _ConfigToken_13:any;
  _PlatformConfigToken_14:any;
  _Platform_15:any;
  _Config_16:any;
  _DomController_17:import7.DomController;
  _MenuController_18:import8.MenuController;
  _App_19:import9.App;
  _GestureController_20:import10.GestureController;
  _DeepLinkConfigToken_21:any;
  _Compiler_22:import0.Compiler;
  _NgModuleLoader_23:import11.NgModuleLoader;
  _ModuleLoader_24:any;
  _APP_INITIALIZER_25:any[];
  _ApplicationInitStatus_26:import0.ApplicationInitStatus;
  _ɵf_27:import0.ɵf;
  __ApplicationRef_28:any;
  __APP_ID_29:any;
  __IterableDiffers_30:any;
  __KeyValueDiffers_31:any;
  __DomSanitizer_32:import3.ɵe;
  __Sanitizer_33:any;
  __HAMMER_GESTURE_CONFIG_34:import3.HammerGestureConfig;
  __EVENT_MANAGER_PLUGINS_35:any[];
  __EventManager_36:import3.EventManager;
  _ɵDomSharedStylesHost_37:import3.ɵDomSharedStylesHost;
  __ɵDomRendererFactoryV2_38:import3.ɵDomRendererFactoryV2;
  __RendererFactoryV2_39:any;
  __ɵSharedStylesHost_40:any;
  __Testability_41:import0.Testability;
  __Meta_42:import3.Meta;
  __Title_43:import3.Title;
  __ɵi_44:import4.ɵi;
  __FormBuilder_45:import4.FormBuilder;
  __LAZY_LOADED_TOKEN_46:any;
  __AppRootToken_47:any;
  __APP_BASE_HREF_48:any;
  __ActionSheetController_49:import12.ActionSheetController;
  __AlertController_50:import13.AlertController;
  __Events_51:import14.Events;
  __Form_52:import15.Form;
  __Haptic_53:import16.Haptic;
  __Keyboard_54:import17.Keyboard;
  __LoadingController_55:import18.LoadingController;
  __LocationStrategy_56:any;
  __Location_57:import2.Location;
  __UrlSerializer_58:any;
  __DeepLinker_59:any;
  __ModalController_60:import19.ModalController;
  __PickerController_61:import20.PickerController;
  __PopoverController_62:import21.PopoverController;
  __TapClick_63:import22.TapClick;
  __ToastController_64:import23.ToastController;
  __TransitionController_65:import24.TransitionController;
  constructor(parent:import0.Injector) {
    super(parent,[
      import25.ActionSheetCmpNgFactory,
      import26.AlertCmpNgFactory,
      import27.IonicAppNgFactory,
      import28.LoadingCmpNgFactory,
      import29.ModalCmpNgFactory,
      import30.PickerCmpNgFactory,
      import31.PopoverCmpNgFactory,
      import32.ToastCmpNgFactory,
      import33.HomePageNgFactory,
      import34.MyAppNgFactory
    ]
    ,[import27.IonicAppNgFactory]);
  }
  get _LOCALE_ID_10():any {
    if ((this.__LOCALE_ID_10 == null)) { (this.__LOCALE_ID_10 = import0.ɵo(this.parent.get(import0.LOCALE_ID,(null as any)))); }
    return this.__LOCALE_ID_10;
  }
  get _NgLocalization_11():import2.NgLocaleLocalization {
    if ((this.__NgLocalization_11 == null)) { (this.__NgLocalization_11 = new import2.NgLocaleLocalization(this._LOCALE_ID_10)); }
    return this.__NgLocalization_11;
  }
  get _ApplicationRef_28():any {
    if ((this.__ApplicationRef_28 == null)) { (this.__ApplicationRef_28 = this._ɵf_27); }
    return this.__ApplicationRef_28;
  }
  get _APP_ID_29():any {
    if ((this.__APP_ID_29 == null)) { (this.__APP_ID_29 = import0.ɵg()); }
    return this.__APP_ID_29;
  }
  get _IterableDiffers_30():any {
    if ((this.__IterableDiffers_30 == null)) { (this.__IterableDiffers_30 = import0.ɵm()); }
    return this.__IterableDiffers_30;
  }
  get _KeyValueDiffers_31():any {
    if ((this.__KeyValueDiffers_31 == null)) { (this.__KeyValueDiffers_31 = import0.ɵn()); }
    return this.__KeyValueDiffers_31;
  }
  get _DomSanitizer_32():import3.ɵe {
    if ((this.__DomSanitizer_32 == null)) { (this.__DomSanitizer_32 = new import3.ɵe(this.parent.get(import3.DOCUMENT))); }
    return this.__DomSanitizer_32;
  }
  get _Sanitizer_33():any {
    if ((this.__Sanitizer_33 == null)) { (this.__Sanitizer_33 = this._DomSanitizer_32); }
    return this.__Sanitizer_33;
  }
  get _HAMMER_GESTURE_CONFIG_34():import3.HammerGestureConfig {
    if ((this.__HAMMER_GESTURE_CONFIG_34 == null)) { (this.__HAMMER_GESTURE_CONFIG_34 = new import3.HammerGestureConfig()); }
    return this.__HAMMER_GESTURE_CONFIG_34;
  }
  get _EVENT_MANAGER_PLUGINS_35():any[] {
    if ((this.__EVENT_MANAGER_PLUGINS_35 == null)) { (this.__EVENT_MANAGER_PLUGINS_35 = [
      new import3.ɵDomEventsPlugin(this.parent.get(import3.DOCUMENT)),
      new import3.ɵKeyEventsPlugin(this.parent.get(import3.DOCUMENT)),
      new import3.ɵHammerGesturesPlugin(this.parent.get(import3.DOCUMENT),this._HAMMER_GESTURE_CONFIG_34)
    ]
    ); }
    return this.__EVENT_MANAGER_PLUGINS_35;
  }
  get _EventManager_36():import3.EventManager {
    if ((this.__EventManager_36 == null)) { (this.__EventManager_36 = new import3.EventManager(this._EVENT_MANAGER_PLUGINS_35,this.parent.get(import0.NgZone))); }
    return this.__EventManager_36;
  }
  get _ɵDomRendererFactoryV2_38():import3.ɵDomRendererFactoryV2 {
    if ((this.__ɵDomRendererFactoryV2_38 == null)) { (this.__ɵDomRendererFactoryV2_38 = new import3.ɵDomRendererFactoryV2(this._EventManager_36,this._ɵDomSharedStylesHost_37)); }
    return this.__ɵDomRendererFactoryV2_38;
  }
  get _RendererFactoryV2_39():any {
    if ((this.__RendererFactoryV2_39 == null)) { (this.__RendererFactoryV2_39 = this._ɵDomRendererFactoryV2_38); }
    return this.__RendererFactoryV2_39;
  }
  get _ɵSharedStylesHost_40():any {
    if ((this.__ɵSharedStylesHost_40 == null)) { (this.__ɵSharedStylesHost_40 = this._ɵDomSharedStylesHost_37); }
    return this.__ɵSharedStylesHost_40;
  }
  get _Testability_41():import0.Testability {
    if ((this.__Testability_41 == null)) { (this.__Testability_41 = new import0.Testability(this.parent.get(import0.NgZone))); }
    return this.__Testability_41;
  }
  get _Meta_42():import3.Meta {
    if ((this.__Meta_42 == null)) { (this.__Meta_42 = new import3.Meta(this.parent.get(import3.DOCUMENT))); }
    return this.__Meta_42;
  }
  get _Title_43():import3.Title {
    if ((this.__Title_43 == null)) { (this.__Title_43 = new import3.Title(this.parent.get(import3.DOCUMENT))); }
    return this.__Title_43;
  }
  get _ɵi_44():import4.ɵi {
    if ((this.__ɵi_44 == null)) { (this.__ɵi_44 = new import4.ɵi()); }
    return this.__ɵi_44;
  }
  get _FormBuilder_45():import4.FormBuilder {
    if ((this.__FormBuilder_45 == null)) { (this.__FormBuilder_45 = new import4.FormBuilder()); }
    return this.__FormBuilder_45;
  }
  get _LAZY_LOADED_TOKEN_46():any {
    if ((this.__LAZY_LOADED_TOKEN_46 == null)) { (this.__LAZY_LOADED_TOKEN_46 = import35.HomePage); }
    return this.__LAZY_LOADED_TOKEN_46;
  }
  get _AppRootToken_47():any {
    if ((this.__AppRootToken_47 == null)) { (this.__AppRootToken_47 = import36.MyApp); }
    return this.__AppRootToken_47;
  }
  get _APP_BASE_HREF_48():any {
    if ((this.__APP_BASE_HREF_48 == null)) { (this.__APP_BASE_HREF_48 = '/'); }
    return this.__APP_BASE_HREF_48;
  }
  get _ActionSheetController_49():import12.ActionSheetController {
    if ((this.__ActionSheetController_49 == null)) { (this.__ActionSheetController_49 = new import12.ActionSheetController(this._App_19,this._Config_16)); }
    return this.__ActionSheetController_49;
  }
  get _AlertController_50():import13.AlertController {
    if ((this.__AlertController_50 == null)) { (this.__AlertController_50 = new import13.AlertController(this._App_19,this._Config_16)); }
    return this.__AlertController_50;
  }
  get _Events_51():import14.Events {
    if ((this.__Events_51 == null)) { (this.__Events_51 = new import14.Events()); }
    return this.__Events_51;
  }
  get _Form_52():import15.Form {
    if ((this.__Form_52 == null)) { (this.__Form_52 = new import15.Form()); }
    return this.__Form_52;
  }
  get _Haptic_53():import16.Haptic {
    if ((this.__Haptic_53 == null)) { (this.__Haptic_53 = new import16.Haptic(this._Platform_15)); }
    return this.__Haptic_53;
  }
  get _Keyboard_54():import17.Keyboard {
    if ((this.__Keyboard_54 == null)) { (this.__Keyboard_54 = new import17.Keyboard(this._Config_16,this._Platform_15,this.parent.get(import0.NgZone),this._DomController_17)); }
    return this.__Keyboard_54;
  }
  get _LoadingController_55():import18.LoadingController {
    if ((this.__LoadingController_55 == null)) { (this.__LoadingController_55 = new import18.LoadingController(this._App_19,this._Config_16)); }
    return this.__LoadingController_55;
  }
  get _LocationStrategy_56():any {
    if ((this.__LocationStrategy_56 == null)) { (this.__LocationStrategy_56 = import5.provideLocationStrategy(this.parent.get(import2.PlatformLocation),this._APP_BASE_HREF_48,this._Config_16)); }
    return this.__LocationStrategy_56;
  }
  get _Location_57():import2.Location {
    if ((this.__Location_57 == null)) { (this.__Location_57 = new import2.Location(this._LocationStrategy_56)); }
    return this.__Location_57;
  }
  get _UrlSerializer_58():any {
    if ((this.__UrlSerializer_58 == null)) { (this.__UrlSerializer_58 = import37.setupUrlSerializer(this._DeepLinkConfigToken_21)); }
    return this.__UrlSerializer_58;
  }
  get _DeepLinker_59():any {
    if ((this.__DeepLinker_59 == null)) { (this.__DeepLinker_59 = import38.setupDeepLinker(this._App_19,this._UrlSerializer_58,this._Location_57,this._ModuleLoader_24,this)); }
    return this.__DeepLinker_59;
  }
  get _ModalController_60():import19.ModalController {
    if ((this.__ModalController_60 == null)) { (this.__ModalController_60 = new import19.ModalController(this._App_19,this._Config_16,this._DeepLinker_59)); }
    return this.__ModalController_60;
  }
  get _PickerController_61():import20.PickerController {
    if ((this.__PickerController_61 == null)) { (this.__PickerController_61 = new import20.PickerController(this._App_19,this._Config_16)); }
    return this.__PickerController_61;
  }
  get _PopoverController_62():import21.PopoverController {
    if ((this.__PopoverController_62 == null)) { (this.__PopoverController_62 = new import21.PopoverController(this._App_19,this._Config_16,this._DeepLinker_59)); }
    return this.__PopoverController_62;
  }
  get _TapClick_63():import22.TapClick {
    if ((this.__TapClick_63 == null)) { (this.__TapClick_63 = new import22.TapClick(this._Config_16,this._Platform_15,this._DomController_17,this._App_19,this.parent.get(import0.NgZone),this._GestureController_20)); }
    return this.__TapClick_63;
  }
  get _ToastController_64():import23.ToastController {
    if ((this.__ToastController_64 == null)) { (this.__ToastController_64 = new import23.ToastController(this._App_19,this._Config_16)); }
    return this.__ToastController_64;
  }
  get _TransitionController_65():import24.TransitionController {
    if ((this.__TransitionController_65 == null)) { (this.__TransitionController_65 = new import24.TransitionController(this._Platform_15,this._Config_16)); }
    return this.__TransitionController_65;
  }
  createInternal():import1.AppModule {
    this._CommonModule_0 = new import2.CommonModule();
    this._ApplicationModule_1 = new import0.ApplicationModule();
    this._BrowserModule_2 = new import3.BrowserModule(this.parent.get(import3.BrowserModule,(null as any)));
    this._ɵba_3 = new import4.ɵba();
    this._FormsModule_4 = new import4.FormsModule();
    this._ReactiveFormsModule_5 = new import4.ReactiveFormsModule();
    this._IonicModule_6 = new import5.IonicModule();
    this._IonicPageModule_7 = new import5.IonicPageModule();
    this._HomePageModule_8 = new import6.HomePageModule();
    this._AppModule_9 = new import1.AppModule();
    this._ErrorHandler_12 = import3.ɵa();
    this._ConfigToken_13 = {};
    this._PlatformConfigToken_14 = import39.providePlatformConfigs();
    this._Platform_15 = import40.setupPlatform(this.parent.get(import3.DOCUMENT),this._PlatformConfigToken_14,this.parent.get(import0.NgZone));
    this._Config_16 = import41.setupConfig(this._ConfigToken_13,this._Platform_15);
    this._DomController_17 = new import7.DomController(this._Platform_15);
    this._MenuController_18 = new import8.MenuController();
    this._App_19 = new import9.App(this._Config_16,this._Platform_15,this._MenuController_18);
    this._GestureController_20 = new import10.GestureController(this._App_19);
    this._DeepLinkConfigToken_21 = (null as any);
    this._Compiler_22 = new import0.Compiler();
    this._NgModuleLoader_23 = new import11.NgModuleLoader(this._Compiler_22,this.parent.get(import11.NgModuleLoaderConfig,(null as any)));
    this._ModuleLoader_24 = import42.provideModuleLoader(this._NgModuleLoader_23,this);
    this._APP_INITIALIZER_25 = [
      import0.ɵp,
      import3.ɵc(this.parent.get(import3.NgProbeToken,(null as any)),this.parent.get(import0.NgProbeToken,(null as any))),
      import43.registerModeConfigs(this._Config_16),
      import14.setupProvideEvents(this._Platform_15,this._DomController_17),
      import22.setupTapClick(this._Config_16,this._Platform_15,this._DomController_17,this._App_19,this.parent.get(import0.NgZone),this._GestureController_20),
      import42.setupPreloading(this._Config_16,this._DeepLinkConfigToken_21,this._ModuleLoader_24,this.parent.get(import0.NgZone))
    ]
    ;
    this._ApplicationInitStatus_26 = new import0.ApplicationInitStatus(this._APP_INITIALIZER_25);
    this._ɵf_27 = new import0.ɵf(this.parent.get(import0.NgZone),this.parent.get(import0.ɵConsole),this,this._ErrorHandler_12,this,this._ApplicationInitStatus_26);
    this._ɵDomSharedStylesHost_37 = new import3.ɵDomSharedStylesHost(this.parent.get(import3.DOCUMENT));
    return this._AppModule_9;
  }
  getInternal(token:any,notFoundResult:any):any {
    if ((token === import2.CommonModule)) { return this._CommonModule_0; }
    if ((token === import0.ApplicationModule)) { return this._ApplicationModule_1; }
    if ((token === import3.BrowserModule)) { return this._BrowserModule_2; }
    if ((token === import4.ɵba)) { return this._ɵba_3; }
    if ((token === import4.FormsModule)) { return this._FormsModule_4; }
    if ((token === import4.ReactiveFormsModule)) { return this._ReactiveFormsModule_5; }
    if ((token === import5.IonicModule)) { return this._IonicModule_6; }
    if ((token === import5.IonicPageModule)) { return this._IonicPageModule_7; }
    if ((token === import6.HomePageModule)) { return this._HomePageModule_8; }
    if ((token === import1.AppModule)) { return this._AppModule_9; }
    if ((token === import0.LOCALE_ID)) { return this._LOCALE_ID_10; }
    if ((token === import2.NgLocalization)) { return this._NgLocalization_11; }
    if ((token === import0.ErrorHandler)) { return this._ErrorHandler_12; }
    if ((token === import41.ConfigToken)) { return this._ConfigToken_13; }
    if ((token === import39.PlatformConfigToken)) { return this._PlatformConfigToken_14; }
    if ((token === import40.Platform)) { return this._Platform_15; }
    if ((token === import41.Config)) { return this._Config_16; }
    if ((token === import7.DomController)) { return this._DomController_17; }
    if ((token === import8.MenuController)) { return this._MenuController_18; }
    if ((token === import9.App)) { return this._App_19; }
    if ((token === import10.GestureController)) { return this._GestureController_20; }
    if ((token === import37.DeepLinkConfigToken)) { return this._DeepLinkConfigToken_21; }
    if ((token === import0.Compiler)) { return this._Compiler_22; }
    if ((token === import11.NgModuleLoader)) { return this._NgModuleLoader_23; }
    if ((token === import42.ModuleLoader)) { return this._ModuleLoader_24; }
    if ((token === import0.APP_INITIALIZER)) { return this._APP_INITIALIZER_25; }
    if ((token === import0.ApplicationInitStatus)) { return this._ApplicationInitStatus_26; }
    if ((token === import0.ɵf)) { return this._ɵf_27; }
    if ((token === import0.ApplicationRef)) { return this._ApplicationRef_28; }
    if ((token === import0.APP_ID)) { return this._APP_ID_29; }
    if ((token === import0.IterableDiffers)) { return this._IterableDiffers_30; }
    if ((token === import0.KeyValueDiffers)) { return this._KeyValueDiffers_31; }
    if ((token === import3.DomSanitizer)) { return this._DomSanitizer_32; }
    if ((token === import0.Sanitizer)) { return this._Sanitizer_33; }
    if ((token === import3.HAMMER_GESTURE_CONFIG)) { return this._HAMMER_GESTURE_CONFIG_34; }
    if ((token === import3.EVENT_MANAGER_PLUGINS)) { return this._EVENT_MANAGER_PLUGINS_35; }
    if ((token === import3.EventManager)) { return this._EventManager_36; }
    if ((token === import3.ɵDomSharedStylesHost)) { return this._ɵDomSharedStylesHost_37; }
    if ((token === import3.ɵDomRendererFactoryV2)) { return this._ɵDomRendererFactoryV2_38; }
    if ((token === import0.RendererFactoryV2)) { return this._RendererFactoryV2_39; }
    if ((token === import3.ɵSharedStylesHost)) { return this._ɵSharedStylesHost_40; }
    if ((token === import0.Testability)) { return this._Testability_41; }
    if ((token === import3.Meta)) { return this._Meta_42; }
    if ((token === import3.Title)) { return this._Title_43; }
    if ((token === import4.ɵi)) { return this._ɵi_44; }
    if ((token === import4.FormBuilder)) { return this._FormBuilder_45; }
    if ((token === import42.LAZY_LOADED_TOKEN)) { return this._LAZY_LOADED_TOKEN_46; }
    if ((token === import44.AppRootToken)) { return this._AppRootToken_47; }
    if ((token === import2.APP_BASE_HREF)) { return this._APP_BASE_HREF_48; }
    if ((token === import12.ActionSheetController)) { return this._ActionSheetController_49; }
    if ((token === import13.AlertController)) { return this._AlertController_50; }
    if ((token === import14.Events)) { return this._Events_51; }
    if ((token === import15.Form)) { return this._Form_52; }
    if ((token === import16.Haptic)) { return this._Haptic_53; }
    if ((token === import17.Keyboard)) { return this._Keyboard_54; }
    if ((token === import18.LoadingController)) { return this._LoadingController_55; }
    if ((token === import2.LocationStrategy)) { return this._LocationStrategy_56; }
    if ((token === import2.Location)) { return this._Location_57; }
    if ((token === import37.UrlSerializer)) { return this._UrlSerializer_58; }
    if ((token === import38.DeepLinker)) { return this._DeepLinker_59; }
    if ((token === import19.ModalController)) { return this._ModalController_60; }
    if ((token === import20.PickerController)) { return this._PickerController_61; }
    if ((token === import21.PopoverController)) { return this._PopoverController_62; }
    if ((token === import22.TapClick)) { return this._TapClick_63; }
    if ((token === import23.ToastController)) { return this._ToastController_64; }
    if ((token === import24.TransitionController)) { return this._TransitionController_65; }
    return notFoundResult;
  }
  destroyInternal():void {
    this._ɵf_27.ngOnDestroy();
    this._ɵDomSharedStylesHost_37.ngOnDestroy();
  }
}
export const AppModuleNgFactory:import0.NgModuleFactory<import1.AppModule> = new import0.NgModuleFactory<any>(AppModuleInjector,import1.AppModule);
      `;

      const knownAppNgModulePath = join(process.cwd(), 'myApp', 'src', 'app.module.ts');
      const knownAppNgModuleFactoryPath = helpers.changeExtension(knownAppNgModulePath, '.ngfactory.ts');
      fileCache.set(knownAppNgModulePath, { path: knownAppNgModulePath, content: ngModuleContent});
      fileCache.set(knownAppNgModuleFactoryPath, { path: knownAppNgModuleFactoryPath, content: knownNgFactoryContent});
      spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(knownAppNgModulePath);
      spyOn(fileCache, 'get').and.callThrough();
      spyOn(transpile, transpile.transpileTsString.name).and.callFake((context: BuildContext, filePath: string, contentToTranspile: string) => {
        return {
          sourceMapText: 'sourceMapText',
          outputText: contentToTranspile
        };
      });

      const changedFiles: ChangedFile[] = [];
      util.updateAppNgModuleAndFactoryWithDeepLinkConfig(knownContext, knownDeepLinkString, changedFiles, true);
      expect(fileCache.getAll().length).toEqual(6);
      expect(fileCache.get(knownAppNgModulePath).content.indexOf(knownDeepLinkString)).toBeGreaterThanOrEqual(0);
      expect(fileCache.get(helpers.changeExtension(knownAppNgModulePath, '.js')).content.indexOf(knownDeepLinkString)).toBeGreaterThanOrEqual(0);
      expect(fileCache.get(helpers.changeExtension(knownAppNgModulePath, '.js.map')).content).toEqual('sourceMapText');
      expect(fileCache.get(knownAppNgModuleFactoryPath)).toBeTruthy();
      expect(fileCache.get(helpers.changeExtension(knownAppNgModuleFactoryPath, '.js'))).toBeTruthy();
      expect(fileCache.get(helpers.changeExtension(knownAppNgModuleFactoryPath, '.js.map'))).toBeTruthy();
      expect(changedFiles.length).toEqual(2);
      expect(changedFiles[0].event).toEqual('change');
      expect(changedFiles[0].ext).toEqual('.ts');
      expect(changedFiles[0].filePath).toEqual(knownAppNgModulePath);
      expect(changedFiles[1].event).toEqual('change');
      expect(changedFiles[1].ext).toEqual('.ts');
      expect(changedFiles[1].filePath).toEqual(knownAppNgModuleFactoryPath);
    });
  });
});
