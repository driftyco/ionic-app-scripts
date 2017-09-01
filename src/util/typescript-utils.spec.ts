import * as tsUtils from './typescript-utils';

describe('typescript-utils', () => {
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

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const result = tsUtils.getNgModuleClassName(knownPath, knownContent);
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

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const result = tsUtils.getNgModuleClassName(knownPath, knownContent);
      expect(result).toEqual('HomePageModule');
    });

    it('should throw an error an NgModule isn\'t found', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { DeepLinkModule } from 'ionic-angular';

import { HomePage } from './home';

export class HomePageModule {}

      `;

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const knownError = 'Should never happen';
      try {
        tsUtils.getNgModuleClassName(knownPath, knownContent);
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

      const knownPath = '/Users/noone/idk/some-path.module.ts';

      const knownError = 'Should never happen';
      try {
        tsUtils.getNgModuleClassName(knownPath, knownContent);
        throw new Error(knownError);
      } catch (ex) {
        expect(ex.message).not.toEqual(knownError);
      }
    });
  });

  describe('insertNamedImportIfNeeded', () => {
    it('should return modified file content, which is a string', () => {
      const filePath = '/path/to/my/file';
      const fileContent = 'import {A, B, C} from modulePath';
      const namedImport = 'NamedImport';
      const fromModule = 'CoolModule';

      const result = tsUtils.insertNamedImportIfNeeded(filePath, fileContent, namedImport, fromModule);

      // TODO: figure out how to match the exact string
      expect(result).toEqual(jasmine.any(String));
    });

    it('should return the same file content as the import is already in the file', () => {
      const filePath = '/path/to/my/file';
      const fileContent = 'import { A } from "modulePath"';
      const namedImport = 'A';
      const fromModule = `modulePath`;

      const result = tsUtils.insertNamedImportIfNeeded(filePath, fileContent, namedImport, fromModule);

      expect(result).toEqual(fileContent);
    });
  });

  describe('getNgModuleDecorator', () => {
    it('should return an object', () => {
      const knownContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { AppComponent } from './app.component';
import { RootPageModule } from '../pages/root-page/root-page.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
})
export class AppModule {}

      `;

      const knownPath = '/some/fake/path';
      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, knownContent);
      const result = tsUtils.getNgModuleDecorator('coolFile.ts', sourceFile);

      expect(result).toEqual(jasmine.any(Object));
    });

    it('should throw an error', () => {
      const messedUpContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { AppComponent } from './app.component';
import { RootPageModule } from '../pages/root-page/root-page.module';

({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
})
export class AppModule {}

      `;
      const knownPath = '/some/fake/path';
      const sourceFile = tsUtils.getTypescriptSourceFile(knownPath, messedUpContent);

      expect(() => tsUtils.getNgModuleDecorator('coolFile.ts', sourceFile)).toThrowError('Could not find an "NgModule" decorator in coolFile.ts');
    });
  });
});

describe('appendNgModuleDeclaration', () => {
  it('should return a modified file content', () => {
    const knownContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { AppComponent } from './app.component';
import { RootPageModule } from '../pages/root-page/root-page.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
})
export class AppModule {}
`;

    const knownPath = '/some/fake/path';

    const expectedContent = `
import { NgModule } from \'@angular/core\';
import { BrowserModule } from \'@angular/platform-browser\';
import { IonicApp, IonicModule } from \'../../../../..\';

import { AppComponent } from \'./app.component\';
import { RootPageModule } from \'../pages/root-page/root-page.module\';

@NgModule({
  declarations: [
    AppComponent,
    CoolComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
})
export class AppModule {}
`;

    const result = tsUtils.appendNgModuleDeclaration(knownPath, knownContent, 'CoolComponent');
    expect(result).toEqual(expectedContent);
  });

  it('should return a modified file content for providers', () => {
    const knownContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { AppComponent } from './app.component';
import { RootPageModule } from '../pages/root-page/root-page.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
  providers: []
})
export class AppModule {}
`;

  const knownPath = '/some/fake/path';

  const expectedContent = `
import { NgModule } from \'@angular/core\';
import { BrowserModule } from \'@angular/platform-browser\';
import { IonicApp, IonicModule } from \'../../../../..\';

import { AppComponent } from \'./app.component\';
import { RootPageModule } from \'../pages/root-page/root-page.module\';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
  providers: [CoolProvider]
})
export class AppModule {}
`;

  const result = tsUtils.appendNgModuleProvider(knownPath, knownContent, 'CoolProvider');
  expect(result).toEqual(expectedContent);
});

  it('should return a modified file content for providers that already has one provider', () => {
    const knownContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { AppComponent } from './app.component';
import { RootPageModule } from '../pages/root-page/root-page.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
  providers: [AwesomeProvider]
})
export class AppModule {}
`;

  const knownPath = '/some/fake/path';

  const expectedContent = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { AppComponent } from './app.component';
import { RootPageModule } from '../pages/root-page/root-page.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(AppComponent),
    RootPageModule
  ],
  bootstrap: [IonicApp],
  providers: [AwesomeProvider,
    CoolProvider]
})
export class AppModule {}
`;


  const result = tsUtils.appendNgModuleProvider(knownPath, knownContent, 'CoolProvider');
  expect(result).toEqual(expectedContent);
  });
});

