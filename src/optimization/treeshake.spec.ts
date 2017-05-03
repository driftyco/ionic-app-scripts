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
    env[Constants.ENV_ACTION_SHEET_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet-component.ngfactory.js');
    env[Constants.ENV_ACTION_SHEET_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'action-sheet', 'action-sheet-controller.js');
    env[Constants.ENV_ALERT_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert-component.ngfactory.js');
    env[Constants.ENV_ALERT_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'alert', 'alert-controller.js');
    env[Constants.ENV_LOADING_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading-component.ngfactory.js');
    env[Constants.ENV_LOADING_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'loading', 'loading-controller.js');
    env[Constants.ENV_MODAL_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal-component.ngfactory.js');
    env[Constants.ENV_MODAL_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'modal', 'modal-controller.js');
    env[Constants.ENV_PICKER_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker-component.ngfactory.js');
    env[Constants.ENV_PICKER_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'picker', 'picker-controller.js');
    env[Constants.ENV_POPOVER_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover-component.ngfactory.js');
    env[Constants.ENV_POPOVER_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'popover', 'popover-controller.js');
    env[Constants.ENV_TOAST_COMPONENT_FACTORY_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast-component.ngfactory.js');
    env[Constants.ENV_TOAST_CONTROLLER_PATH] = join(env[Constants.ENV_VAR_IONIC_ANGULAR_DIR], 'components', 'toast', 'toast-controller.js');

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

      const alertComponentNgFactorySet = new Set<string>();
      alertComponentNgFactorySet.add(appModuleNgFactory);

      const actionSheetSet  = new Set<string>();
      actionSheetSet.add(actionSheetController);

      const actionSheetControllerSet = new Set<string>();
      actionSheetControllerSet.add(ionicAngularModuleFile);
      actionSheetControllerSet.add(appModuleNgFactory);
      actionSheetControllerSet.add(homeNgFactory);

      const actionSheetComponentSet = new Set<string>();
      actionSheetComponentSet.add(ionicAngularModuleFile);
      actionSheetComponentSet.add(actionSheetComponentNgFactory);

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
      expect(results.purgedModules.get(alertComponent)).toBeTruthy();
      expect(results.purgedModules.get(alertComponentNgFactory)).toBeTruthy();

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
      const knownImport = `import * as import48 from '../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory';`;
      const knownImport2 = `import * as import49 from '../../node_modules/ionic-angular/components/alert/alert-component.ngfactory';`;
      const knownImportUsage = `import48.ActionSheetCmpNgFactory,`;
      const knownImportUsage2 = `import49.AlertCmpNgFactory,`;
      const knownContent = `
        /**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties}
 */
/* tslint:disable */
import * as import0 from '@angular/core/src/linker/ng_module_factory';
import * as import1 from './app.module';
import * as import2 from '@angular/common/src/common_module';
import * as import3 from '@angular/core/src/application_module';
import * as import4 from '@angular/platform-browser/src/browser';
import * as import5 from '@angular/http/src/http_module';
import * as import6 from '@angular/forms/src/directives';
import * as import7 from '@angular/forms/src/form_providers';
import * as import8 from 'ionic-angular/index';
import * as import9 from '@angular/common/src/localization';
import * as import10 from 'ionic-angular/platform/dom-controller';
import * as import11 from 'ionic-angular/components/menu/menu-controller';
import * as import12 from 'ionic-angular/components/app/app';
import * as import13 from 'ionic-angular/gestures/gesture-controller';
import * as import14 from '@angular/core/src/application_init';
import * as import15 from '@angular/core/src/testability/testability';
import * as import16 from '@angular/core/src/application_ref';
import * as import17 from '@angular/core/src/linker/compiler';
import * as import18 from '@angular/platform-browser/src/dom/events/hammer_gestures';
import * as import19 from '@angular/platform-browser/src/dom/events/event_manager';
import * as import20 from '@angular/platform-browser/src/dom/shared_styles_host';
import * as import21 from '@angular/platform-browser/src/dom/dom_renderer';
import * as import22 from '@angular/platform-browser/src/security/dom_sanitization_service';
import * as import23 from '@angular/core/src/animation/animation_queue';
import * as import24 from '@angular/core/src/linker/view_utils';
import * as import25 from '@angular/platform-browser/src/browser/title';
import * as import26 from '@angular/http/src/backends/browser_xhr';
import * as import27 from '@angular/http/src/base_response_options';
import * as import28 from '@angular/http/src/backends/xhr_backend';
import * as import29 from '@angular/http/src/base_request_options';
import * as import30 from '@angular/forms/src/directives/radio_control_value_accessor';
import * as import31 from '@angular/forms/src/form_builder';
import * as import32 from 'ionic-angular/components/action-sheet/action-sheet-controller';
import * as import33 from 'ionic-angular/components/alert/alert-controller';
import * as import34 from 'ionic-angular/util/events';
import * as import35 from 'ionic-angular/util/form';
import * as import36 from 'ionic-angular/tap-click/haptic';
import * as import37 from 'ionic-angular/platform/keyboard';
import * as import38 from 'ionic-angular/components/loading/loading-controller';
import * as import39 from '@angular/common/src/location/location';
import * as import40 from 'ionic-angular/components/modal/modal-controller';
import * as import41 from 'ionic-angular/components/picker/picker-controller';
import * as import42 from 'ionic-angular/components/popover/popover-controller';
import * as import43 from 'ionic-angular/util/system-js-ng-module-loader';
import * as import44 from 'ionic-angular/tap-click/tap-click';
import * as import45 from 'ionic-angular/components/toast/toast-controller';
import * as import46 from 'ionic-angular/transitions/transition-controller';
${knownImport}
${knownImport2}
import * as import50 from '../../node_modules/ionic-angular/components/app/app-root.ngfactory';
import * as import51 from '../../node_modules/ionic-angular/components/loading/loading-component.ngfactory';
import * as import52 from '../../node_modules/ionic-angular/components/modal/modal-component.ngfactory';
import * as import53 from '../../node_modules/ionic-angular/components/picker/picker-component.ngfactory';
import * as import54 from '../../node_modules/ionic-angular/components/popover/popover-component.ngfactory';
import * as import55 from '../../node_modules/ionic-angular/components/toast/toast-component.ngfactory';
import * as import56 from './app.component.ngfactory';
import * as import57 from '../pages/home/home.ngfactory';
import * as import58 from '@angular/core/src/i18n/tokens';
import * as import59 from '@angular/core/src/application_tokens';
import * as import60 from '@angular/platform-browser/src/dom/events/dom_events';
import * as import61 from '@angular/platform-browser/src/dom/events/key_events';
import * as import62 from '@angular/core/src/zone/ng_zone';
import * as import63 from '@angular/platform-browser/src/dom/debug/ng_probe';
import * as import64 from './app.component';
import * as import65 from '@angular/common/src/location/platform_location';
import * as import66 from '@angular/common/src/location/location_strategy';
import * as import67 from 'ionic-angular/navigation/url-serializer';
import * as import68 from 'ionic-angular/navigation/deep-linker';
import * as import69 from 'ionic-angular/platform/platform-registry';
import * as import70 from 'ionic-angular/platform/platform';
import * as import71 from 'ionic-angular/config/config';
import * as import72 from 'ionic-angular/config/mode-registry';
import * as import73 from '@angular/core/src/console';
import * as import74 from '@angular/core/src/error_handler';
import * as import75 from '@angular/platform-browser/src/dom/dom_tokens';
import * as import76 from '@angular/platform-browser/src/dom/animation_driver';
import * as import77 from '@angular/core/src/render/api';
import * as import78 from '@angular/core/src/security';
import * as import79 from '@angular/core/src/change_detection/differs/iterable_differs';
import * as import80 from '@angular/core/src/change_detection/differs/keyvalue_differs';
import * as import81 from '@angular/platform-browser/src/browser/meta';
import * as import82 from '@angular/http/src/interfaces';
import * as import83 from '@angular/http/src/http';
import * as import84 from 'ionic-angular/components/app/app-root';
import * as import85 from 'ionic-angular/util/module-loader';
class AppModuleInjector extends import0.NgModuleInjector {
    constructor(parent) {
        super(parent, [
            ${knownImportUsage}
            ${knownImportUsage2}
            import50.IonicAppNgFactory,
            import51.LoadingCmpNgFactory,
            import52.ModalCmpNgFactory,
            import53.PickerCmpNgFactory,
            import54.PopoverCmpNgFactory,
            import55.ToastCmpNgFactory,
            import56.MyAppNgFactory,
            import57.HomePageNgFactory
        ], [import50.IonicAppNgFactory]);
    }
    get _LOCALE_ID_9() {
        if ((this.__LOCALE_ID_9 == null)) {
            (this.__LOCALE_ID_9 = import3._localeFactory(this.parent.get(import58.LOCALE_ID, null)));
        }
        return this.__LOCALE_ID_9;
    }
    get _NgLocalization_10() {
        if ((this.__NgLocalization_10 == null)) {
            (this.__NgLocalization_10 = new import9.NgLocaleLocalization(this._LOCALE_ID_9));
        }
        return this.__NgLocalization_10;
    }
    get _ApplicationRef_25() {
        if ((this.__ApplicationRef_25 == null)) {
            (this.__ApplicationRef_25 = this._ApplicationRef__24);
        }
        return this.__ApplicationRef_25;
    }
    get _Compiler_26() {
        if ((this.__Compiler_26 == null)) {
            (this.__Compiler_26 = new import17.Compiler());
        }
        return this.__Compiler_26;
    }
    get _APP_ID_27() {
        if ((this.__APP_ID_27 == null)) {
            (this.__APP_ID_27 = import59._appIdRandomProviderFactory());
        }
        return this.__APP_ID_27;
    }
    get _HAMMER_GESTURE_CONFIG_28() {
        if ((this.__HAMMER_GESTURE_CONFIG_28 == null)) {
            (this.__HAMMER_GESTURE_CONFIG_28 = new import18.HammerGestureConfig());
        }
        return this.__HAMMER_GESTURE_CONFIG_28;
    }
    get _EVENT_MANAGER_PLUGINS_29() {
        if ((this.__EVENT_MANAGER_PLUGINS_29 == null)) {
            (this.__EVENT_MANAGER_PLUGINS_29 = [
                new import60.DomEventsPlugin(),
                new import61.KeyEventsPlugin(),
                new import18.HammerGesturesPlugin(this._HAMMER_GESTURE_CONFIG_28)
            ]);
        }
        return this.__EVENT_MANAGER_PLUGINS_29;
    }
    get _EventManager_30() {
        if ((this.__EventManager_30 == null)) {
            (this.__EventManager_30 = new import19.EventManager(this._EVENT_MANAGER_PLUGINS_29, this.parent.get(import62.NgZone)));
        }
        return this.__EventManager_30;
    }
    get _AnimationDriver_32() {
        if ((this.__AnimationDriver_32 == null)) {
            (this.__AnimationDriver_32 = import4._resolveDefaultAnimationDriver());
        }
        return this.__AnimationDriver_32;
    }
    get _DomRootRenderer_33() {
        if ((this.__DomRootRenderer_33 == null)) {
            (this.__DomRootRenderer_33 = new import21.DomRootRenderer_(this._DOCUMENT_13, this._EventManager_30, this._DomSharedStylesHost_31, this._AnimationDriver_32, this._APP_ID_27));
        }
        return this.__DomRootRenderer_33;
    }
    get _RootRenderer_34() {
        if ((this.__RootRenderer_34 == null)) {
            (this.__RootRenderer_34 = import63._createConditionalRootRenderer(this._DomRootRenderer_33, this.parent.get(import63.NgProbeToken, null), this.parent.get(import16.NgProbeToken, null)));
        }
        return this.__RootRenderer_34;
    }
    get _DomSanitizer_35() {
        if ((this.__DomSanitizer_35 == null)) {
            (this.__DomSanitizer_35 = new import22.DomSanitizerImpl());
        }
        return this.__DomSanitizer_35;
    }
    get _Sanitizer_36() {
        if ((this.__Sanitizer_36 == null)) {
            (this.__Sanitizer_36 = this._DomSanitizer_35);
        }
        return this.__Sanitizer_36;
    }
    get _AnimationQueue_37() {
        if ((this.__AnimationQueue_37 == null)) {
            (this.__AnimationQueue_37 = new import23.AnimationQueue(this.parent.get(import62.NgZone)));
        }
        return this.__AnimationQueue_37;
    }
    get _ViewUtils_38() {
        if ((this.__ViewUtils_38 == null)) {
            (this.__ViewUtils_38 = new import24.ViewUtils(this._RootRenderer_34, this._Sanitizer_36, this._AnimationQueue_37));
        }
        return this.__ViewUtils_38;
    }
    get _IterableDiffers_39() {
        if ((this.__IterableDiffers_39 == null)) {
            (this.__IterableDiffers_39 = import3._iterableDiffersFactory());
        }
        return this.__IterableDiffers_39;
    }
    get _KeyValueDiffers_40() {
        if ((this.__KeyValueDiffers_40 == null)) {
            (this.__KeyValueDiffers_40 = import3._keyValueDiffersFactory());
        }
        return this.__KeyValueDiffers_40;
    }
    get _SharedStylesHost_41() {
        if ((this.__SharedStylesHost_41 == null)) {
            (this.__SharedStylesHost_41 = this._DomSharedStylesHost_31);
        }
        return this.__SharedStylesHost_41;
    }
    get _Meta_42() {
        if ((this.__Meta_42 == null)) {
            (this.__Meta_42 = import4.meta());
        }
        return this.__Meta_42;
    }
    get _Title_43() {
        if ((this.__Title_43 == null)) {
            (this.__Title_43 = new import25.Title());
        }
        return this.__Title_43;
    }
    get _BrowserXhr_44() {
        if ((this.__BrowserXhr_44 == null)) {
            (this.__BrowserXhr_44 = new import26.BrowserXhr());
        }
        return this.__BrowserXhr_44;
    }
    get _ResponseOptions_45() {
        if ((this.__ResponseOptions_45 == null)) {
            (this.__ResponseOptions_45 = new import27.BaseResponseOptions());
        }
        return this.__ResponseOptions_45;
    }
    get _XSRFStrategy_46() {
        if ((this.__XSRFStrategy_46 == null)) {
            (this.__XSRFStrategy_46 = import5._createDefaultCookieXSRFStrategy());
        }
        return this.__XSRFStrategy_46;
    }
    get _XHRBackend_47() {
        if ((this.__XHRBackend_47 == null)) {
            (this.__XHRBackend_47 = new import28.XHRBackend(this._BrowserXhr_44, this._ResponseOptions_45, this._XSRFStrategy_46));
        }
        return this.__XHRBackend_47;
    }
    get _RequestOptions_48() {
        if ((this.__RequestOptions_48 == null)) {
            (this.__RequestOptions_48 = new import29.BaseRequestOptions());
        }
        return this.__RequestOptions_48;
    }
    get _Http_49() {
        if ((this.__Http_49 == null)) {
            (this.__Http_49 = import5.httpFactory(this._XHRBackend_47, this._RequestOptions_48));
        }
        return this.__Http_49;
    }
    get _RadioControlRegistry_50() {
        if ((this.__RadioControlRegistry_50 == null)) {
            (this.__RadioControlRegistry_50 = new import30.RadioControlRegistry());
        }
        return this.__RadioControlRegistry_50;
    }
    get _FormBuilder_51() {
        if ((this.__FormBuilder_51 == null)) {
            (this.__FormBuilder_51 = new import31.FormBuilder());
        }
        return this.__FormBuilder_51;
    }
    get _AppRootToken_52() {
        if ((this.__AppRootToken_52 == null)) {
            (this.__AppRootToken_52 = import64.MyApp);
        }
        return this.__AppRootToken_52;
    }
    get _DeepLinkConfigToken_53() {
        if ((this.__DeepLinkConfigToken_53 == null)) {
            (this.__DeepLinkConfigToken_53 = null);
        }
        return this.__DeepLinkConfigToken_53;
    }
    get _ActionSheetController_54() {
        if ((this.__ActionSheetController_54 == null)) {
            (this.__ActionSheetController_54 = new import32.ActionSheetController(this._App_19, this._Config_16));
        }
        return this.__ActionSheetController_54;
    }
    get _AlertController_55() {
        if ((this.__AlertController_55 == null)) {
            (this.__AlertController_55 = new import33.AlertController(this._App_19, this._Config_16));
        }
        return this.__AlertController_55;
    }
    get _Events_56() {
        if ((this.__Events_56 == null)) {
            (this.__Events_56 = new import34.Events());
        }
        return this.__Events_56;
    }
    get _Form_57() {
        if ((this.__Form_57 == null)) {
            (this.__Form_57 = new import35.Form());
        }
        return this.__Form_57;
    }
    get _Haptic_58() {
        if ((this.__Haptic_58 == null)) {
            (this.__Haptic_58 = new import36.Haptic(this._Platform_15));
        }
        return this.__Haptic_58;
    }
    get _Keyboard_59() {
        if ((this.__Keyboard_59 == null)) {
            (this.__Keyboard_59 = new import37.Keyboard(this._Config_16, this._Platform_15, this.parent.get(import62.NgZone), this._DomController_17));
        }
        return this.__Keyboard_59;
    }
    get _LoadingController_60() {
        if ((this.__LoadingController_60 == null)) {
            (this.__LoadingController_60 = new import38.LoadingController(this._App_19, this._Config_16));
        }
        return this.__LoadingController_60;
    }
    get _LocationStrategy_61() {
        if ((this.__LocationStrategy_61 == null)) {
            (this.__LocationStrategy_61 = import8.provideLocationStrategy(this.parent.get(import65.PlatformLocation), this.parent.get(import66.APP_BASE_HREF, null), this._Config_16));
        }
        return this.__LocationStrategy_61;
    }
    get _Location_62() {
        if ((this.__Location_62 == null)) {
            (this.__Location_62 = new import39.Location(this._LocationStrategy_61));
        }
        return this.__Location_62;
    }
    get _ModalController_63() {
        if ((this.__ModalController_63 == null)) {
            (this.__ModalController_63 = new import40.ModalController(this._App_19, this._Config_16));
        }
        return this.__ModalController_63;
    }
    get _PickerController_64() {
        if ((this.__PickerController_64 == null)) {
            (this.__PickerController_64 = new import41.PickerController(this._App_19, this._Config_16));
        }
        return this.__PickerController_64;
    }
    get _PopoverController_65() {
        if ((this.__PopoverController_65 == null)) {
            (this.__PopoverController_65 = new import42.PopoverController(this._App_19, this._Config_16));
        }
        return this.__PopoverController_65;
    }
    get _SystemJsNgModuleLoader_66() {
        if ((this.__SystemJsNgModuleLoader_66 == null)) {
            (this.__SystemJsNgModuleLoader_66 = new import43.SystemJsNgModuleLoader(this._Compiler_26, this.parent.get(import43.SystemJsNgModuleLoaderConfig, null)));
        }
        return this.__SystemJsNgModuleLoader_66;
    }
    get _TapClick_67() {
        if ((this.__TapClick_67 == null)) {
            (this.__TapClick_67 = new import44.TapClick(this._Config_16, this._Platform_15, this._DomController_17, this._App_19, this.parent.get(import62.NgZone), this._GestureController_20));
        }
        return this.__TapClick_67;
    }
    get _ToastController_68() {
        if ((this.__ToastController_68 == null)) {
            (this.__ToastController_68 = new import45.ToastController(this._App_19, this._Config_16));
        }
        return this.__ToastController_68;
    }
    get _TransitionController_69() {
        if ((this.__TransitionController_69 == null)) {
            (this.__TransitionController_69 = new import46.TransitionController(this._Platform_15, this._Config_16));
        }
        return this.__TransitionController_69;
    }
    get _ModuleLoader_70() {
        if ((this.__ModuleLoader_70 == null)) {
            (this.__ModuleLoader_70 = import8.provideModuleLoader(this._DeepLinkConfigToken_53, this._SystemJsNgModuleLoader_66, this));
        }
        return this.__ModuleLoader_70;
    }
    get _UrlSerializer_71() {
        if ((this.__UrlSerializer_71 == null)) {
            (this.__UrlSerializer_71 = import67.setupUrlSerializer(this._DeepLinkConfigToken_53));
        }
        return this.__UrlSerializer_71;
    }
    get _DeepLinker_72() {
        if ((this.__DeepLinker_72 == null)) {
            (this.__DeepLinker_72 = import68.setupDeepLinker(this._App_19, this._UrlSerializer_71, this._Location_62, this._DeepLinkConfigToken_53, this._ModuleLoader_70, this));
        }
        return this.__DeepLinker_72;
    }
    createInternal() {
        this._CommonModule_0 = new import2.CommonModule();
        this._ApplicationModule_1 = new import3.ApplicationModule();
        this._BrowserModule_2 = new import4.BrowserModule(this.parent.get(import4.BrowserModule, null));
        this._HttpModule_3 = new import5.HttpModule();
        this._InternalFormsSharedModule_4 = new import6.InternalFormsSharedModule();
        this._FormsModule_5 = new import7.FormsModule();
        this._ReactiveFormsModule_6 = new import7.ReactiveFormsModule();
        this._IonicModule_7 = new import8.IonicModule();
        this._AppModule_8 = new import1.AppModule();
        this._ErrorHandler_11 = import4.errorHandler();
        this._ConfigToken_12 = null;
        this._DOCUMENT_13 = import4._document();
        this._PlatformConfigToken_14 = import69.providePlatformConfigs();
        this._Platform_15 = import70.setupPlatform(this._DOCUMENT_13, this._PlatformConfigToken_14, this.parent.get(import62.NgZone));
        this._Config_16 = import71.setupConfig(this._ConfigToken_12, this._Platform_15);
        this._DomController_17 = new import10.DomController(this._Platform_15);
        this._MenuController_18 = new import11.MenuController();
        this._App_19 = new import12.App(this._Config_16, this._Platform_15, this._MenuController_18);
        this._GestureController_20 = new import13.GestureController(this._App_19);
        this._APP_INITIALIZER_21 = [
            import72.registerModeConfigs(this._Config_16),
            import34.setupProvideEvents(this._Platform_15, this._DomController_17),
            import44.setupTapClick(this._Config_16, this._Platform_15, this._DomController_17, this._App_19, this.parent.get(import62.NgZone), this._GestureController_20)
        ];
        this._ApplicationInitStatus_22 = new import14.ApplicationInitStatus(this._APP_INITIALIZER_21);
        this._Testability_23 = new import15.Testability(this.parent.get(import62.NgZone));
        this._ApplicationRef__24 = new import16.ApplicationRef_(this.parent.get(import62.NgZone), this.parent.get(import73.Console), this, this._ErrorHandler_11, this, this._ApplicationInitStatus_22, this.parent.get(import15.TestabilityRegistry, null), this._Testability_23);
        this._DomSharedStylesHost_31 = new import20.DomSharedStylesHost(this._DOCUMENT_13);
        return this._AppModule_8;
    }
    getInternal(token, notFoundResult) {
        if ((token === import2.CommonModule)) {
            return this._CommonModule_0;
        }
        if ((token === import3.ApplicationModule)) {
            return this._ApplicationModule_1;
        }
        if ((token === import4.BrowserModule)) {
            return this._BrowserModule_2;
        }
        if ((token === import5.HttpModule)) {
            return this._HttpModule_3;
        }
        if ((token === import6.InternalFormsSharedModule)) {
            return this._InternalFormsSharedModule_4;
        }
        if ((token === import7.FormsModule)) {
            return this._FormsModule_5;
        }
        if ((token === import7.ReactiveFormsModule)) {
            return this._ReactiveFormsModule_6;
        }
        if ((token === import8.IonicModule)) {
            return this._IonicModule_7;
        }
        if ((token === import1.AppModule)) {
            return this._AppModule_8;
        }
        if ((token === import58.LOCALE_ID)) {
            return this._LOCALE_ID_9;
        }
        if ((token === import9.NgLocalization)) {
            return this._NgLocalization_10;
        }
        if ((token === import74.ErrorHandler)) {
            return this._ErrorHandler_11;
        }
        if ((token === import71.ConfigToken)) {
            return this._ConfigToken_12;
        }
        if ((token === import75.DOCUMENT)) {
            return this._DOCUMENT_13;
        }
        if ((token === import69.PlatformConfigToken)) {
            return this._PlatformConfigToken_14;
        }
        if ((token === import70.Platform)) {
            return this._Platform_15;
        }
        if ((token === import71.Config)) {
            return this._Config_16;
        }
        if ((token === import10.DomController)) {
            return this._DomController_17;
        }
        if ((token === import11.MenuController)) {
            return this._MenuController_18;
        }
        if ((token === import12.App)) {
            return this._App_19;
        }
        if ((token === import13.GestureController)) {
            return this._GestureController_20;
        }
        if ((token === import14.APP_INITIALIZER)) {
            return this._APP_INITIALIZER_21;
        }
        if ((token === import14.ApplicationInitStatus)) {
            return this._ApplicationInitStatus_22;
        }
        if ((token === import15.Testability)) {
            return this._Testability_23;
        }
        if ((token === import16.ApplicationRef_)) {
            return this._ApplicationRef__24;
        }
        if ((token === import16.ApplicationRef)) {
            return this._ApplicationRef_25;
        }
        if ((token === import17.Compiler)) {
            return this._Compiler_26;
        }
        if ((token === import59.APP_ID)) {
            return this._APP_ID_27;
        }
        if ((token === import18.HAMMER_GESTURE_CONFIG)) {
            return this._HAMMER_GESTURE_CONFIG_28;
        }
        if ((token === import19.EVENT_MANAGER_PLUGINS)) {
            return this._EVENT_MANAGER_PLUGINS_29;
        }
        if ((token === import19.EventManager)) {
            return this._EventManager_30;
        }
        if ((token === import20.DomSharedStylesHost)) {
            return this._DomSharedStylesHost_31;
        }
        if ((token === import76.AnimationDriver)) {
            return this._AnimationDriver_32;
        }
        if ((token === import21.DomRootRenderer)) {
            return this._DomRootRenderer_33;
        }
        if ((token === import77.RootRenderer)) {
            return this._RootRenderer_34;
        }
        if ((token === import22.DomSanitizer)) {
            return this._DomSanitizer_35;
        }
        if ((token === import78.Sanitizer)) {
            return this._Sanitizer_36;
        }
        if ((token === import23.AnimationQueue)) {
            return this._AnimationQueue_37;
        }
        if ((token === import24.ViewUtils)) {
            return this._ViewUtils_38;
        }
        if ((token === import79.IterableDiffers)) {
            return this._IterableDiffers_39;
        }
        if ((token === import80.KeyValueDiffers)) {
            return this._KeyValueDiffers_40;
        }
        if ((token === import20.SharedStylesHost)) {
            return this._SharedStylesHost_41;
        }
        if ((token === import81.Meta)) {
            return this._Meta_42;
        }
        if ((token === import25.Title)) {
            return this._Title_43;
        }
        if ((token === import26.BrowserXhr)) {
            return this._BrowserXhr_44;
        }
        if ((token === import27.ResponseOptions)) {
            return this._ResponseOptions_45;
        }
        if ((token === import82.XSRFStrategy)) {
            return this._XSRFStrategy_46;
        }
        if ((token === import28.XHRBackend)) {
            return this._XHRBackend_47;
        }
        if ((token === import29.RequestOptions)) {
            return this._RequestOptions_48;
        }
        if ((token === import83.Http)) {
            return this._Http_49;
        }
        if ((token === import30.RadioControlRegistry)) {
            return this._RadioControlRegistry_50;
        }
        if ((token === import31.FormBuilder)) {
            return this._FormBuilder_51;
        }
        if ((token === import84.AppRootToken)) {
            return this._AppRootToken_52;
        }
        if ((token === import67.DeepLinkConfigToken)) {
            return this._DeepLinkConfigToken_53;
        }
        if ((token === import32.ActionSheetController)) {
            return this._ActionSheetController_54;
        }
        if ((token === import33.AlertController)) {
            return this._AlertController_55;
        }
        if ((token === import34.Events)) {
            return this._Events_56;
        }
        if ((token === import35.Form)) {
            return this._Form_57;
        }
        if ((token === import36.Haptic)) {
            return this._Haptic_58;
        }
        if ((token === import37.Keyboard)) {
            return this._Keyboard_59;
        }
        if ((token === import38.LoadingController)) {
            return this._LoadingController_60;
        }
        if ((token === import66.LocationStrategy)) {
            return this._LocationStrategy_61;
        }
        if ((token === import39.Location)) {
            return this._Location_62;
        }
        if ((token === import40.ModalController)) {
            return this._ModalController_63;
        }
        if ((token === import41.PickerController)) {
            return this._PickerController_64;
        }
        if ((token === import42.PopoverController)) {
            return this._PopoverController_65;
        }
        if ((token === import43.SystemJsNgModuleLoader)) {
            return this._SystemJsNgModuleLoader_66;
        }
        if ((token === import44.TapClick)) {
            return this._TapClick_67;
        }
        if ((token === import45.ToastController)) {
            return this._ToastController_68;
        }
        if ((token === import46.TransitionController)) {
            return this._TransitionController_69;
        }
        if ((token === import85.ModuleLoader)) {
            return this._ModuleLoader_70;
        }
        if ((token === import67.UrlSerializer)) {
            return this._UrlSerializer_71;
        }
        if ((token === import68.DeepLinker)) {
            return this._DeepLinker_72;
        }
        return notFoundResult;
    }
    destroyInternal() {
        this._ApplicationRef__24.ngOnDestroy();
        this._DomSharedStylesHost_31.ngOnDestroy();
    }
}
export const AppModuleNgFactory = new import0.NgModuleFactory(AppModuleInjector, import1.AppModule);
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

  describe('purgeProviderControllerImportAndUsage', () => {

    it('should purge the controller provider content', () => {
      // arrange

      const ifStatementOne = `
if ((token === import32.ActionSheetController)) {
    return this._ActionSheetController_54;
}
      `;
      const ifStatementTwo = `
if ((token === import33.AlertController)) {
    return this._AlertController_55;
}
      `;

      const getterOne = `
get _ActionSheetController_54() {
    if ((this.__ActionSheetController_54 == null)) {
        (this.__ActionSheetController_54 = new import32.ActionSheetController(this._App_19, this._Config_16));
    }
    return this.__ActionSheetController_54;
}
      `;

      const getterTwo = `
get _AlertController_55() {
    if ((this.__AlertController_55 == null)) {
        (this.__AlertController_55 = new import33.AlertController(this._App_19, this._Config_16));
    }
    return this.__AlertController_55;
}
      `;

      const knownContent = `
        /**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties}
 */
/* tslint:disable */
import * as import0 from '@angular/core/src/linker/ng_module_factory';
import * as import1 from './app.module';
import * as import2 from '@angular/common/src/common_module';
import * as import3 from '@angular/core/src/application_module';
import * as import4 from '@angular/platform-browser/src/browser';
import * as import5 from '@angular/http/src/http_module';
import * as import6 from '@angular/forms/src/directives';
import * as import7 from '@angular/forms/src/form_providers';
import * as import8 from 'ionic-angular/index';
import * as import9 from '@angular/common/src/localization';
import * as import10 from 'ionic-angular/platform/dom-controller';
import * as import11 from 'ionic-angular/components/menu/menu-controller';
import * as import12 from 'ionic-angular/components/app/app';
import * as import13 from 'ionic-angular/gestures/gesture-controller';
import * as import14 from '@angular/core/src/application_init';
import * as import15 from '@angular/core/src/testability/testability';
import * as import16 from '@angular/core/src/application_ref';
import * as import17 from '@angular/core/src/linker/compiler';
import * as import18 from '@angular/platform-browser/src/dom/events/hammer_gestures';
import * as import19 from '@angular/platform-browser/src/dom/events/event_manager';
import * as import20 from '@angular/platform-browser/src/dom/shared_styles_host';
import * as import21 from '@angular/platform-browser/src/dom/dom_renderer';
import * as import22 from '@angular/platform-browser/src/security/dom_sanitization_service';
import * as import23 from '@angular/core/src/animation/animation_queue';
import * as import24 from '@angular/core/src/linker/view_utils';
import * as import25 from '@angular/platform-browser/src/browser/title';
import * as import26 from '@angular/http/src/backends/browser_xhr';
import * as import27 from '@angular/http/src/base_response_options';
import * as import28 from '@angular/http/src/backends/xhr_backend';
import * as import29 from '@angular/http/src/base_request_options';
import * as import30 from '@angular/forms/src/directives/radio_control_value_accessor';
import * as import31 from '@angular/forms/src/form_builder';
import * as import32 from 'ionic-angular/components/action-sheet/action-sheet-controller';
import * as import33 from 'ionic-angular/components/alert/alert-controller';
import * as import34 from 'ionic-angular/util/events';
import * as import35 from 'ionic-angular/util/form';
import * as import36 from 'ionic-angular/tap-click/haptic';
import * as import37 from 'ionic-angular/platform/keyboard';
import * as import38 from 'ionic-angular/components/loading/loading-controller';
import * as import39 from '@angular/common/src/location/location';
import * as import40 from 'ionic-angular/components/modal/modal-controller';
import * as import41 from 'ionic-angular/components/picker/picker-controller';
import * as import42 from 'ionic-angular/components/popover/popover-controller';
import * as import43 from 'ionic-angular/util/system-js-ng-module-loader';
import * as import44 from 'ionic-angular/tap-click/tap-click';
import * as import45 from 'ionic-angular/components/toast/toast-controller';
import * as import46 from 'ionic-angular/transitions/transition-controller';
import * as import48 from '../../node_modules/ionic-angular/components/action-sheet/action-sheet-component.ngfactory';
import * as import49 from '../../node_modules/ionic-angular/components/alert/alert-component.ngfactory';
import * as import50 from '../../node_modules/ionic-angular/components/app/app-root.ngfactory';
import * as import51 from '../../node_modules/ionic-angular/components/loading/loading-component.ngfactory';
import * as import52 from '../../node_modules/ionic-angular/components/modal/modal-component.ngfactory';
import * as import53 from '../../node_modules/ionic-angular/components/picker/picker-component.ngfactory';
import * as import54 from '../../node_modules/ionic-angular/components/popover/popover-component.ngfactory';
import * as import55 from '../../node_modules/ionic-angular/components/toast/toast-component.ngfactory';
import * as import56 from './app.component.ngfactory';
import * as import57 from '../pages/home/home.ngfactory';
import * as import58 from '@angular/core/src/i18n/tokens';
import * as import59 from '@angular/core/src/application_tokens';
import * as import60 from '@angular/platform-browser/src/dom/events/dom_events';
import * as import61 from '@angular/platform-browser/src/dom/events/key_events';
import * as import62 from '@angular/core/src/zone/ng_zone';
import * as import63 from '@angular/platform-browser/src/dom/debug/ng_probe';
import * as import64 from './app.component';
import * as import65 from '@angular/common/src/location/platform_location';
import * as import66 from '@angular/common/src/location/location_strategy';
import * as import67 from 'ionic-angular/navigation/url-serializer';
import * as import68 from 'ionic-angular/navigation/deep-linker';
import * as import69 from 'ionic-angular/platform/platform-registry';
import * as import70 from 'ionic-angular/platform/platform';
import * as import71 from 'ionic-angular/config/config';
import * as import72 from 'ionic-angular/config/mode-registry';
import * as import73 from '@angular/core/src/console';
import * as import74 from '@angular/core/src/error_handler';
import * as import75 from '@angular/platform-browser/src/dom/dom_tokens';
import * as import76 from '@angular/platform-browser/src/dom/animation_driver';
import * as import77 from '@angular/core/src/render/api';
import * as import78 from '@angular/core/src/security';
import * as import79 from '@angular/core/src/change_detection/differs/iterable_differs';
import * as import80 from '@angular/core/src/change_detection/differs/keyvalue_differs';
import * as import81 from '@angular/platform-browser/src/browser/meta';
import * as import82 from '@angular/http/src/interfaces';
import * as import83 from '@angular/http/src/http';
import * as import84 from 'ionic-angular/components/app/app-root';
import * as import85 from 'ionic-angular/util/module-loader';
class AppModuleInjector extends import0.NgModuleInjector {
    constructor(parent) {
        super(parent, [
            import48.ActionSheetCmpNgFactory,
            import49.AlertCmpNgFactory,
            import50.IonicAppNgFactory,
            import51.LoadingCmpNgFactory,
            import52.ModalCmpNgFactory,
            import53.PickerCmpNgFactory,
            import54.PopoverCmpNgFactory,
            import55.ToastCmpNgFactory,
            import56.MyAppNgFactory,
            import57.HomePageNgFactory
        ], [import50.IonicAppNgFactory]);
    }
    get _LOCALE_ID_9() {
        if ((this.__LOCALE_ID_9 == null)) {
            (this.__LOCALE_ID_9 = import3._localeFactory(this.parent.get(import58.LOCALE_ID, null)));
        }
        return this.__LOCALE_ID_9;
    }
    get _NgLocalization_10() {
        if ((this.__NgLocalization_10 == null)) {
            (this.__NgLocalization_10 = new import9.NgLocaleLocalization(this._LOCALE_ID_9));
        }
        return this.__NgLocalization_10;
    }
    get _ApplicationRef_25() {
        if ((this.__ApplicationRef_25 == null)) {
            (this.__ApplicationRef_25 = this._ApplicationRef__24);
        }
        return this.__ApplicationRef_25;
    }
    get _Compiler_26() {
        if ((this.__Compiler_26 == null)) {
            (this.__Compiler_26 = new import17.Compiler());
        }
        return this.__Compiler_26;
    }
    get _APP_ID_27() {
        if ((this.__APP_ID_27 == null)) {
            (this.__APP_ID_27 = import59._appIdRandomProviderFactory());
        }
        return this.__APP_ID_27;
    }
    get _HAMMER_GESTURE_CONFIG_28() {
        if ((this.__HAMMER_GESTURE_CONFIG_28 == null)) {
            (this.__HAMMER_GESTURE_CONFIG_28 = new import18.HammerGestureConfig());
        }
        return this.__HAMMER_GESTURE_CONFIG_28;
    }
    get _EVENT_MANAGER_PLUGINS_29() {
        if ((this.__EVENT_MANAGER_PLUGINS_29 == null)) {
            (this.__EVENT_MANAGER_PLUGINS_29 = [
                new import60.DomEventsPlugin(),
                new import61.KeyEventsPlugin(),
                new import18.HammerGesturesPlugin(this._HAMMER_GESTURE_CONFIG_28)
            ]);
        }
        return this.__EVENT_MANAGER_PLUGINS_29;
    }
    get _EventManager_30() {
        if ((this.__EventManager_30 == null)) {
            (this.__EventManager_30 = new import19.EventManager(this._EVENT_MANAGER_PLUGINS_29, this.parent.get(import62.NgZone)));
        }
        return this.__EventManager_30;
    }
    get _AnimationDriver_32() {
        if ((this.__AnimationDriver_32 == null)) {
            (this.__AnimationDriver_32 = import4._resolveDefaultAnimationDriver());
        }
        return this.__AnimationDriver_32;
    }
    get _DomRootRenderer_33() {
        if ((this.__DomRootRenderer_33 == null)) {
            (this.__DomRootRenderer_33 = new import21.DomRootRenderer_(this._DOCUMENT_13, this._EventManager_30, this._DomSharedStylesHost_31, this._AnimationDriver_32, this._APP_ID_27));
        }
        return this.__DomRootRenderer_33;
    }
    get _RootRenderer_34() {
        if ((this.__RootRenderer_34 == null)) {
            (this.__RootRenderer_34 = import63._createConditionalRootRenderer(this._DomRootRenderer_33, this.parent.get(import63.NgProbeToken, null), this.parent.get(import16.NgProbeToken, null)));
        }
        return this.__RootRenderer_34;
    }
    get _DomSanitizer_35() {
        if ((this.__DomSanitizer_35 == null)) {
            (this.__DomSanitizer_35 = new import22.DomSanitizerImpl());
        }
        return this.__DomSanitizer_35;
    }
    get _Sanitizer_36() {
        if ((this.__Sanitizer_36 == null)) {
            (this.__Sanitizer_36 = this._DomSanitizer_35);
        }
        return this.__Sanitizer_36;
    }
    get _AnimationQueue_37() {
        if ((this.__AnimationQueue_37 == null)) {
            (this.__AnimationQueue_37 = new import23.AnimationQueue(this.parent.get(import62.NgZone)));
        }
        return this.__AnimationQueue_37;
    }
    get _ViewUtils_38() {
        if ((this.__ViewUtils_38 == null)) {
            (this.__ViewUtils_38 = new import24.ViewUtils(this._RootRenderer_34, this._Sanitizer_36, this._AnimationQueue_37));
        }
        return this.__ViewUtils_38;
    }
    get _IterableDiffers_39() {
        if ((this.__IterableDiffers_39 == null)) {
            (this.__IterableDiffers_39 = import3._iterableDiffersFactory());
        }
        return this.__IterableDiffers_39;
    }
    get _KeyValueDiffers_40() {
        if ((this.__KeyValueDiffers_40 == null)) {
            (this.__KeyValueDiffers_40 = import3._keyValueDiffersFactory());
        }
        return this.__KeyValueDiffers_40;
    }
    get _SharedStylesHost_41() {
        if ((this.__SharedStylesHost_41 == null)) {
            (this.__SharedStylesHost_41 = this._DomSharedStylesHost_31);
        }
        return this.__SharedStylesHost_41;
    }
    get _Meta_42() {
        if ((this.__Meta_42 == null)) {
            (this.__Meta_42 = import4.meta());
        }
        return this.__Meta_42;
    }
    get _Title_43() {
        if ((this.__Title_43 == null)) {
            (this.__Title_43 = new import25.Title());
        }
        return this.__Title_43;
    }
    get _BrowserXhr_44() {
        if ((this.__BrowserXhr_44 == null)) {
            (this.__BrowserXhr_44 = new import26.BrowserXhr());
        }
        return this.__BrowserXhr_44;
    }
    get _ResponseOptions_45() {
        if ((this.__ResponseOptions_45 == null)) {
            (this.__ResponseOptions_45 = new import27.BaseResponseOptions());
        }
        return this.__ResponseOptions_45;
    }
    get _XSRFStrategy_46() {
        if ((this.__XSRFStrategy_46 == null)) {
            (this.__XSRFStrategy_46 = import5._createDefaultCookieXSRFStrategy());
        }
        return this.__XSRFStrategy_46;
    }
    get _XHRBackend_47() {
        if ((this.__XHRBackend_47 == null)) {
            (this.__XHRBackend_47 = new import28.XHRBackend(this._BrowserXhr_44, this._ResponseOptions_45, this._XSRFStrategy_46));
        }
        return this.__XHRBackend_47;
    }
    get _RequestOptions_48() {
        if ((this.__RequestOptions_48 == null)) {
            (this.__RequestOptions_48 = new import29.BaseRequestOptions());
        }
        return this.__RequestOptions_48;
    }
    get _Http_49() {
        if ((this.__Http_49 == null)) {
            (this.__Http_49 = import5.httpFactory(this._XHRBackend_47, this._RequestOptions_48));
        }
        return this.__Http_49;
    }
    get _RadioControlRegistry_50() {
        if ((this.__RadioControlRegistry_50 == null)) {
            (this.__RadioControlRegistry_50 = new import30.RadioControlRegistry());
        }
        return this.__RadioControlRegistry_50;
    }
    get _FormBuilder_51() {
        if ((this.__FormBuilder_51 == null)) {
            (this.__FormBuilder_51 = new import31.FormBuilder());
        }
        return this.__FormBuilder_51;
    }
    get _AppRootToken_52() {
        if ((this.__AppRootToken_52 == null)) {
            (this.__AppRootToken_52 = import64.MyApp);
        }
        return this.__AppRootToken_52;
    }
    get _DeepLinkConfigToken_53() {
        if ((this.__DeepLinkConfigToken_53 == null)) {
            (this.__DeepLinkConfigToken_53 = null);
        }
        return this.__DeepLinkConfigToken_53;
    }
    ${getterOne}
    ${getterTwo}
    get _Events_56() {
        if ((this.__Events_56 == null)) {
            (this.__Events_56 = new import34.Events());
        }
        return this.__Events_56;
    }
    get _Form_57() {
        if ((this.__Form_57 == null)) {
            (this.__Form_57 = new import35.Form());
        }
        return this.__Form_57;
    }
    get _Haptic_58() {
        if ((this.__Haptic_58 == null)) {
            (this.__Haptic_58 = new import36.Haptic(this._Platform_15));
        }
        return this.__Haptic_58;
    }
    get _Keyboard_59() {
        if ((this.__Keyboard_59 == null)) {
            (this.__Keyboard_59 = new import37.Keyboard(this._Config_16, this._Platform_15, this.parent.get(import62.NgZone), this._DomController_17));
        }
        return this.__Keyboard_59;
    }
    get _LoadingController_60() {
        if ((this.__LoadingController_60 == null)) {
            (this.__LoadingController_60 = new import38.LoadingController(this._App_19, this._Config_16));
        }
        return this.__LoadingController_60;
    }
    get _LocationStrategy_61() {
        if ((this.__LocationStrategy_61 == null)) {
            (this.__LocationStrategy_61 = import8.provideLocationStrategy(this.parent.get(import65.PlatformLocation), this.parent.get(import66.APP_BASE_HREF, null), this._Config_16));
        }
        return this.__LocationStrategy_61;
    }
    get _Location_62() {
        if ((this.__Location_62 == null)) {
            (this.__Location_62 = new import39.Location(this._LocationStrategy_61));
        }
        return this.__Location_62;
    }
    get _ModalController_63() {
        if ((this.__ModalController_63 == null)) {
            (this.__ModalController_63 = new import40.ModalController(this._App_19, this._Config_16));
        }
        return this.__ModalController_63;
    }
    get _PickerController_64() {
        if ((this.__PickerController_64 == null)) {
            (this.__PickerController_64 = new import41.PickerController(this._App_19, this._Config_16));
        }
        return this.__PickerController_64;
    }
    get _PopoverController_65() {
        if ((this.__PopoverController_65 == null)) {
            (this.__PopoverController_65 = new import42.PopoverController(this._App_19, this._Config_16));
        }
        return this.__PopoverController_65;
    }
    get _SystemJsNgModuleLoader_66() {
        if ((this.__SystemJsNgModuleLoader_66 == null)) {
            (this.__SystemJsNgModuleLoader_66 = new import43.SystemJsNgModuleLoader(this._Compiler_26, this.parent.get(import43.SystemJsNgModuleLoaderConfig, null)));
        }
        return this.__SystemJsNgModuleLoader_66;
    }
    get _TapClick_67() {
        if ((this.__TapClick_67 == null)) {
            (this.__TapClick_67 = new import44.TapClick(this._Config_16, this._Platform_15, this._DomController_17, this._App_19, this.parent.get(import62.NgZone), this._GestureController_20));
        }
        return this.__TapClick_67;
    }
    get _ToastController_68() {
        if ((this.__ToastController_68 == null)) {
            (this.__ToastController_68 = new import45.ToastController(this._App_19, this._Config_16));
        }
        return this.__ToastController_68;
    }
    get _TransitionController_69() {
        if ((this.__TransitionController_69 == null)) {
            (this.__TransitionController_69 = new import46.TransitionController(this._Platform_15, this._Config_16));
        }
        return this.__TransitionController_69;
    }
    get _ModuleLoader_70() {
        if ((this.__ModuleLoader_70 == null)) {
            (this.__ModuleLoader_70 = import8.provideModuleLoader(this._DeepLinkConfigToken_53, this._SystemJsNgModuleLoader_66, this));
        }
        return this.__ModuleLoader_70;
    }
    get _UrlSerializer_71() {
        if ((this.__UrlSerializer_71 == null)) {
            (this.__UrlSerializer_71 = import67.setupUrlSerializer(this._DeepLinkConfigToken_53));
        }
        return this.__UrlSerializer_71;
    }
    get _DeepLinker_72() {
        if ((this.__DeepLinker_72 == null)) {
            (this.__DeepLinker_72 = import68.setupDeepLinker(this._App_19, this._UrlSerializer_71, this._Location_62, this._DeepLinkConfigToken_53, this._ModuleLoader_70, this));
        }
        return this.__DeepLinker_72;
    }
    createInternal() {
        this._CommonModule_0 = new import2.CommonModule();
        this._ApplicationModule_1 = new import3.ApplicationModule();
        this._BrowserModule_2 = new import4.BrowserModule(this.parent.get(import4.BrowserModule, null));
        this._HttpModule_3 = new import5.HttpModule();
        this._InternalFormsSharedModule_4 = new import6.InternalFormsSharedModule();
        this._FormsModule_5 = new import7.FormsModule();
        this._ReactiveFormsModule_6 = new import7.ReactiveFormsModule();
        this._IonicModule_7 = new import8.IonicModule();
        this._AppModule_8 = new import1.AppModule();
        this._ErrorHandler_11 = import4.errorHandler();
        this._ConfigToken_12 = null;
        this._DOCUMENT_13 = import4._document();
        this._PlatformConfigToken_14 = import69.providePlatformConfigs();
        this._Platform_15 = import70.setupPlatform(this._DOCUMENT_13, this._PlatformConfigToken_14, this.parent.get(import62.NgZone));
        this._Config_16 = import71.setupConfig(this._ConfigToken_12, this._Platform_15);
        this._DomController_17 = new import10.DomController(this._Platform_15);
        this._MenuController_18 = new import11.MenuController();
        this._App_19 = new import12.App(this._Config_16, this._Platform_15, this._MenuController_18);
        this._GestureController_20 = new import13.GestureController(this._App_19);
        this._APP_INITIALIZER_21 = [
            import72.registerModeConfigs(this._Config_16),
            import34.setupProvideEvents(this._Platform_15, this._DomController_17),
            import44.setupTapClick(this._Config_16, this._Platform_15, this._DomController_17, this._App_19, this.parent.get(import62.NgZone), this._GestureController_20)
        ];
        this._ApplicationInitStatus_22 = new import14.ApplicationInitStatus(this._APP_INITIALIZER_21);
        this._Testability_23 = new import15.Testability(this.parent.get(import62.NgZone));
        this._ApplicationRef__24 = new import16.ApplicationRef_(this.parent.get(import62.NgZone), this.parent.get(import73.Console), this, this._ErrorHandler_11, this, this._ApplicationInitStatus_22, this.parent.get(import15.TestabilityRegistry, null), this._Testability_23);
        this._DomSharedStylesHost_31 = new import20.DomSharedStylesHost(this._DOCUMENT_13);
        return this._AppModule_8;
    }
    getInternal(token, notFoundResult) {
        if ((token === import2.CommonModule)) {
            return this._CommonModule_0;
        }
        if ((token === import3.ApplicationModule)) {
            return this._ApplicationModule_1;
        }
        if ((token === import4.BrowserModule)) {
            return this._BrowserModule_2;
        }
        if ((token === import5.HttpModule)) {
            return this._HttpModule_3;
        }
        if ((token === import6.InternalFormsSharedModule)) {
            return this._InternalFormsSharedModule_4;
        }
        if ((token === import7.FormsModule)) {
            return this._FormsModule_5;
        }
        if ((token === import7.ReactiveFormsModule)) {
            return this._ReactiveFormsModule_6;
        }
        if ((token === import8.IonicModule)) {
            return this._IonicModule_7;
        }
        if ((token === import1.AppModule)) {
            return this._AppModule_8;
        }
        if ((token === import58.LOCALE_ID)) {
            return this._LOCALE_ID_9;
        }
        if ((token === import9.NgLocalization)) {
            return this._NgLocalization_10;
        }
        if ((token === import74.ErrorHandler)) {
            return this._ErrorHandler_11;
        }
        if ((token === import71.ConfigToken)) {
            return this._ConfigToken_12;
        }
        if ((token === import75.DOCUMENT)) {
            return this._DOCUMENT_13;
        }
        if ((token === import69.PlatformConfigToken)) {
            return this._PlatformConfigToken_14;
        }
        if ((token === import70.Platform)) {
            return this._Platform_15;
        }
        if ((token === import71.Config)) {
            return this._Config_16;
        }
        if ((token === import10.DomController)) {
            return this._DomController_17;
        }
        if ((token === import11.MenuController)) {
            return this._MenuController_18;
        }
        if ((token === import12.App)) {
            return this._App_19;
        }
        if ((token === import13.GestureController)) {
            return this._GestureController_20;
        }
        if ((token === import14.APP_INITIALIZER)) {
            return this._APP_INITIALIZER_21;
        }
        if ((token === import14.ApplicationInitStatus)) {
            return this._ApplicationInitStatus_22;
        }
        if ((token === import15.Testability)) {
            return this._Testability_23;
        }
        if ((token === import16.ApplicationRef_)) {
            return this._ApplicationRef__24;
        }
        if ((token === import16.ApplicationRef)) {
            return this._ApplicationRef_25;
        }
        if ((token === import17.Compiler)) {
            return this._Compiler_26;
        }
        if ((token === import59.APP_ID)) {
            return this._APP_ID_27;
        }
        if ((token === import18.HAMMER_GESTURE_CONFIG)) {
            return this._HAMMER_GESTURE_CONFIG_28;
        }
        if ((token === import19.EVENT_MANAGER_PLUGINS)) {
            return this._EVENT_MANAGER_PLUGINS_29;
        }
        if ((token === import19.EventManager)) {
            return this._EventManager_30;
        }
        if ((token === import20.DomSharedStylesHost)) {
            return this._DomSharedStylesHost_31;
        }
        if ((token === import76.AnimationDriver)) {
            return this._AnimationDriver_32;
        }
        if ((token === import21.DomRootRenderer)) {
            return this._DomRootRenderer_33;
        }
        if ((token === import77.RootRenderer)) {
            return this._RootRenderer_34;
        }
        if ((token === import22.DomSanitizer)) {
            return this._DomSanitizer_35;
        }
        if ((token === import78.Sanitizer)) {
            return this._Sanitizer_36;
        }
        if ((token === import23.AnimationQueue)) {
            return this._AnimationQueue_37;
        }
        if ((token === import24.ViewUtils)) {
            return this._ViewUtils_38;
        }
        if ((token === import79.IterableDiffers)) {
            return this._IterableDiffers_39;
        }
        if ((token === import80.KeyValueDiffers)) {
            return this._KeyValueDiffers_40;
        }
        if ((token === import20.SharedStylesHost)) {
            return this._SharedStylesHost_41;
        }
        if ((token === import81.Meta)) {
            return this._Meta_42;
        }
        if ((token === import25.Title)) {
            return this._Title_43;
        }
        if ((token === import26.BrowserXhr)) {
            return this._BrowserXhr_44;
        }
        if ((token === import27.ResponseOptions)) {
            return this._ResponseOptions_45;
        }
        if ((token === import82.XSRFStrategy)) {
            return this._XSRFStrategy_46;
        }
        if ((token === import28.XHRBackend)) {
            return this._XHRBackend_47;
        }
        if ((token === import29.RequestOptions)) {
            return this._RequestOptions_48;
        }
        if ((token === import83.Http)) {
            return this._Http_49;
        }
        if ((token === import30.RadioControlRegistry)) {
            return this._RadioControlRegistry_50;
        }
        if ((token === import31.FormBuilder)) {
            return this._FormBuilder_51;
        }
        if ((token === import84.AppRootToken)) {
            return this._AppRootToken_52;
        }
        if ((token === import67.DeepLinkConfigToken)) {
            return this._DeepLinkConfigToken_53;
        }
        ${ifStatementOne}
        ${ifStatementTwo}
        if ((token === import34.Events)) {
            return this._Events_56;
        }
        if ((token === import35.Form)) {
            return this._Form_57;
        }
        if ((token === import36.Haptic)) {
            return this._Haptic_58;
        }
        if ((token === import37.Keyboard)) {
            return this._Keyboard_59;
        }
        if ((token === import38.LoadingController)) {
            return this._LoadingController_60;
        }
        if ((token === import66.LocationStrategy)) {
            return this._LocationStrategy_61;
        }
        if ((token === import39.Location)) {
            return this._Location_62;
        }
        if ((token === import40.ModalController)) {
            return this._ModalController_63;
        }
        if ((token === import41.PickerController)) {
            return this._PickerController_64;
        }
        if ((token === import42.PopoverController)) {
            return this._PopoverController_65;
        }
        if ((token === import43.SystemJsNgModuleLoader)) {
            return this._SystemJsNgModuleLoader_66;
        }
        if ((token === import44.TapClick)) {
            return this._TapClick_67;
        }
        if ((token === import45.ToastController)) {
            return this._ToastController_68;
        }
        if ((token === import46.TransitionController)) {
            return this._TransitionController_69;
        }
        if ((token === import85.ModuleLoader)) {
            return this._ModuleLoader_70;
        }
        if ((token === import67.UrlSerializer)) {
            return this._UrlSerializer_71;
        }
        if ((token === import68.DeepLinker)) {
            return this._DeepLinker_72;
        }
        return notFoundResult;
    }
    destroyInternal() {
        this._ApplicationRef__24.ngOnDestroy();
        this._DomSharedStylesHost_31.ngOnDestroy();
    }
}
export const AppModuleNgFactory = new import0.NgModuleFactory(AppModuleInjector, import1.AppModule);
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

      const purgeGetterRegExOne = treeshake.generateRemoveGetterFromImportRegex(namedImportOne);
      const purgeGetterResultsOne = purgeGetterRegExOne.exec(updatedContent);
      const purgeIfRegExOne = treeshake.generateRemoveIfStatementRegex(namedImportOne);
      const purgeIfResultsOne = purgeIfRegExOne.exec(updatedContent);

      const purgeGetterRegExTwo = treeshake.generateRemoveGetterFromImportRegex(namedImportTwo);

      const purgeGetterResultsTwo = purgeGetterRegExTwo.exec(updatedContent);
      const purgeIfRegExTwo = treeshake.generateRemoveIfStatementRegex(namedImportTwo);
      const purgeIfResultsTwo = purgeIfRegExTwo.exec(updatedContent);

      expect(updatedContent.indexOf(`/*${purgeGetterResultsOne[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${purgeIfResultsOne[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${purgeGetterResultsTwo[0]}*/`)).toBeGreaterThanOrEqual(0);
      expect(updatedContent.indexOf(`/*${purgeIfResultsTwo[0]}*/`)).toBeGreaterThanOrEqual(0);
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
});
