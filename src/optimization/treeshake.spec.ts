import { join, relative } from 'path';
import * as treeshake from './treeshake';
import * as Constants from '../util/constants';
import * as helpers from '../util/helpers';


let originalEnv: any = null;

const baseDir = join(process.cwd(), 'some', 'dir', 'myApp');
const srcDir = join(baseDir, 'src');
const main = join(srcDir, 'app', 'main.js');
const appModule = join(srcDir, 'app', 'app.module.js');
const nodeModulesDir = join(baseDir, 'node_modules');
const ionicAngularDir = join(nodeModulesDir, 'ionic-angular');
const ionicAngularEntryPoint = join(ionicAngularDir, 'index.js');
const ionicAngularModuleFile = join(ionicAngularDir, 'module.js');
const componentDir = join(ionicAngularDir, 'components');

describe('treeshake', () => {

  beforeEach(() => {
    originalEnv = process.env;
    let env: any = { };
    env[Constants.ENV_VAR_IONIC_ANGULAR_DIR] = ionicAngularDir;
    env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT] = ionicAngularEntryPoint;
    env[Constants.ENV_VAR_SRC_DIR] = srcDir;
    env[Constants.ENV_APP_ENTRY_POINT] = main;
    env[Constants.ENV_APP_NG_MODULE_PATH] = appModule;
    env[Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX] = '.module.ts';
    env[Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet-component.ngfactory.js');
    env[Constants.ENV_ACTION_SHEET_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet-controller.js');
    env[Constants.ENV_ACTION_SHEET_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet.js');
    env[Constants.ENV_ALERT_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert-component.ngfactory.js');
    env[Constants.ENV_ALERT_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert-controller.js');
    env[Constants.ENV_ALERT_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert.js');
    env[Constants.ENV_LOADING_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading-component.ngfactory.js');
    env[Constants.ENV_LOADING_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading-controller.js');
    env[Constants.ENV_LOADING_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading.js');
    env[Constants.ENV_MODAL_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal-component.ngfactory.js');
    env[Constants.ENV_MODAL_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal-controller.js');
    env[Constants.ENV_MODAL_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal.js');
    env[Constants.ENV_PICKER_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker-component.ngfactory.js');
    env[Constants.ENV_PICKER_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker-controller.js');
    env[Constants.ENV_PICKER_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker.js');
    env[Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover-component.ngfactory.js');
    env[Constants.ENV_POPOVER_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover-controller.js');
    env[Constants.ENV_POPOVER_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover.js');
    env[Constants.ENV_TOAST_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast-component.ngfactory.js');
    env[Constants.ENV_TOAST_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast-controller.js');
    env[Constants.ENV_TOAST_VIEW_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast.js');

    process.env = env;

  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('calculateTreeShakeResults', () => {

    it('should remove modules that are only imported by the module file', () => {
      // arrange

      const dependencyOne = join(componentDir, 'range.js');
      const dependencyTwo = join(componentDir, 'radio-button.js');
      const dependencyThree = join(componentDir, 'check-box.js');

      const dependencyOneSet = new Set<string>();
      dependencyOneSet.add(ionicAngularModuleFile);

      const dependencyTwoSet = new Set<string>();
      dependencyTwoSet.add(ionicAngularModuleFile);

      const dependencyThreeSet = new Set<string>();
      dependencyThreeSet.add(ionicAngularModuleFile);

      const dependencySetModule = new Set<string>();
      dependencySetModule.add(ionicAngularEntryPoint);


      const dependencyMap = new Map<string, Set<string>>();
      dependencyMap.set(dependencyOne, dependencyOneSet);
      dependencyMap.set(dependencyTwo, dependencyTwoSet);
      dependencyMap.set(dependencyThree, dependencyThreeSet);
      dependencyMap.set(ionicAngularModuleFile, dependencySetModule);
      dependencyMap.set(ionicAngularEntryPoint, new Set<string>());

      // act
      const results = treeshake.calculateUnusedComponents(dependencyMap);

      // assert
      expect(results.updatedDependencyMap.get(dependencyOne)).not.toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyTwo)).not.toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyThree)).not.toBeTruthy();
      expect(results.updatedDependencyMap.get(ionicAngularModuleFile)).toBeTruthy();
      expect(results.purgedModules.get(dependencyOne)).toBeTruthy();
      expect(results.purgedModules.get(dependencyTwo)).toBeTruthy();
      expect(results.purgedModules.get(dependencyThree)).toBeTruthy();
    });

    it('should remove other components that are imported only by module file or other modules that can be removed (only imported by module file)', () => {
      // arrange

      const dependencyOne = join(componentDir, 'range.js');
      const dependencyOneNgFactory = join(componentDir, 'range.ngfactory.js');

      const dependencyOneHelperOne = join(componentDir, 'range', 'helperOne.js');
      const dependencyOneHelperTwo = join(componentDir, 'range', 'helperTwo.js');

      const dependencyTwo = join(componentDir, 'radio-button.js');
      const dependencyThree = join(componentDir, 'check-box.js');

      const dependencyFour = join(componentDir, 'badge.js');
      const dependencyFourNgFactory = join(componentDir, 'badge.ngfactory.js');

      const appModuleNgFactory = join(srcDir, 'app', 'app.module.ngfactory.js');

      const alert = join(componentDir, 'alert', 'alert.js');
      const alertController = join(componentDir, 'alert', 'alert-controller.js');
      const alertComponent = join(componentDir, 'alert', 'alert-component.js');
      const alertComponentNgFactory = join(componentDir, 'alert', 'alert-component.ngfactory.js');

      const actionSheet = join(componentDir, 'action-sheet', 'action-sheet.js');
      const actionSheetController = join(componentDir, 'action-sheet', 'action-sheet-controller.js');
      const actionSheetComponent = join(componentDir, 'action-sheet', 'action-sheet-component.js');
      const actionSheetComponentNgFactory = join(componentDir, 'action-sheet', 'action-sheet-component.ngfactory.js');

      const home = join(srcDir, 'pages', 'home.js');
      const homeNgFactory = join(srcDir, 'pages', 'home.ngfactory.js');

      const appModuleSet = new Set<string>();
      appModuleSet.add(appModuleNgFactory);

      const appModuleNgFactorySet = new Set<string>();

      const homeSet = new Set<string>();
      homeSet.add(appModule);
      homeSet.add(homeNgFactory);

      const homeNgFactorySet = new Set<string>();
      homeNgFactorySet.add(appModuleNgFactory);

      const dependencyOneSet = new Set<string>();
      dependencyOneSet.add(ionicAngularModuleFile);
      dependencyOneSet.add(dependencyOneNgFactory);
      dependencyOneSet.add(home);

      const dependencyOneNgFactorySet = new Set<string>();
      dependencyOneNgFactorySet.add(homeNgFactory);

      const dependencyTwoSet = new Set<string>();
      dependencyTwoSet.add(ionicAngularModuleFile);

      const dependencyThreeSet = new Set<string>();
      dependencyThreeSet.add(ionicAngularModuleFile);

      const dependencyFourSet = new Set<string>();
      dependencyFourSet.add(ionicAngularModuleFile);
      dependencyFourSet.add(dependencyFourNgFactory);
      dependencyFourSet.add(home);

      const dependencyFourNgFactorySet = new Set<string>();
      dependencyFourNgFactorySet.add(homeNgFactory);

      const indexSet = new Set<string>();
      indexSet.add(home);
      indexSet.add(appModuleNgFactory);
      indexSet.add(appModule);

      const dependencyOneHelperOneSet = new Set<string>();
      dependencyOneHelperOneSet.add(dependencyOne);
      dependencyOneHelperOneSet.add(ionicAngularModuleFile);
      const dependencyOneHelperTwoSet = new Set<string>();
      dependencyOneHelperTwoSet.add(dependencyOne);
      dependencyOneHelperTwoSet.add(ionicAngularModuleFile);

      const alertSet  = new Set<string>();
      alertSet.add(alertController);

      const alertControllerSet = new Set<string>();
      alertControllerSet.add(ionicAngularModuleFile);
      alertControllerSet.add(appModuleNgFactory);

      const alertComponentSet = new Set<string>();
      alertComponentSet.add(ionicAngularModuleFile);
      alertComponentSet.add(alertComponentNgFactory);
      alertComponentSet.add(alert);

      const alertComponentNgFactorySet = new Set<string>();
      alertComponentNgFactorySet.add(appModuleNgFactory);

      const actionSheetSet  = new Set<string>();
      actionSheetSet.add(actionSheetController);

      const actionSheetControllerSet = new Set<string>();
      actionSheetControllerSet.add(ionicAngularModuleFile);
      actionSheetControllerSet.add(appModuleNgFactory);
      actionSheetControllerSet.add(homeNgFactory);
      actionSheetControllerSet.add(home);

      const actionSheetComponentSet = new Set<string>();
      actionSheetComponentSet.add(ionicAngularModuleFile);
      actionSheetComponentSet.add(actionSheetComponentNgFactory);
      actionSheetComponentSet.add(actionSheet);

      const actionSheetComponentNgFactorySet = new Set<string>();
      actionSheetComponentNgFactorySet.add(appModuleNgFactory);

      const dependencySetModule = new Set<string>();
      dependencySetModule.add(ionicAngularEntryPoint);

      const dependencyMap = new Map<string, Set<string>>();
      dependencyMap.set(appModule, appModuleSet);
      dependencyMap.set(appModuleNgFactory, appModuleNgFactorySet);
      dependencyMap.set(home, homeSet);
      dependencyMap.set(homeNgFactory, homeNgFactorySet);
      dependencyMap.set(dependencyOne, dependencyOneSet);
      dependencyMap.set(dependencyOneNgFactory, dependencyOneNgFactorySet);
      dependencyMap.set(dependencyOneHelperOne, dependencyOneHelperOneSet);
      dependencyMap.set(dependencyOneHelperTwo, dependencyOneHelperTwoSet);
      dependencyMap.set(dependencyTwo, dependencyTwoSet);
      dependencyMap.set(dependencyThree, dependencyThreeSet);
      dependencyMap.set(dependencyFour, dependencyFourSet);
      dependencyMap.set(dependencyFourNgFactory, dependencyFourNgFactorySet);
      dependencyMap.set(ionicAngularEntryPoint, indexSet);
      dependencyMap.set(ionicAngularModuleFile, dependencySetModule);
      dependencyMap.set(alert, alertSet);
      dependencyMap.set(alertController, alertControllerSet);
      dependencyMap.set(alertComponent, alertComponentSet);
      dependencyMap.set(alertComponentNgFactory, alertComponentNgFactorySet);
      dependencyMap.set(actionSheet, actionSheetSet);
      dependencyMap.set(actionSheetController, actionSheetControllerSet);
      dependencyMap.set(actionSheetComponent, actionSheetComponentSet);
      dependencyMap.set(actionSheetComponentNgFactory, actionSheetComponentNgFactorySet);

      // act
      const results = treeshake.calculateUnusedComponents(dependencyMap);

      // assert
      expect(results.updatedDependencyMap.get(appModule)).toBeTruthy();
      expect(results.updatedDependencyMap.get(appModuleNgFactory)).toBeTruthy();
      expect(results.updatedDependencyMap.get(home)).toBeTruthy();
      expect(results.updatedDependencyMap.get(homeNgFactory)).toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyOne)).toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyOneNgFactory)).toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyOneHelperOne)).toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyOneHelperTwo)).toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyFour)).toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyFourNgFactory)).toBeTruthy();
      expect(results.updatedDependencyMap.get(actionSheet)).toBeTruthy();
      expect(results.updatedDependencyMap.get(actionSheetController)).toBeTruthy();
      expect(results.updatedDependencyMap.get(actionSheetComponent)).toBeTruthy();
      expect(results.updatedDependencyMap.get(actionSheetComponentNgFactory)).toBeTruthy();
      expect(results.updatedDependencyMap.get(ionicAngularModuleFile)).toBeTruthy();


      expect(results.purgedModules.get(dependencyTwo)).toBeTruthy();
      expect(results.purgedModules.get(dependencyThree)).toBeTruthy();
      expect(results.purgedModules.get(alert)).toBeTruthy();
      expect(results.purgedModules.get(alertController)).toBeTruthy();
      // expect(results.purgedModules.get(alertComponent)).toBeTruthy();
      // expect(results.purgedModules.get(alertComponentNgFactory)).toBeTruthy();

    });
  });

  describe('purgeUnusedImportsAndExportsFromModuleFile', () => {
    it('should remove the import and export statement', () => {
      // arrange
      const importsToPurge =
`import { RangeKnob } from './components/range/range-knob';
import { Refresher } from './components/refresher/refresher';
import { RefresherContent } from './components/refresher/refresher-content';`;

      const moduleFileContent = `
import { ANALYZE_FOR_ENTRY_COMPONENTS, APP_INITIALIZER, ComponentFactoryResolver, Inject, Injector, NgModule, NgZone, Optional } from '@angular/core/index';
import { APP_BASE_HREF, Location, LocationStrategy, HashLocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common/index';
import { DOCUMENT } from '@angular/platform-browser/index';
import { FormsModule, ReactiveFormsModule } from '@angular/forms/index';
import { HttpModule } from '@angular/http/index';
import { CommonModule } from '@angular/common/index';
import { ActionSheetController } from './components/action-sheet/action-sheet';
import { AlertController } from './components/alert/alert';
import { App } from './components/app/app';
import { AppRootToken } from './components/app/app-root';
import { Config, setupConfig, ConfigToken } from './config/config';
import { DeepLinker, setupDeepLinker } from './navigation/deep-linker';
import { DomController } from './platform/dom-controller';
import { Events, setupProvideEvents } from './util/events';
import { Form } from './util/form';
import { GestureController } from './gestures/gesture-controller';
import { Haptic } from './tap-click/haptic';
import { Keyboard } from './platform/keyboard';
import { LoadingController } from './components/loading/loading';
import { MenuController } from './components/menu/menu-controller';
import { ModalController } from './components/modal/modal';
import { ModuleLoader, LAZY_LOADED_TOKEN } from './util/module-loader';
import { PickerController } from './components/picker/picker';
import { Platform, setupPlatform } from './platform/platform';
import { PlatformConfigToken, providePlatformConfigs } from './platform/platform-registry';
import { PopoverController } from './components/popover/popover';
import { SystemJsNgModuleLoader } from './util/system-js-ng-module-loader';
import { TapClick, setupTapClick } from './tap-click/tap-click';
import { ToastController } from './components/toast/toast';
import { registerModeConfigs } from './config/mode-registry';
import { registerTransitions } from './transitions/transition-registry';
import { TransitionController } from './transitions/transition-controller';
import { UrlSerializer, setupUrlSerializer, DeepLinkConfigToken } from './navigation/url-serializer';
import { ActionSheetCmp } from './components/action-sheet/action-sheet-component';
import { AlertCmp } from './components/alert/alert-component';
import { IonicApp } from './components/app/app-root';
import { LoadingCmp } from './components/loading/loading-component';
import { ModalCmp } from './components/modal/modal-component';
import { PickerCmp } from './components/picker/picker-component';
import { PopoverCmp } from './components/popover/popover-component';
import { ToastCmp } from './components/toast/toast-component';
import { Avatar } from './components/avatar/avatar';
import { Backdrop } from './components/backdrop/backdrop';
import { Badge } from './components/badge/badge';
import { One } from './components/badge/badge/one';
import { Two } from './components/badge/badge/two';
import { Button } from './components/button/button';
import { Card } from './components/card/card';
import { CardContent } from './components/card/card-content';
import { CardHeader } from './components/card/card-header';
import { CardTitle } from './components/card/card-title';
import { Checkbox } from './components/checkbox/checkbox';
import { Chip } from './components/chip/chip';
import { ClickBlock } from './util/click-block';
import { Content } from './components/content/content';
import { DateTime } from './components/datetime/datetime';
import { FabButton } from './components/fab/fab';
import { FabContainer } from './components/fab/fab-container';
import { FabList } from './components/fab/fab-list';
import { Col } from './components/grid/column';
import { Grid } from './components/grid/grid';
import { Row } from './components/grid/row';
import { Icon } from './components/icon/icon';
import { Img } from './components/img/img';
import { InfiniteScroll } from './components/infinite-scroll/infinite-scroll';
import { InfiniteScrollContent } from './components/infinite-scroll/infinite-scroll-content';
import { Item } from './components/item/item';
import { ItemContent } from './components/item/item-content';
import { ItemDivider } from './components/item/item-divider';
import { ItemGroup } from './components/item/item-group';
import { ItemReorder } from './components/item/item-reorder';
import { Reorder } from './components/item/reorder';
import { ItemSliding } from './components/item/item-sliding';
import { ItemOptions } from './components/item/item-options';
import { Label } from './components/label/label';
import { List } from './components/list/list';
import { ListHeader } from './components/list/list-header';
import { Menu } from './components/menu/menu';
import { MenuClose } from './components/menu/menu-close';
import { MenuToggle } from './components/menu/menu-toggle';
import { NativeInput } from './components/input/native-input';
import { NextInput } from './components/input/next-input';
import { Nav } from './components/nav/nav';
import { NavPop } from './components/nav/nav-pop';
import { NavPopAnchor } from './components/nav/nav-pop-anchor';
import { NavPush } from './components/nav/nav-push';
import { NavPushAnchor } from './components/nav/nav-push-anchor';
import { Navbar } from './components/navbar/navbar';
import { Note } from './components/note/note';
import { Option } from './components/option/option';
import { OverlayPortal } from './components/nav/overlay-portal';
import { PickerColumnCmp } from './components/picker/picker-component';
import { RadioButton } from './components/radio/radio-button';
import { RadioGroup } from './components/radio/radio-group';
import { Range } from './components/range/range';
${importsToPurge}
import { Scroll } from './components/scroll/scroll';
import { Searchbar } from './components/searchbar/searchbar';
import { Segment } from './components/segment/segment';
import { SegmentButton } from './components/segment/segment-button';
import { Select } from './components/select/select';
import { ShowWhen } from './components/show-hide-when/show-hide-when';
import { HideWhen } from './components/show-hide-when/hide-when';
import { Slide } from './components/slides/slide';
import { Slides } from './components/slides/slides';
import { Spinner } from './components/spinner/spinner';
import { Tab } from './components/tabs/tab';
import { Tabs } from './components/tabs/tabs';
import { TabButton } from './components/tabs/tab-button';
import { TabHighlight } from './components/tabs/tab-highlight';
import { TextInput } from './components/input/input';
import { Thumbnail } from './components/thumbnail/thumbnail';
import { Toggle } from './components/toggle/toggle';
import { Toolbar } from './components/toolbar/toolbar';
import { Header } from './components/toolbar/toolbar-header';
import { Footer } from './components/toolbar/toolbar-footer';
import { ToolbarItem } from './components/toolbar/toolbar-item';
import { ToolbarTitle } from './components/toolbar/toolbar-title';
import { Typography } from './components/typography/typography';
import { VirtualScroll } from './components/virtual-scroll/virtual-scroll';
import { VirtualItem } from './components/virtual-scroll/virtual-item';
import { VirtualHeader } from './components/virtual-scroll/virtual-header';
import { VirtualFooter } from './components/virtual-scroll/virtual-footer';
      `;

      // act

      const modulesToPurge = [join(componentDir, 'range', 'range-knob'),
                              join(componentDir, 'refresher', 'refresher'),
                              join(componentDir, 'refresher', 'refresher-content')];
      const newContent = treeshake.purgeUnusedImportsAndExportsFromModuleFile(ionicAngularEntryPoint, moduleFileContent, modulesToPurge);
      // assert
      expect(newContent).not.toEqual(moduleFileContent);
      expect(newContent.indexOf(importsToPurge)).toEqual(-1);
    });
  });

  describe('purgeComponentNgFactoryImportAndUsage', () => {
    it('should purge the component factory import and usage from the file', () => {
      // arrange
      const knownImport = `import * as import29 from '../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory';`;
      const knownImport2 = `import * as import30 from '../../node_modules/ionic-angular/components/alert/alert-component.ngfactory';`;
      const knownImportUsage = `import29.ActionSheetCmpNgFactory,`;
      const knownImportUsage2 = `import30.AlertCmpNgFactory,`;
      const knownContent = `
 var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as import0 from '@angular/core';
import * as import1 from './app.module';
import * as import2 from '@angular/common';
import * as import3 from 'ionic-angular/util/ionic-error-handler';
import * as import4 from 'ionic-angular/platform/dom-controller';
import * as import5 from 'ionic-angular/components/app/menu-controller';
import * as import6 from 'ionic-angular/components/app/app';
import * as import7 from 'ionic-angular/gestures/gesture-controller';
import * as import8 from 'ionic-angular/util/ng-module-loader';
import * as import9 from '@angular/platform-browser';
import * as import10 from '@angular/forms';
import * as import11 from 'ionic-angular/module';
import * as import12 from 'ionic-angular/gestures/gesture-config';
import * as import13 from 'ionic-angular/components/action-sheet/action-sheet-controller';
import * as import14 from 'ionic-angular/components/alert/alert-controller';
import * as import15 from 'ionic-angular/util/events';
import * as import16 from 'ionic-angular/util/form';
import * as import17 from 'ionic-angular/tap-click/haptic';
import * as import18 from 'ionic-angular/platform/keyboard';
import * as import19 from 'ionic-angular/components/loading/loading-controller';
import * as import20 from 'ionic-angular/components/modal/modal-controller';
import * as import21 from 'ionic-angular/components/picker/picker-controller';
import * as import22 from 'ionic-angular/components/popover/popover-controller';
import * as import23 from 'ionic-angular/tap-click/tap-click';
import * as import24 from 'ionic-angular/components/toast/toast-controller';
import * as import25 from 'ionic-angular/transitions/transition-controller';
import * as import26 from '@ionic-native/status-bar/index';
import * as import27 from '@ionic-native/splash-screen/index';
import * as import28 from './provider';
${knownImport}
${knownImport2}
import * as import31 from '../../node_modules/ionic-angular/components/app/app-root.ngfactory';
import * as import32 from '../../node_modules/ionic-angular/components/loading/loading-component.ngfactory';
import * as import33 from '../../node_modules/ionic-angular/components/modal/modal-component.ngfactory';
import * as import34 from '../../node_modules/ionic-angular/components/picker/picker-component.ngfactory';
import * as import35 from '../../node_modules/ionic-angular/components/popover/popover-component.ngfactory';
import * as import36 from '../../node_modules/ionic-angular/components/select/select-popover-component.ngfactory';
import * as import37 from '../../node_modules/ionic-angular/components/toast/toast-component.ngfactory';
import * as import38 from './app.component.ngfactory';
import * as import39 from 'ionic-angular/navigation/url-serializer';
import * as import40 from 'ionic-angular/navigation/deep-linker';
import * as import41 from 'ionic-angular/platform/platform-registry';
import * as import42 from 'ionic-angular/platform/platform';
import * as import43 from 'ionic-angular/config/config';
import * as import44 from 'ionic-angular/util/module-loader';
import * as import45 from 'ionic-angular/config/mode-registry';
import * as import46 from './app.component';
import * as import47 from 'ionic-angular/components/app/app-root';
var AppModuleInjector = /*#__PURE__*/ (function (_super) {
    __extends(AppModuleInjector, _super);
    function AppModuleInjector(parent) {
        return _super.call(this, parent, [
            ${knownImportUsage}
            ${knownImportUsage2}
            import31.IonicAppNgFactory,
            import32.LoadingCmpNgFactory,
            import33.ModalCmpNgFactory,
            import34.PickerCmpNgFactory,
            import35.PopoverCmpNgFactory,
            import36.SelectPopoverNgFactory,
            import37.ToastCmpNgFactory,
            import38.MyAppNgFactory
        ], [import31.IonicAppNgFactory]) || this;
    }
    Object.defineProperty(AppModuleInjector.prototype, "_LOCALE_ID_25", {
        get: function () {
            if ((this.__LOCALE_ID_25 == null)) {
                (this.__LOCALE_ID_25 = import0.ɵn(this.parent.get(import0.LOCALE_ID, null)));
            }
            return this.__LOCALE_ID_25;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_NgLocalization_26", {
        get: function () {
            if ((this.__NgLocalization_26 == null)) {
                (this.__NgLocalization_26 = new import2.NgLocaleLocalization(this._LOCALE_ID_25));
            }
            return this.__NgLocalization_26;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_APP_ID_27", {
        get: function () {
            if ((this.__APP_ID_27 == null)) {
                (this.__APP_ID_27 = import0.ɵg());
            }
            return this.__APP_ID_27;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_IterableDiffers_28", {
        get: function () {
            if ((this.__IterableDiffers_28 == null)) {
                (this.__IterableDiffers_28 = import0.ɵl());
            }
            return this.__IterableDiffers_28;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_KeyValueDiffers_29", {
        get: function () {
            if ((this.__KeyValueDiffers_29 == null)) {
                (this.__KeyValueDiffers_29 = import0.ɵm());
            }
            return this.__KeyValueDiffers_29;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_DomSanitizer_30", {
        get: function () {
            if ((this.__DomSanitizer_30 == null)) {
                (this.__DomSanitizer_30 = new import9.ɵe(this.parent.get(import9.DOCUMENT)));
            }
            return this.__DomSanitizer_30;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Sanitizer_31", {
        get: function () {
            if ((this.__Sanitizer_31 == null)) {
                (this.__Sanitizer_31 = this._DomSanitizer_30);
            }
            return this.__Sanitizer_31;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_HAMMER_GESTURE_CONFIG_32", {
        get: function () {
            if ((this.__HAMMER_GESTURE_CONFIG_32 == null)) {
                (this.__HAMMER_GESTURE_CONFIG_32 = new import12.IonicGestureConfig());
            }
            return this.__HAMMER_GESTURE_CONFIG_32;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_EVENT_MANAGER_PLUGINS_33", {
        get: function () {
            if ((this.__EVENT_MANAGER_PLUGINS_33 == null)) {
                (this.__EVENT_MANAGER_PLUGINS_33 = [
                    new import9.ɵDomEventsPlugin(this.parent.get(import9.DOCUMENT)),
                    new import9.ɵKeyEventsPlugin(this.parent.get(import9.DOCUMENT)),
                    new import9.ɵHammerGesturesPlugin(this.parent.get(import9.DOCUMENT), this._HAMMER_GESTURE_CONFIG_32)
                ]);
            }
            return this.__EVENT_MANAGER_PLUGINS_33;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_EventManager_34", {
        get: function () {
            if ((this.__EventManager_34 == null)) {
                (this.__EventManager_34 = new import9.EventManager(this._EVENT_MANAGER_PLUGINS_33, this.parent.get(import0.NgZone)));
            }
            return this.__EventManager_34;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275DomSharedStylesHost_35", {
        get: function () {
            if ((this.__ɵDomSharedStylesHost_35 == null)) {
                (this.__ɵDomSharedStylesHost_35 = new import9.ɵDomSharedStylesHost(this.parent.get(import9.DOCUMENT)));
            }
            return this.__ɵDomSharedStylesHost_35;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275DomRendererFactory2_36", {
        get: function () {
            if ((this.__ɵDomRendererFactory2_36 == null)) {
                (this.__ɵDomRendererFactory2_36 = new import9.ɵDomRendererFactory2(this._EventManager_34, this._ɵDomSharedStylesHost_35));
            }
            return this.__ɵDomRendererFactory2_36;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_RendererFactory2_37", {
        get: function () {
            if ((this.__RendererFactory2_37 == null)) {
                (this.__RendererFactory2_37 = this._ɵDomRendererFactory2_36);
            }
            return this.__RendererFactory2_37;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275SharedStylesHost_38", {
        get: function () {
            if ((this.__ɵSharedStylesHost_38 == null)) {
                (this.__ɵSharedStylesHost_38 = this._ɵDomSharedStylesHost_35);
            }
            return this.__ɵSharedStylesHost_38;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Testability_39", {
        get: function () {
            if ((this.__Testability_39 == null)) {
                (this.__Testability_39 = new import0.Testability(this.parent.get(import0.NgZone)));
            }
            return this.__Testability_39;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Meta_40", {
        get: function () {
            if ((this.__Meta_40 == null)) {
                (this.__Meta_40 = new import9.Meta(this.parent.get(import9.DOCUMENT)));
            }
            return this.__Meta_40;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Title_41", {
        get: function () {
            if ((this.__Title_41 == null)) {
                (this.__Title_41 = new import9.Title(this.parent.get(import9.DOCUMENT)));
            }
            return this.__Title_41;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275i_42", {
        get: function () {
            if ((this.__ɵi_42 == null)) {
                (this.__ɵi_42 = new import10.ɵi());
            }
            return this.__ɵi_42;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_FormBuilder_43", {
        get: function () {
            if ((this.__FormBuilder_43 == null)) {
                (this.__FormBuilder_43 = new import10.FormBuilder());
            }
            return this.__FormBuilder_43;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_ActionSheetController_46", {
        get: function () {
            if ((this.__ActionSheetController_46 == null)) {
                (this.__ActionSheetController_46 = new import13.ActionSheetController(this._App_8, this._Config_5));
            }
            return this.__ActionSheetController_46;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_AlertController_47", {
        get: function () {
            if ((this.__AlertController_47 == null)) {
                (this.__AlertController_47 = new import14.AlertController(this._App_8, this._Config_5));
            }
            return this.__AlertController_47;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Events_48", {
        get: function () {
            if ((this.__Events_48 == null)) {
                (this.__Events_48 = new import15.Events());
            }
            return this.__Events_48;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Form_49", {
        get: function () {
            if ((this.__Form_49 == null)) {
                (this.__Form_49 = new import16.Form());
            }
            return this.__Form_49;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Haptic_50", {
        get: function () {
            if ((this.__Haptic_50 == null)) {
                (this.__Haptic_50 = new import17.Haptic(this._Platform_4));
            }
            return this.__Haptic_50;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Keyboard_51", {
        get: function () {
            if ((this.__Keyboard_51 == null)) {
                (this.__Keyboard_51 = new import18.Keyboard(this._Config_5, this._Platform_4, this.parent.get(import0.NgZone), this._DomController_6));
            }
            return this.__Keyboard_51;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_LoadingController_52", {
        get: function () {
            if ((this.__LoadingController_52 == null)) {
                (this.__LoadingController_52 = new import19.LoadingController(this._App_8, this._Config_5));
            }
            return this.__LoadingController_52;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_LocationStrategy_53", {
        get: function () {
            if ((this.__LocationStrategy_53 == null)) {
                (this.__LocationStrategy_53 = import11.provideLocationStrategy(this.parent.get(import2.PlatformLocation), this._APP_BASE_HREF_45, this._Config_5));
            }
            return this.__LocationStrategy_53;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Location_54", {
        get: function () {
            if ((this.__Location_54 == null)) {
                (this.__Location_54 = new import2.Location(this._LocationStrategy_53));
            }
            return this.__Location_54;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_UrlSerializer_55", {
        get: function () {
            if ((this.__UrlSerializer_55 == null)) {
                (this.__UrlSerializer_55 = import39.setupUrlSerializer(this._DeepLinkConfigToken_10));
            }
            return this.__UrlSerializer_55;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_DeepLinker_56", {
        get: function () {
            if ((this.__DeepLinker_56 == null)) {
                (this.__DeepLinker_56 = import40.setupDeepLinker(this._App_8, this._UrlSerializer_55, this._Location_54, this._ModuleLoader_13, this.componentFactoryResolver));
            }
            return this.__DeepLinker_56;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_ModalController_57", {
        get: function () {
            if ((this.__ModalController_57 == null)) {
                (this.__ModalController_57 = new import20.ModalController(this._App_8, this._Config_5, this._DeepLinker_56));
            }
            return this.__ModalController_57;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_PickerController_58", {
        get: function () {
            if ((this.__PickerController_58 == null)) {
                (this.__PickerController_58 = new import21.PickerController(this._App_8, this._Config_5));
            }
            return this.__PickerController_58;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_PopoverController_59", {
        get: function () {
            if ((this.__PopoverController_59 == null)) {
                (this.__PopoverController_59 = new import22.PopoverController(this._App_8, this._Config_5, this._DeepLinker_56));
            }
            return this.__PopoverController_59;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_TapClick_60", {
        get: function () {
            if ((this.__TapClick_60 == null)) {
                (this.__TapClick_60 = new import23.TapClick(this._Config_5, this._Platform_4, this._DomController_6, this._App_8, this.parent.get(import0.NgZone), this._GestureController_9));
            }
            return this.__TapClick_60;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_ToastController_61", {
        get: function () {
            if ((this.__ToastController_61 == null)) {
                (this.__ToastController_61 = new import24.ToastController(this._App_8, this._Config_5));
            }
            return this.__ToastController_61;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_TransitionController_62", {
        get: function () {
            if ((this.__TransitionController_62 == null)) {
                (this.__TransitionController_62 = new import25.TransitionController(this._Platform_4, this._Config_5));
            }
            return this.__TransitionController_62;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_StatusBar_63", {
        get: function () {
            if ((this.__StatusBar_63 == null)) {
                (this.__StatusBar_63 = new import26.StatusBar());
            }
            return this.__StatusBar_63;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_SplashScreen_64", {
        get: function () {
            if ((this.__SplashScreen_64 == null)) {
                (this.__SplashScreen_64 = new import27.SplashScreen());
            }
            return this.__SplashScreen_64;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_SampleProvider_65", {
        get: function () {
            if ((this.__SampleProvider_65 == null)) {
                (this.__SampleProvider_65 = new import28.SampleProvider(this._LoadingController_52));
            }
            return this.__SampleProvider_65;
        },
        enumerable: true,
        configurable: true
    });
    AppModuleInjector.prototype.createInternal = function () {
        this._CommonModule_0 = new import2.CommonModule();
        this._ErrorHandler_1 = new import3.IonicErrorHandler();
        this._ConfigToken_2 = null;
        this._PlatformConfigToken_3 = import41.providePlatformConfigs();
        this._Platform_4 = import42.setupPlatform(this.parent.get(import9.DOCUMENT), this._PlatformConfigToken_3, this.parent.get(import0.NgZone));
        this._Config_5 = import43.setupConfig(this._ConfigToken_2, this._Platform_4);
        this._DomController_6 = new import4.DomController(this._Platform_4);
        this._MenuController_7 = new import5.MenuController();
        this._App_8 = new import6.App(this._Config_5, this._Platform_4, this._MenuController_7);
        this._GestureController_9 = new import7.GestureController(this._App_8);
        this._DeepLinkConfigToken_10 =
            {
                links: [
                    { loadChildren: '../pages/home/home.module.ngfactory#HomePageModuleNgFactory', name: 'HomePage', segment: 'home', priority: 'low', defaultHistory: [] },
                    { loadChildren: '../pages/page-three/page-three.module.ngfactory#PageThreeModuleNgFactory', name: 'PageThree', segment: 'page-three', priority: 'low', defaultHistory: [] },
                    { loadChildren: '../pages/page-two/page-two.module.ngfactory#PageTwoModuleNgFactory', name: 'PageTwo', segment: 'page-two', priority: 'low', defaultHistory: [] }
                ]
            };
        this._Compiler_11 = new import0.Compiler();
        this._NgModuleLoader_12 = new import8.NgModuleLoader(this._Compiler_11);
        this._ModuleLoader_13 = import44.provideModuleLoader(this._NgModuleLoader_12, this);
        this._APP_INITIALIZER_14 = [
            import0.ɵo,
            import9.ɵc(this.parent.get(import9.NgProbeToken, null), this.parent.get(import0.NgProbeToken, null)),
            import45.registerModeConfigs(this._Config_5),
            import15.setupProvideEvents(this._Platform_4, this._DomController_6),
            import23.setupTapClick(this._Config_5, this._Platform_4, this._DomController_6, this._App_8, this.parent.get(import0.NgZone), this._GestureController_9),
            import44.setupPreloading(this._Config_5, this._DeepLinkConfigToken_10, this._ModuleLoader_13, this.parent.get(import0.NgZone))
        ];
        this._ApplicationInitStatus_15 = new import0.ApplicationInitStatus(this._APP_INITIALIZER_14);
        this._ɵf_16 = new import0.ɵf(this.parent.get(import0.NgZone), this.parent.get(import0.ɵConsole), this, this._ErrorHandler_1, this.componentFactoryResolver, this._ApplicationInitStatus_15);
        this._ApplicationRef_17 = this._ɵf_16;
        this._ApplicationModule_18 = new import0.ApplicationModule(this._ApplicationRef_17);
        this._BrowserModule_19 = new import9.BrowserModule(this.parent.get(import9.BrowserModule, null));
        this._ɵba_20 = new import10.ɵba();
        this._FormsModule_21 = new import10.FormsModule();
        this._ReactiveFormsModule_22 = new import10.ReactiveFormsModule();
        this._IonicModule_23 = new import11.IonicModule();
        this._AppModule_24 = new import1.AppModule();
        this._AppRootToken_44 = import46.MyApp;
        this._APP_BASE_HREF_45 = '/';
        return this._AppModule_24;
    };
    AppModuleInjector.prototype.getInternal = function (token, notFoundResult) {
        if ((token === import2.CommonModule)) {
            return this._CommonModule_0;
        }
        if ((token === import0.ErrorHandler)) {
            return this._ErrorHandler_1;
        }
        if ((token === import43.ConfigToken)) {
            return this._ConfigToken_2;
        }
        if ((token === import41.PlatformConfigToken)) {
            return this._PlatformConfigToken_3;
        }
        if ((token === import42.Platform)) {
            return this._Platform_4;
        }
        if ((token === import43.Config)) {
            return this._Config_5;
        }
        if ((token === import4.DomController)) {
            return this._DomController_6;
        }
        if ((token === import5.MenuController)) {
            return this._MenuController_7;
        }
        if ((token === import6.App)) {
            return this._App_8;
        }
        if ((token === import7.GestureController)) {
            return this._GestureController_9;
        }
        if ((token === import39.DeepLinkConfigToken)) {
            return this._DeepLinkConfigToken_10;
        }
        if ((token === import0.Compiler)) {
            return this._Compiler_11;
        }
        if ((token === import8.NgModuleLoader)) {
            return this._NgModuleLoader_12;
        }
        if ((token === import44.ModuleLoader)) {
            return this._ModuleLoader_13;
        }
        if ((token === import0.APP_INITIALIZER)) {
            return this._APP_INITIALIZER_14;
        }
        if ((token === import0.ApplicationInitStatus)) {
            return this._ApplicationInitStatus_15;
        }
        if ((token === import0.ɵf)) {
            return this._ɵf_16;
        }
        if ((token === import0.ApplicationRef)) {
            return this._ApplicationRef_17;
        }
        if ((token === import0.ApplicationModule)) {
            return this._ApplicationModule_18;
        }
        if ((token === import9.BrowserModule)) {
            return this._BrowserModule_19;
        }
        if ((token === import10.ɵba)) {
            return this._ɵba_20;
        }
        if ((token === import10.FormsModule)) {
            return this._FormsModule_21;
        }
        if ((token === import10.ReactiveFormsModule)) {
            return this._ReactiveFormsModule_22;
        }
        if ((token === import11.IonicModule)) {
            return this._IonicModule_23;
        }
        if ((token === import1.AppModule)) {
            return this._AppModule_24;
        }
        if ((token === import0.LOCALE_ID)) {
            return this._LOCALE_ID_25;
        }
        if ((token === import2.NgLocalization)) {
            return this._NgLocalization_26;
        }
        if ((token === import0.APP_ID)) {
            return this._APP_ID_27;
        }
        if ((token === import0.IterableDiffers)) {
            return this._IterableDiffers_28;
        }
        if ((token === import0.KeyValueDiffers)) {
            return this._KeyValueDiffers_29;
        }
        if ((token === import9.DomSanitizer)) {
            return this._DomSanitizer_30;
        }
        if ((token === import0.Sanitizer)) {
            return this._Sanitizer_31;
        }
        if ((token === import9.HAMMER_GESTURE_CONFIG)) {
            return this._HAMMER_GESTURE_CONFIG_32;
        }
        if ((token === import9.EVENT_MANAGER_PLUGINS)) {
            return this._EVENT_MANAGER_PLUGINS_33;
        }
        if ((token === import9.EventManager)) {
            return this._EventManager_34;
        }
        if ((token === import9.ɵDomSharedStylesHost)) {
            return this._ɵDomSharedStylesHost_35;
        }
        if ((token === import9.ɵDomRendererFactory2)) {
            return this._ɵDomRendererFactory2_36;
        }
        if ((token === import0.RendererFactory2)) {
            return this._RendererFactory2_37;
        }
        if ((token === import9.ɵSharedStylesHost)) {
            return this._ɵSharedStylesHost_38;
        }
        if ((token === import0.Testability)) {
            return this._Testability_39;
        }
        if ((token === import9.Meta)) {
            return this._Meta_40;
        }
        if ((token === import9.Title)) {
            return this._Title_41;
        }
        if ((token === import10.ɵi)) {
            return this._ɵi_42;
        }
        if ((token === import10.FormBuilder)) {
            return this._FormBuilder_43;
        }
        if ((token === import47.AppRootToken)) {
            return this._AppRootToken_44;
        }
        if ((token === import2.APP_BASE_HREF)) {
            return this._APP_BASE_HREF_45;
        }
        if ((token === import13.ActionSheetController)) {
            return this._ActionSheetController_46;
        }
        if ((token === import14.AlertController)) {
            return this._AlertController_47;
        }
        if ((token === import15.Events)) {
            return this._Events_48;
        }
        if ((token === import16.Form)) {
            return this._Form_49;
        }
        if ((token === import17.Haptic)) {
            return this._Haptic_50;
        }
        if ((token === import18.Keyboard)) {
            return this._Keyboard_51;
        }
        if ((token === import19.LoadingController)) {
            return this._LoadingController_52;
        }
        if ((token === import2.LocationStrategy)) {
            return this._LocationStrategy_53;
        }
        if ((token === import2.Location)) {
            return this._Location_54;
        }
        if ((token === import39.UrlSerializer)) {
            return this._UrlSerializer_55;
        }
        if ((token === import40.DeepLinker)) {
            return this._DeepLinker_56;
        }
        if ((token === import20.ModalController)) {
            return this._ModalController_57;
        }
        if ((token === import21.PickerController)) {
            return this._PickerController_58;
        }
        if ((token === import22.PopoverController)) {
            return this._PopoverController_59;
        }
        if ((token === import23.TapClick)) {
            return this._TapClick_60;
        }
        if ((token === import24.ToastController)) {
            return this._ToastController_61;
        }
        if ((token === import25.TransitionController)) {
            return this._TransitionController_62;
        }
        if ((token === import26.StatusBar)) {
            return this._StatusBar_63;
        }
        if ((token === import27.SplashScreen)) {
            return this._SplashScreen_64;
        }
        if ((token === import28.SampleProvider)) {
            return this._SampleProvider_65;
        }
        return notFoundResult;
    };
    AppModuleInjector.prototype.destroyInternal = function () {
        this._ɵf_16.ngOnDestroy();
        (this.__ɵDomSharedStylesHost_35 && this._ɵDomSharedStylesHost_35.ngOnDestroy());
    };
    return AppModuleInjector;
}(import0.ɵNgModuleInjector));
export var AppModuleNgFactory = new import0.NgModuleFactory(AppModuleInjector, import1.AppModule);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2Rhbi9EZXNrdG9wL215QXBwL3NyYy9hcHAvYXBwLm1vZHVsZS5uZ2ZhY3RvcnkudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9kYW4vRGVza3RvcC9teUFwcC9zcmMvYXBwL2FwcC5tb2R1bGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsifQ==
//# sourceMappingURL=app.module.ngfactory.js.map
      `;

      const appModuleNgFactoryPath = join(srcDir, 'app', 'app.module.ngfactory.js');
      const componentFactoryPath = join(componentDir, 'action-sheet', 'action-sheet-component.ngfactory.js');
      const componentFactoryPath2 = join(componentDir, 'alert', 'alert-component.ngfactory.js');

      // act
      const updatedContent = treeshake.purgeComponentNgFactoryImportAndUsage(appModuleNgFactoryPath, knownContent, componentFactoryPath);
      const updatedContentAgain = treeshake.purgeComponentNgFactoryImportAndUsage(appModuleNgFactoryPath, updatedContent, componentFactoryPath2);

      // assert
      expect(updatedContentAgain).not.toEqual(knownContent);
      const knownImportOneRegex = treeshake.generateWildCardImportRegex('../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory');
      const knownImportTwoRegex = treeshake.generateWildCardImportRegex('../../node_modules/ionic-angular/components/alert/alert-component.ngfactory');
      const knownImportOneResults = knownImportOneRegex.exec(updatedContentAgain);
      const knownImportTwoResults = knownImportTwoRegex.exec(updatedContentAgain);
      const knownNamedImportOne = knownImportOneResults[1].trim();
      const knownNamedImportTwo = knownImportTwoResults[1].trim();
      expect(updatedContentAgain.indexOf(`/*${knownImportOneResults[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContentAgain.indexOf(`/*${knownImportTwoResults[0]}*/`)).toBeGreaterThanOrEqual(0);

      const removeFromConstructorRegexOne = treeshake.generateRemoveComponentFromConstructorRegex(knownNamedImportOne);
      const removeFromConstructorRegexTwo = treeshake.generateRemoveComponentFromConstructorRegex(knownNamedImportTwo);
      const removeFromConstructorOneResults = removeFromConstructorRegexOne.exec(updatedContentAgain);
      const removeFromConstructorTwoResults = removeFromConstructorRegexTwo.exec(updatedContentAgain);
      expect(updatedContentAgain.indexOf(`/*${removeFromConstructorOneResults[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContentAgain.indexOf(`/*${removeFromConstructorTwoResults[0]}*/`)).toBeGreaterThanOrEqual(0);
    });
  });



  describe('purgeProviderClassNameFromIonicModuleForRoot', () => {
    it('should purge the provider from the forRoot method object', () => {
      // arrange
      const classOne = `ModalController`;
      const classTwo = `LoadingController`;
      const knownContent = `
        static forRoot(appRoot, config = null, deepLinkConfig = null) {
        return {
            ngModule: IonicModule,
            providers: [
                // useValue: bootstrap values
                { provide: AppRootToken, useValue: appRoot },
                { provide: ConfigToken, useValue: config },
                { provide: DeepLinkConfigToken, useValue: deepLinkConfig },
                // useFactory: user values
                { provide: PlatformConfigToken, useFactory: providePlatformConfigs },
                // useFactory: ionic core providers
                { provide: Platform, useFactory: setupPlatform, deps: [DOCUMENT, PlatformConfigToken, NgZone] },
                { provide: Config, useFactory: setupConfig, deps: [ConfigToken, Platform] },
                // useFactory: ionic app initializers
                { provide: APP_INITIALIZER, useFactory: registerModeConfigs, deps: [Config], multi: true },
                { provide: APP_INITIALIZER, useFactory: setupProvideEvents, deps: [Platform, DomController], multi: true },
                { provide: APP_INITIALIZER, useFactory: setupTapClick, deps: [Config, Platform, DomController, App, NgZone, GestureController], multi: true },
                // useClass
                // { provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig },
                // useValue
                { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: appRoot, multi: true },
                // ionic providers
                ActionSheetController,
                AlertController,
                App,
                DomController,
                Events,
                Form,
                GestureController,
                Haptic,
                Keyboard,
                ${classTwo},
                Location,
                MenuController,
                ${classOne},
                PickerController,
                PopoverController,
                SystemJsNgModuleLoader,
                TapClick,
                ToastController,
                TransitionController,
                { provide: ModuleLoader, useFactory: provideModuleLoader, deps: [DeepLinkConfigToken, SystemJsNgModuleLoader, Injector] },
                { provide: LocationStrategy, useFactory: provideLocationStrategy, deps: [PlatformLocation, [new Inject(APP_BASE_HREF), new Optional()], Config] },
                { provide: UrlSerializer, useFactory: setupUrlSerializer, deps: [DeepLinkConfigToken] },
                { provide: DeepLinker, useFactory: setupDeepLinker, deps: [App, UrlSerializer, Location, DeepLinkConfigToken, ModuleLoader, ComponentFactoryResolver] },
            ]
        };
    }
}
      `;

      // act

      let updatedContent = treeshake.purgeProviderClassNameFromIonicModuleForRoot(knownContent, classOne);
      updatedContent = treeshake.purgeProviderClassNameFromIonicModuleForRoot(updatedContent, classTwo);

      // assert
      expect(updatedContent).not.toEqual(knownContent);
      const regexOne = treeshake.generateIonicModulePurgeProviderRegex(classOne);
      const regexTwo = treeshake.generateIonicModulePurgeProviderRegex(classTwo);
      const resultsOne = regexOne.exec(updatedContent);
      const resultsTwo = regexTwo.exec(updatedContent);
      expect(updatedContent.indexOf(`/*${resultsOne[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${resultsTwo[0]}*/`)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('purgeProviderControllerImportAndUsage', () => {

    it('should purge the controller provider content', () => {
      // arrange

      const ifStatementOne = `
if ((token === import13.ActionSheetController)) {
    return this._ActionSheetController_46;
}`;

      const ifStatementTwo = `
if ((token === import14.AlertController)) {
    return this._AlertController_47;
}
      `;

      const getterOne = `
Object.defineProperty(AppModuleInjector.prototype, "_ActionSheetController_46", {
    get: function () {
        if ((this.__ActionSheetController_46 == null)) {
            (this.__ActionSheetController_46 = new import13.ActionSheetController(this._App_8, this._Config_5));
        }
        return this.__ActionSheetController_46;
    },
    enumerable: true,
    configurable: true
});`;

      const getterTwo = `
Object.defineProperty(AppModuleInjector.prototype, "_AlertController_47", {
    get: function () {
        if ((this.__AlertController_47 == null)) {
            (this.__AlertController_47 = new import14.AlertController(this._App_8, this._Config_5));
        }
        return this.__AlertController_47;
    },
    enumerable: true,
    configurable: true
});`;

      const knownContent = `
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as import0 from '@angular/core';
import * as import1 from './app.module';
import * as import2 from '@angular/common';
import * as import3 from 'ionic-angular/util/ionic-error-handler';
import * as import4 from 'ionic-angular/platform/dom-controller';
import * as import5 from 'ionic-angular/components/app/menu-controller';
import * as import6 from 'ionic-angular/components/app/app';
import * as import7 from 'ionic-angular/gestures/gesture-controller';
import * as import8 from 'ionic-angular/util/ng-module-loader';
import * as import9 from '@angular/platform-browser';
import * as import10 from '@angular/forms';
import * as import11 from 'ionic-angular/module';
import * as import12 from 'ionic-angular/gestures/gesture-config';
import * as import13 from 'ionic-angular/components/action-sheet/action-sheet-controller';
import * as import14 from 'ionic-angular/components/alert/alert-controller';
import * as import15 from 'ionic-angular/util/events';
import * as import16 from 'ionic-angular/util/form';
import * as import17 from 'ionic-angular/tap-click/haptic';
import * as import18 from 'ionic-angular/platform/keyboard';
import * as import19 from 'ionic-angular/components/loading/loading-controller';
import * as import20 from 'ionic-angular/components/modal/modal-controller';
import * as import21 from 'ionic-angular/components/picker/picker-controller';
import * as import22 from 'ionic-angular/components/popover/popover-controller';
import * as import23 from 'ionic-angular/tap-click/tap-click';
import * as import24 from 'ionic-angular/components/toast/toast-controller';
import * as import25 from 'ionic-angular/transitions/transition-controller';
import * as import26 from '@ionic-native/status-bar/index';
import * as import27 from '@ionic-native/splash-screen/index';
import * as import28 from './provider';
import * as import29 from '../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory';
import * as import30 from '../../node_modules/ionic-angular/components/alert/alert-component.ngfactory';
import * as import31 from '../../node_modules/ionic-angular/components/app/app-root.ngfactory';
import * as import32 from '../../node_modules/ionic-angular/components/loading/loading-component.ngfactory';
import * as import33 from '../../node_modules/ionic-angular/components/modal/modal-component.ngfactory';
import * as import34 from '../../node_modules/ionic-angular/components/picker/picker-component.ngfactory';
import * as import35 from '../../node_modules/ionic-angular/components/popover/popover-component.ngfactory';
import * as import36 from '../../node_modules/ionic-angular/components/select/select-popover-component.ngfactory';
import * as import37 from '../../node_modules/ionic-angular/components/toast/toast-component.ngfactory';
import * as import38 from './app.component.ngfactory';
import * as import39 from 'ionic-angular/navigation/url-serializer';
import * as import40 from 'ionic-angular/navigation/deep-linker';
import * as import41 from 'ionic-angular/platform/platform-registry';
import * as import42 from 'ionic-angular/platform/platform';
import * as import43 from 'ionic-angular/config/config';
import * as import44 from 'ionic-angular/util/module-loader';
import * as import45 from 'ionic-angular/config/mode-registry';
import * as import46 from './app.component';
import * as import47 from 'ionic-angular/components/app/app-root';
var AppModuleInjector = /*#__PURE__*/ (function (_super) {
    __extends(AppModuleInjector, _super);
    function AppModuleInjector(parent) {
        return _super.call(this, parent, [
            import29.ActionSheetCmpNgFactory,
            import30.AlertCmpNgFactory,
            import31.IonicAppNgFactory,
            import32.LoadingCmpNgFactory,
            import33.ModalCmpNgFactory,
            import34.PickerCmpNgFactory,
            import35.PopoverCmpNgFactory,
            import36.SelectPopoverNgFactory,
            import37.ToastCmpNgFactory,
            import38.MyAppNgFactory
        ], [import31.IonicAppNgFactory]) || this;
    }
    Object.defineProperty(AppModuleInjector.prototype, "_LOCALE_ID_25", {
        get: function () {
            if ((this.__LOCALE_ID_25 == null)) {
                (this.__LOCALE_ID_25 = import0.ɵn(this.parent.get(import0.LOCALE_ID, null)));
            }
            return this.__LOCALE_ID_25;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_NgLocalization_26", {
        get: function () {
            if ((this.__NgLocalization_26 == null)) {
                (this.__NgLocalization_26 = new import2.NgLocaleLocalization(this._LOCALE_ID_25));
            }
            return this.__NgLocalization_26;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_APP_ID_27", {
        get: function () {
            if ((this.__APP_ID_27 == null)) {
                (this.__APP_ID_27 = import0.ɵg());
            }
            return this.__APP_ID_27;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_IterableDiffers_28", {
        get: function () {
            if ((this.__IterableDiffers_28 == null)) {
                (this.__IterableDiffers_28 = import0.ɵl());
            }
            return this.__IterableDiffers_28;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_KeyValueDiffers_29", {
        get: function () {
            if ((this.__KeyValueDiffers_29 == null)) {
                (this.__KeyValueDiffers_29 = import0.ɵm());
            }
            return this.__KeyValueDiffers_29;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_DomSanitizer_30", {
        get: function () {
            if ((this.__DomSanitizer_30 == null)) {
                (this.__DomSanitizer_30 = new import9.ɵe(this.parent.get(import9.DOCUMENT)));
            }
            return this.__DomSanitizer_30;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Sanitizer_31", {
        get: function () {
            if ((this.__Sanitizer_31 == null)) {
                (this.__Sanitizer_31 = this._DomSanitizer_30);
            }
            return this.__Sanitizer_31;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_HAMMER_GESTURE_CONFIG_32", {
        get: function () {
            if ((this.__HAMMER_GESTURE_CONFIG_32 == null)) {
                (this.__HAMMER_GESTURE_CONFIG_32 = new import12.IonicGestureConfig());
            }
            return this.__HAMMER_GESTURE_CONFIG_32;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_EVENT_MANAGER_PLUGINS_33", {
        get: function () {
            if ((this.__EVENT_MANAGER_PLUGINS_33 == null)) {
                (this.__EVENT_MANAGER_PLUGINS_33 = [
                    new import9.ɵDomEventsPlugin(this.parent.get(import9.DOCUMENT)),
                    new import9.ɵKeyEventsPlugin(this.parent.get(import9.DOCUMENT)),
                    new import9.ɵHammerGesturesPlugin(this.parent.get(import9.DOCUMENT), this._HAMMER_GESTURE_CONFIG_32)
                ]);
            }
            return this.__EVENT_MANAGER_PLUGINS_33;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_EventManager_34", {
        get: function () {
            if ((this.__EventManager_34 == null)) {
                (this.__EventManager_34 = new import9.EventManager(this._EVENT_MANAGER_PLUGINS_33, this.parent.get(import0.NgZone)));
            }
            return this.__EventManager_34;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275DomSharedStylesHost_35", {
        get: function () {
            if ((this.__ɵDomSharedStylesHost_35 == null)) {
                (this.__ɵDomSharedStylesHost_35 = new import9.ɵDomSharedStylesHost(this.parent.get(import9.DOCUMENT)));
            }
            return this.__ɵDomSharedStylesHost_35;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275DomRendererFactory2_36", {
        get: function () {
            if ((this.__ɵDomRendererFactory2_36 == null)) {
                (this.__ɵDomRendererFactory2_36 = new import9.ɵDomRendererFactory2(this._EventManager_34, this._ɵDomSharedStylesHost_35));
            }
            return this.__ɵDomRendererFactory2_36;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_RendererFactory2_37", {
        get: function () {
            if ((this.__RendererFactory2_37 == null)) {
                (this.__RendererFactory2_37 = this._ɵDomRendererFactory2_36);
            }
            return this.__RendererFactory2_37;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275SharedStylesHost_38", {
        get: function () {
            if ((this.__ɵSharedStylesHost_38 == null)) {
                (this.__ɵSharedStylesHost_38 = this._ɵDomSharedStylesHost_35);
            }
            return this.__ɵSharedStylesHost_38;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Testability_39", {
        get: function () {
            if ((this.__Testability_39 == null)) {
                (this.__Testability_39 = new import0.Testability(this.parent.get(import0.NgZone)));
            }
            return this.__Testability_39;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Meta_40", {
        get: function () {
            if ((this.__Meta_40 == null)) {
                (this.__Meta_40 = new import9.Meta(this.parent.get(import9.DOCUMENT)));
            }
            return this.__Meta_40;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Title_41", {
        get: function () {
            if ((this.__Title_41 == null)) {
                (this.__Title_41 = new import9.Title(this.parent.get(import9.DOCUMENT)));
            }
            return this.__Title_41;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_\u0275i_42", {
        get: function () {
            if ((this.__ɵi_42 == null)) {
                (this.__ɵi_42 = new import10.ɵi());
            }
            return this.__ɵi_42;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_FormBuilder_43", {
        get: function () {
            if ((this.__FormBuilder_43 == null)) {
                (this.__FormBuilder_43 = new import10.FormBuilder());
            }
            return this.__FormBuilder_43;
        },
        enumerable: true,
        configurable: true
    });
    ${getterOne}
    ${getterTwo}
    Object.defineProperty(AppModuleInjector.prototype, "_Events_48", {
        get: function () {
            if ((this.__Events_48 == null)) {
                (this.__Events_48 = new import15.Events());
            }
            return this.__Events_48;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Form_49", {
        get: function () {
            if ((this.__Form_49 == null)) {
                (this.__Form_49 = new import16.Form());
            }
            return this.__Form_49;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Haptic_50", {
        get: function () {
            if ((this.__Haptic_50 == null)) {
                (this.__Haptic_50 = new import17.Haptic(this._Platform_4));
            }
            return this.__Haptic_50;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Keyboard_51", {
        get: function () {
            if ((this.__Keyboard_51 == null)) {
                (this.__Keyboard_51 = new import18.Keyboard(this._Config_5, this._Platform_4, this.parent.get(import0.NgZone), this._DomController_6));
            }
            return this.__Keyboard_51;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_LoadingController_52", {
        get: function () {
            if ((this.__LoadingController_52 == null)) {
                (this.__LoadingController_52 = new import19.LoadingController(this._App_8, this._Config_5));
            }
            return this.__LoadingController_52;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_LocationStrategy_53", {
        get: function () {
            if ((this.__LocationStrategy_53 == null)) {
                (this.__LocationStrategy_53 = import11.provideLocationStrategy(this.parent.get(import2.PlatformLocation), this._APP_BASE_HREF_45, this._Config_5));
            }
            return this.__LocationStrategy_53;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_Location_54", {
        get: function () {
            if ((this.__Location_54 == null)) {
                (this.__Location_54 = new import2.Location(this._LocationStrategy_53));
            }
            return this.__Location_54;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_UrlSerializer_55", {
        get: function () {
            if ((this.__UrlSerializer_55 == null)) {
                (this.__UrlSerializer_55 = import39.setupUrlSerializer(this._DeepLinkConfigToken_10));
            }
            return this.__UrlSerializer_55;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_DeepLinker_56", {
        get: function () {
            if ((this.__DeepLinker_56 == null)) {
                (this.__DeepLinker_56 = import40.setupDeepLinker(this._App_8, this._UrlSerializer_55, this._Location_54, this._ModuleLoader_13, this.componentFactoryResolver));
            }
            return this.__DeepLinker_56;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_ModalController_57", {
        get: function () {
            if ((this.__ModalController_57 == null)) {
                (this.__ModalController_57 = new import20.ModalController(this._App_8, this._Config_5, this._DeepLinker_56));
            }
            return this.__ModalController_57;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_PickerController_58", {
        get: function () {
            if ((this.__PickerController_58 == null)) {
                (this.__PickerController_58 = new import21.PickerController(this._App_8, this._Config_5));
            }
            return this.__PickerController_58;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_PopoverController_59", {
        get: function () {
            if ((this.__PopoverController_59 == null)) {
                (this.__PopoverController_59 = new import22.PopoverController(this._App_8, this._Config_5, this._DeepLinker_56));
            }
            return this.__PopoverController_59;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_TapClick_60", {
        get: function () {
            if ((this.__TapClick_60 == null)) {
                (this.__TapClick_60 = new import23.TapClick(this._Config_5, this._Platform_4, this._DomController_6, this._App_8, this.parent.get(import0.NgZone), this._GestureController_9));
            }
            return this.__TapClick_60;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_ToastController_61", {
        get: function () {
            if ((this.__ToastController_61 == null)) {
                (this.__ToastController_61 = new import24.ToastController(this._App_8, this._Config_5));
            }
            return this.__ToastController_61;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_TransitionController_62", {
        get: function () {
            if ((this.__TransitionController_62 == null)) {
                (this.__TransitionController_62 = new import25.TransitionController(this._Platform_4, this._Config_5));
            }
            return this.__TransitionController_62;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_StatusBar_63", {
        get: function () {
            if ((this.__StatusBar_63 == null)) {
                (this.__StatusBar_63 = new import26.StatusBar());
            }
            return this.__StatusBar_63;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_SplashScreen_64", {
        get: function () {
            if ((this.__SplashScreen_64 == null)) {
                (this.__SplashScreen_64 = new import27.SplashScreen());
            }
            return this.__SplashScreen_64;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppModuleInjector.prototype, "_SampleProvider_65", {
        get: function () {
            if ((this.__SampleProvider_65 == null)) {
                (this.__SampleProvider_65 = new import28.SampleProvider(this._LoadingController_52));
            }
            return this.__SampleProvider_65;
        },
        enumerable: true,
        configurable: true
    });
    AppModuleInjector.prototype.createInternal = function () {
        this._CommonModule_0 = new import2.CommonModule();
        this._ErrorHandler_1 = new import3.IonicErrorHandler();
        this._ConfigToken_2 = null;
        this._PlatformConfigToken_3 = import41.providePlatformConfigs();
        this._Platform_4 = import42.setupPlatform(this.parent.get(import9.DOCUMENT), this._PlatformConfigToken_3, this.parent.get(import0.NgZone));
        this._Config_5 = import43.setupConfig(this._ConfigToken_2, this._Platform_4);
        this._DomController_6 = new import4.DomController(this._Platform_4);
        this._MenuController_7 = new import5.MenuController();
        this._App_8 = new import6.App(this._Config_5, this._Platform_4, this._MenuController_7);
        this._GestureController_9 = new import7.GestureController(this._App_8);
        this._DeepLinkConfigToken_10 =
            {
                links: [
                    { loadChildren: '../pages/home/home.module.ngfactory#HomePageModuleNgFactory', name: 'HomePage', segment: 'home', priority: 'low', defaultHistory: [] },
                    { loadChildren: '../pages/page-three/page-three.module.ngfactory#PageThreeModuleNgFactory', name: 'PageThree', segment: 'page-three', priority: 'low', defaultHistory: [] },
                    { loadChildren: '../pages/page-two/page-two.module.ngfactory#PageTwoModuleNgFactory', name: 'PageTwo', segment: 'page-two', priority: 'low', defaultHistory: [] }
                ]
            };
        this._Compiler_11 = new import0.Compiler();
        this._NgModuleLoader_12 = new import8.NgModuleLoader(this._Compiler_11);
        this._ModuleLoader_13 = import44.provideModuleLoader(this._NgModuleLoader_12, this);
        this._APP_INITIALIZER_14 = [
            import0.ɵo,
            import9.ɵc(this.parent.get(import9.NgProbeToken, null), this.parent.get(import0.NgProbeToken, null)),
            import45.registerModeConfigs(this._Config_5),
            import15.setupProvideEvents(this._Platform_4, this._DomController_6),
            import23.setupTapClick(this._Config_5, this._Platform_4, this._DomController_6, this._App_8, this.parent.get(import0.NgZone), this._GestureController_9),
            import44.setupPreloading(this._Config_5, this._DeepLinkConfigToken_10, this._ModuleLoader_13, this.parent.get(import0.NgZone))
        ];
        this._ApplicationInitStatus_15 = new import0.ApplicationInitStatus(this._APP_INITIALIZER_14);
        this._ɵf_16 = new import0.ɵf(this.parent.get(import0.NgZone), this.parent.get(import0.ɵConsole), this, this._ErrorHandler_1, this.componentFactoryResolver, this._ApplicationInitStatus_15);
        this._ApplicationRef_17 = this._ɵf_16;
        this._ApplicationModule_18 = new import0.ApplicationModule(this._ApplicationRef_17);
        this._BrowserModule_19 = new import9.BrowserModule(this.parent.get(import9.BrowserModule, null));
        this._ɵba_20 = new import10.ɵba();
        this._FormsModule_21 = new import10.FormsModule();
        this._ReactiveFormsModule_22 = new import10.ReactiveFormsModule();
        this._IonicModule_23 = new import11.IonicModule();
        this._AppModule_24 = new import1.AppModule();
        this._AppRootToken_44 = import46.MyApp;
        this._APP_BASE_HREF_45 = '/';
        return this._AppModule_24;
    };
    AppModuleInjector.prototype.getInternal = function (token, notFoundResult) {
        if ((token === import2.CommonModule)) {
            return this._CommonModule_0;
        }
        if ((token === import0.ErrorHandler)) {
            return this._ErrorHandler_1;
        }
        if ((token === import43.ConfigToken)) {
            return this._ConfigToken_2;
        }
        if ((token === import41.PlatformConfigToken)) {
            return this._PlatformConfigToken_3;
        }
        if ((token === import42.Platform)) {
            return this._Platform_4;
        }
        if ((token === import43.Config)) {
            return this._Config_5;
        }
        if ((token === import4.DomController)) {
            return this._DomController_6;
        }
        if ((token === import5.MenuController)) {
            return this._MenuController_7;
        }
        if ((token === import6.App)) {
            return this._App_8;
        }
        if ((token === import7.GestureController)) {
            return this._GestureController_9;
        }
        if ((token === import39.DeepLinkConfigToken)) {
            return this._DeepLinkConfigToken_10;
        }
        if ((token === import0.Compiler)) {
            return this._Compiler_11;
        }
        if ((token === import8.NgModuleLoader)) {
            return this._NgModuleLoader_12;
        }
        if ((token === import44.ModuleLoader)) {
            return this._ModuleLoader_13;
        }
        if ((token === import0.APP_INITIALIZER)) {
            return this._APP_INITIALIZER_14;
        }
        if ((token === import0.ApplicationInitStatus)) {
            return this._ApplicationInitStatus_15;
        }
        if ((token === import0.ɵf)) {
            return this._ɵf_16;
        }
        if ((token === import0.ApplicationRef)) {
            return this._ApplicationRef_17;
        }
        if ((token === import0.ApplicationModule)) {
            return this._ApplicationModule_18;
        }
        if ((token === import9.BrowserModule)) {
            return this._BrowserModule_19;
        }
        if ((token === import10.ɵba)) {
            return this._ɵba_20;
        }
        if ((token === import10.FormsModule)) {
            return this._FormsModule_21;
        }
        if ((token === import10.ReactiveFormsModule)) {
            return this._ReactiveFormsModule_22;
        }
        if ((token === import11.IonicModule)) {
            return this._IonicModule_23;
        }
        if ((token === import1.AppModule)) {
            return this._AppModule_24;
        }
        if ((token === import0.LOCALE_ID)) {
            return this._LOCALE_ID_25;
        }
        if ((token === import2.NgLocalization)) {
            return this._NgLocalization_26;
        }
        if ((token === import0.APP_ID)) {
            return this._APP_ID_27;
        }
        if ((token === import0.IterableDiffers)) {
            return this._IterableDiffers_28;
        }
        if ((token === import0.KeyValueDiffers)) {
            return this._KeyValueDiffers_29;
        }
        if ((token === import9.DomSanitizer)) {
            return this._DomSanitizer_30;
        }
        if ((token === import0.Sanitizer)) {
            return this._Sanitizer_31;
        }
        if ((token === import9.HAMMER_GESTURE_CONFIG)) {
            return this._HAMMER_GESTURE_CONFIG_32;
        }
        if ((token === import9.EVENT_MANAGER_PLUGINS)) {
            return this._EVENT_MANAGER_PLUGINS_33;
        }
        if ((token === import9.EventManager)) {
            return this._EventManager_34;
        }
        if ((token === import9.ɵDomSharedStylesHost)) {
            return this._ɵDomSharedStylesHost_35;
        }
        if ((token === import9.ɵDomRendererFactory2)) {
            return this._ɵDomRendererFactory2_36;
        }
        if ((token === import0.RendererFactory2)) {
            return this._RendererFactory2_37;
        }
        if ((token === import9.ɵSharedStylesHost)) {
            return this._ɵSharedStylesHost_38;
        }
        if ((token === import0.Testability)) {
            return this._Testability_39;
        }
        if ((token === import9.Meta)) {
            return this._Meta_40;
        }
        if ((token === import9.Title)) {
            return this._Title_41;
        }
        if ((token === import10.ɵi)) {
            return this._ɵi_42;
        }
        if ((token === import10.FormBuilder)) {
            return this._FormBuilder_43;
        }
        if ((token === import47.AppRootToken)) {
            return this._AppRootToken_44;
        }
        if ((token === import2.APP_BASE_HREF)) {
            return this._APP_BASE_HREF_45;
        }
        ${ifStatementOne}
        ${ifStatementTwo}
        if ((token === import15.Events)) {
            return this._Events_48;
        }
        if ((token === import16.Form)) {
            return this._Form_49;
        }
        if ((token === import17.Haptic)) {
            return this._Haptic_50;
        }
        if ((token === import18.Keyboard)) {
            return this._Keyboard_51;
        }
        if ((token === import19.LoadingController)) {
            return this._LoadingController_52;
        }
        if ((token === import2.LocationStrategy)) {
            return this._LocationStrategy_53;
        }
        if ((token === import2.Location)) {
            return this._Location_54;
        }
        if ((token === import39.UrlSerializer)) {
            return this._UrlSerializer_55;
        }
        if ((token === import40.DeepLinker)) {
            return this._DeepLinker_56;
        }
        if ((token === import20.ModalController)) {
            return this._ModalController_57;
        }
        if ((token === import21.PickerController)) {
            return this._PickerController_58;
        }
        if ((token === import22.PopoverController)) {
            return this._PopoverController_59;
        }
        if ((token === import23.TapClick)) {
            return this._TapClick_60;
        }
        if ((token === import24.ToastController)) {
            return this._ToastController_61;
        }
        if ((token === import25.TransitionController)) {
            return this._TransitionController_62;
        }
        if ((token === import26.StatusBar)) {
            return this._StatusBar_63;
        }
        if ((token === import27.SplashScreen)) {
            return this._SplashScreen_64;
        }
        if ((token === import28.SampleProvider)) {
            return this._SampleProvider_65;
        }
        return notFoundResult;
    };
    AppModuleInjector.prototype.destroyInternal = function () {
        this._ɵf_16.ngOnDestroy();
        (this.__ɵDomSharedStylesHost_35 && this._ɵDomSharedStylesHost_35.ngOnDestroy());
    };
    return AppModuleInjector;
}(import0.ɵNgModuleInjector));
export var AppModuleNgFactory = new import0.NgModuleFactory(AppModuleInjector, import1.AppModule);
//# sourceMappingURL=data:application/json;base64,eyJmaWxlIjoiL1VzZXJzL2Rhbi9EZXNrdG9wL215QXBwL3NyYy9hcHAvYXBwLm1vZHVsZS5uZ2ZhY3RvcnkudHMiLCJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZzovLy9Vc2Vycy9kYW4vRGVza3RvcC9teUFwcC9zcmMvYXBwL2FwcC5tb2R1bGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiICJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsifQ==
//# sourceMappingURL=app.module.ngfactory.js.map
`;

      const appModuleNgFactoryPath = join(srcDir, 'app', 'app.module.ngfactory.js');
      const controllerPath = join(componentDir, 'action-sheet', 'action-sheet-controller.js');
      const controllerPath2 = join(componentDir, 'alert', 'alert-controller.js');

      // act

      let updatedContent = treeshake.purgeProviderControllerImportAndUsage(appModuleNgFactoryPath, knownContent, controllerPath);
      updatedContent = treeshake.purgeProviderControllerImportAndUsage(appModuleNgFactoryPath, updatedContent, controllerPath2);

      // assert
      expect(updatedContent).not.toEqual(knownContent);
      const relativeImportPathOne = helpers.toUnixPath(helpers.changeExtension(relative(nodeModulesDir, controllerPath), ''));
      const relativeImportPathTwo = helpers.toUnixPath(helpers.changeExtension(relative(nodeModulesDir, controllerPath2), ''));

      const importRegexOne = treeshake.generateWildCardImportRegex(relativeImportPathOne);
      const importRegexTwo = treeshake.generateWildCardImportRegex(relativeImportPathTwo);
      const importResultOne = importRegexOne.exec(updatedContent);

      const importResultTwo = importRegexTwo.exec(updatedContent);
      expect(updatedContent.indexOf(`/*${importResultOne[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${importResultTwo[0]}*/`)).toBeGreaterThanOrEqual(0);

      const namedImportOne = importResultOne[1].trim();
      const namedImportTwo = importResultTwo[1].trim();

      const purgeGetterRegExOne = treeshake.generateRemoveGetterFromImportRegex(namedImportOne, '_ActionSheetController_46');
      const purgeGetterResultsOne = purgeGetterRegExOne.exec(updatedContent);
      const purgeIfRegExOne = treeshake.generateRemoveIfStatementRegex(namedImportOne);
      const purgeIfResultsOne = purgeIfRegExOne.exec(updatedContent);

      const purgeGetterRegExTwo = treeshake.generateRemoveGetterFromImportRegex(namedImportTwo, '_AlertController_47');

      const purgeGetterResultsTwo = purgeGetterRegExTwo.exec(updatedContent);
      const purgeIfRegExTwo = treeshake.generateRemoveIfStatementRegex(namedImportTwo);
      const purgeIfResultsTwo = purgeIfRegExTwo.exec(updatedContent);

      expect(updatedContent.indexOf(`/*${purgeGetterResultsOne[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${purgeIfResultsOne[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${purgeGetterResultsTwo[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${purgeIfResultsTwo[0]}*/`)).toBeGreaterThanOrEqual(0);
    });
  });
});
