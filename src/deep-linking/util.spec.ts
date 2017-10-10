import { join } from 'path';

import * as ts from 'typescript';

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

      spyOn(helpers, helpers.getStringPropertyValue.name).and.callFake((input: string) => {
        if (input === Constants.ENV_VAR_DEEPLINKS_DIR) {
          return pagesDir;
        }
        return '.module.ts';
      });

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

      const map = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(map.size).toEqual(0);
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

      const map = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(map.size).toEqual(2);
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

      const map = util.getDeepLinkData(appNgModulePath, fileCache, false);
      expect(map.size).toEqual(3);

      const entryOne = map.get('SomeOtherName');
      expect(entryOne.name).toEqual('SomeOtherName');
      expect(entryOne.segment).toEqual('page-one');
      expect(entryOne.priority).toEqual('low');
      expect(entryOne.defaultHistory.length).toEqual(0);
      expect(entryOne.absolutePath).toEqual(join(srcDir, 'pages', 'page-one', 'page-one.module.ts'));
      expect(entryOne.userlandModulePath).toEqual('../pages/page-one/page-one.module');
      expect(entryOne.className).toEqual('PageOneModule');

      const entryTwo = map.get('PageTwo');
      expect(entryTwo.name).toEqual('PageTwo');
      expect(entryTwo.segment).toEqual('page-two');
      expect(entryTwo.priority).toEqual('low');
      expect(entryTwo.defaultHistory.length).toEqual(0);
      expect(entryTwo.absolutePath).toEqual(join(srcDir, 'pages', 'page-two', 'page-two.module.ts'));
      expect(entryTwo.userlandModulePath).toEqual('../pages/page-two/page-two.module');
      expect(entryTwo.className).toEqual('PageTwoModule');

      const entryThree = map.get('PageThree');
      expect(entryThree.name).toEqual('PageThree');
      expect(entryThree.segment).toEqual('someSegmentBro');
      expect(entryThree.priority).toEqual('high');
      expect(entryThree.defaultHistory.length).toEqual(2);
      expect(entryThree.defaultHistory[0]).toEqual('page-one');
      expect(entryThree.defaultHistory[1]).toEqual('page-two');
      expect(entryThree.absolutePath).toEqual(join(srcDir, 'pages', 'settings-page', 'fake-dir', 'settings-page.module.ts'));
      expect(entryThree.userlandModulePath).toEqual('../pages/settings-page/fake-dir/settings-page.module');
      expect(entryThree.className).toEqual('PageThreeModule');
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

    it('should return true where there is an existing deep link config associated with a variable', () => {
      const knownContent = `
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePageModule } from '../pages/home/home.module';

const deepLinkConfig = {
  links: [
    { loadChildren: '../pages/page-one/page-one.module#PageOneModule', name: 'PageOne' },
    { loadChildren: '../pages/page-two/page-two.module#PageTwoModule', name: 'PageTwo' },
    { loadChildren: '../pages/page-three/page-three.module#PageThreeModule', name: 'PageThree' }
  ]
};

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {}, deepLinkConfig),
    HomePageModule,
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
      `;

      const knownPath = join(process.cwd(), 'idk', 'some', 'fake', 'path');

      const result = util.hasExistingDeepLinkConfig(knownPath, knownContent);
      expect(result).toEqual(true);
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
      const map = new Map<string, DeepLinkConfigEntry>();

      map.set('HomePage', {
        name: 'HomePage',
        segment: 'idkMan',
        defaultHistory: ['page-two', 'page-three', 'page-four'],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
        userlandModulePath: '../pages/home-page/home-page.module',
        className: 'HomePageModule'
      });

      map.set('PageTwo', {
        name: 'PageTwo',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
        userlandModulePath: '../pages/page-two/page-two.module',
        className: 'PageTwoModule'
      });

      map.set('SettingsPage', {
        name: 'SettingsPage',
        segment: null,
        defaultHistory: [],
        priority: 'low',
        rawString: 'irrelevant for this test',
        absolutePath: join(process.cwd(), 'myApp', 'pages', 'home-page', 'home-page.module.ts'),
        userlandModulePath: '../pages/settings-page/setting-page.module',
        className: 'SettingsPageModule'
      });

      const result = util.convertDeepLinkConfigEntriesToString(map);
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

  describe('updateAppNgModuleWithDeepLinkConfig', () => {
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
        util.updateAppNgModuleWithDeepLinkConfig(knownContext, knownDeepLinkString, null);
        throw new Error(knownErrorMsg);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownErrorMsg);
        expect(fileCache.get).toHaveBeenCalledWith(knownAppNgModulePath);
      }
    });

    it('should update the cache with updated ts file', () => {
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

      const changedFiles: ChangedFile[] = [];
      util.updateAppNgModuleWithDeepLinkConfig(knownContext, knownDeepLinkString, changedFiles);

      expect(fileCache.getAll().length).toEqual(1);
      expect(fileCache.get(knownAppNgModulePath).content.indexOf(knownDeepLinkString)).toBeGreaterThanOrEqual(0);
      expect(changedFiles.length).toEqual(1);
      expect(changedFiles[0].event).toEqual('change');
      expect(changedFiles[0].ext).toEqual('.ts');
      expect(changedFiles[0].filePath).toEqual(knownAppNgModulePath);
    });
  });

  describe('purgeDeepLinkDecorator', () => {
    it('should remove the IonicPage decorator from the ts source', () => {
      const input = `
import { Component } from '@angular/core';

import { IonicPage, PopoverController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;

const expectedContent = `
import { Component } from '@angular/core';

import { PopoverController } from 'ionic-angular';


@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;
      const result = util.purgeDeepLinkDecorator(input);
      expect(result).toEqual(expectedContent);
    });
  });

  describe('purgeDeepLinkImport', () => {
    it('should remove the IonicPage decorator but preserve others', () => {
      const input = `
import { Component } from '@angular/core';

import { IonicPage, PopoverController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;
      const expectedText = `
import { Component } from '@angular/core';

import { PopoverController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;
      const result = util.purgeDeepLinkImport(input);
      expect(result).toEqual(expectedText);
    });

    it('should remove the entire import statement', () => {
      const input = `
import { Component } from '@angular/core';

import { IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;
      const expectedText = `
import { Component } from '@angular/core';



@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;
      const result = util.purgeDeepLinkImport(input);
      expect(result).toEqual(expectedText);
    });
  });

  describe('purgeDeepLinkDecoratorTSTransform', () => {
    it('should do something', () => {
      const input = `
import { Component } from '@angular/core';

import { IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  conferenceDate = '2047-05-17';

  constructor(public popoverCtrl: PopoverController) { }

  presentPopover(event: Event) {
    let popover = this.popoverCtrl.create('PopoverPage');
    popover.present({ ev: event });
  }
}
`;

const expected = `import { Component } from "@angular/core";
import { } from "ionic-angular";
@Component({
    selector: "page-about",
    templateUrl: "about.html"
})
export class AboutPage {
    conferenceDate = "2047-05-17";
    constructor(public popoverCtrl: PopoverController) { }
    presentPopover(event: Event) {
        let popover = this.popoverCtrl.create("PopoverPage");
        popover.present({ ev: event });
    }
}
`;
      const result = transformSourceFile(input, [util.purgeDeepLinkDecoratorTSTransformImpl]);
      expect(result).toEqual(expected);
    });
  });
});



export function transformSourceFile(sourceText: string, transformers: ts.TransformerFactory<ts.SourceFile>[]) {
  const transformed = ts.transform(ts.createSourceFile('source.ts', sourceText, ts.ScriptTarget.ES2015), transformers);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }, {
      onEmitNode: transformed.emitNodeWithNotification,
      substituteNode: transformed.substituteNode
  });
  const result = printer.printBundle(ts.createBundle(transformed.transformed));
  transformed.dispose();
  return result;
}
