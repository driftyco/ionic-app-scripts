import * as util from './util';

describe('util', () => {
  describe('extractDeepLinkData', () => {
    it('should do something', () => {
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
      { path: '../pages/home/home.module', namedExport: 'HomePageModule', name: Constants.HOME_PAGE },
      { path: '../pages/page-one/page-one.module', namedExport: 'PageOneModule', name: Constants.PAGE_ONE },
      { path: '../pages/page-two/page-two.module', namedExport: 'PageTwoModule', name: Constants.PAGE_TWO }
    ]
  });
}
      `;
      util.extractDeepLinkPathData(fileContent);
    });
  });
});