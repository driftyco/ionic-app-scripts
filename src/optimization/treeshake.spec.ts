import { join } from 'path';
import * as treeshake from './treeshake'
import * as Constants from '../util/constants';


let originalEnv: any = null;

const main = '/Users/dan/myApp/app/main.js';
const appModule = '/Users/dan/myApp/app/app.module.js';

describe('treeshake', () => {
  describe('calculateTreeShakeResults', () => {

    beforeEach(() => {
      originalEnv = process.env;
      let env: any = { };
      env[Constants.ENV_VAR_IONIC_ANGULAR_DIR] = '/Users/dan/ionic-angular';
      env[Constants.ENV_VAR_IONIC_ANGULAR_ENTRY_POINT] = '/Users/dan/ionic-angular/index.js';
      env[Constants.ENV_VAR_SRC_DIR] = '/Users/dan/myApp/';
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

    it('should remove modules that are only imported by index', () => {
      // arrange

      const dependencyOne = '/Users/dan/ionic-angular/components/range.js';
      const dependencyTwo = '/Users/dan/ionic-angular/components/radio-button.js';
      const dependencyThree = '/Users/dan/ionic-angular/components/check-box.js';

      const index = '/Users/dan/ionic-angular/index.js';

      const dependencyOneSet = new Set<string>();
      dependencyOneSet.add(index);

      const dependencyTwoSet = new Set<string>();
      dependencyTwoSet.add(index);

      const dependencyThreeSet = new Set<string>();
      dependencyThreeSet.add(index);


      const dependencyMap = new Map<string, Set<string>>();
      dependencyMap.set(dependencyOne, dependencyOneSet);
      dependencyMap.set(dependencyTwo, dependencyTwoSet);
      dependencyMap.set(dependencyThree, dependencyThreeSet);
      dependencyMap.set(index, new Set<string>());

      // act
      const results = treeshake.calculateUnusedComponents(dependencyMap);

      // assert
      expect(results.updatedDependencyMap.get(dependencyOne)).not.toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyTwo)).not.toBeTruthy();
      expect(results.updatedDependencyMap.get(dependencyThree)).not.toBeTruthy();
      expect(results.purgedModules.get(dependencyOne)).toBeTruthy();
      expect(results.purgedModules.get(dependencyTwo)).toBeTruthy();
      expect(results.purgedModules.get(dependencyThree)).toBeTruthy();
    });

    it('should remove other components that are imported only by index or other modules that can be removed (only imported by index)', () => {
      // arrange

      const dependencyOne = '/Users/dan/ionic-angular/components/range.js';
      const dependencyOneNgFactory = '/Users/dan/ionic-angular/components/range.ngfactory.js';

      const dependencyOneHelperOne = '/Users/dan/ionic-angular/components/range/helperOne.js';
      const dependencyOneHelperTwo = '/Users/dan/ionic-angular/components/range/helperTwo.js';

      const dependencyTwo = '/Users/dan/ionic-angular/components/radio-button.js';
      const dependencyThree = '/Users/dan/ionic-angular/components/check-box.js';

      const dependencyFour = '/Users/dan/ionic-angular/components/badge.js';
      const dependencyFourNgFactory = '/Users/dan/ionic-angular/components/badge.ngfactory.js';

      const appModuleNgFactory = '/Users/dan/myApp/app/app.module.ngfactory.js';

      const alert = '/Users/dan/ionic-angular/components/alert/alert.js';
      const alertController = '/Users/dan/ionic-angular/components/alert/alert-controller.js';
      const alertComponent = '/Users/dan/ionic-angular/components/alert/alert-component.js';
      const alertComponentNgFactory = '/Users/dan/ionic-angular/components/alert/alert-component.ngfactory.js';

      const actionSheet = '/Users/dan/ionic-angular/components/action-sheet/action-sheet.js';
      const actionSheetController = '/Users/dan/ionic-angular/components/action-sheet/action-sheet-controller.js';
      const actionSheetComponent = '/Users/dan/ionic-angular/components/action-sheet/action-sheet-component.js';
      const actionSheetComponentNgFactory = '/Users/dan/ionic-angular/components/action-sheet/action-sheet-component.ngfactory.js';

      const home = '/Users/dan/myApp/pages/home.js';
      const homeNgFactory = '/Users/dan/myApp/pages/home.ngfactory.js';

      const index = '/Users/dan/ionic-angular/index.js';

      const appModuleSet = new Set<string>();
      appModuleSet.add(appModuleNgFactory);

      const appModuleNgFactorySet = new Set<string>();

      const homeSet = new Set<string>();
      homeSet.add(appModule);
      homeSet.add(homeNgFactory);

      const homeNgFactorySet = new Set<string>();
      homeNgFactorySet.add(appModuleNgFactory);

      const dependencyOneSet = new Set<string>();
      dependencyOneSet.add(index);
      dependencyOneSet.add(dependencyOneNgFactory);
      dependencyOneSet.add(home);

      const dependencyOneNgFactorySet = new Set<string>();
      dependencyOneNgFactorySet.add(homeNgFactory);

      const dependencyTwoSet = new Set<string>();
      dependencyTwoSet.add(index);

      const dependencyThreeSet = new Set<string>();
      dependencyThreeSet.add(index);

      const dependencyFourSet = new Set<string>();
      dependencyFourSet.add(index);
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
      dependencyOneHelperOneSet.add(index);
      const dependencyOneHelperTwoSet = new Set<string>();
      dependencyOneHelperTwoSet.add(dependencyOne);
      dependencyOneHelperTwoSet.add(index);

      const alertSet  = new Set<string>();
      alertSet.add(alertController);

      const alertControllerSet = new Set<string>();
      alertControllerSet.add(index);
      alertControllerSet.add(appModuleNgFactory);

      const alertComponentSet = new Set<string>();
      alertComponentSet.add(index);
      alertComponentSet.add(alertComponentNgFactory);

      const alertComponentNgFactorySet = new Set<string>();
      alertComponentNgFactorySet.add(appModuleNgFactory);

      const actionSheetSet  = new Set<string>();
      actionSheetSet.add(actionSheetController);

      const actionSheetControllerSet = new Set<string>();
      actionSheetControllerSet.add(index);
      actionSheetControllerSet.add(appModuleNgFactory);
      actionSheetControllerSet.add(homeNgFactory);

      const actionSheetComponentSet = new Set<string>();
      actionSheetComponentSet.add(index);
      actionSheetComponentSet.add(actionSheetComponentNgFactory);

      const actionSheetComponentNgFactorySet = new Set<string>();
      actionSheetComponentNgFactorySet.add(appModuleNgFactory);

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
      dependencyMap.set(index, indexSet);
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

      console.log('results: ', results);

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


      expect(results.purgedModules.get(dependencyTwo)).toBeTruthy();
      expect(results.purgedModules.get(dependencyThree)).toBeTruthy();
      expect(results.purgedModules.get(alert)).toBeTruthy();
      expect(results.purgedModules.get(alertController)).toBeTruthy();
      expect(results.purgedModules.get(alertComponent)).toBeTruthy();
      expect(results.purgedModules.get(alertComponentNgFactory)).toBeTruthy();

    });
  });

  describe('purgeUnusedImportsAndExportsFromIndex', () => {
    it('should remove the import and export statement', () => {
      // arrange
      const importsToPurge = `
import { RangeKnob } from './components/range/range-knob';
import { Refresher } from './components/refresher/refresher';
import { RefresherContent } from './components/refresher/refresher-content';
      `;

      const exportsToPurge = `
export { RangeKnob } from './components/range/range-knob';
export { Refresher } from './components/refresher/refresher';
export { RefresherContent } from './components/refresher/refresher-content';
      `;

      const indexFileContent = `
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
/**
 * Export Components/Directives
 */
export { ActionSheet, ActionSheetController } from './components/action-sheet/action-sheet';
export { Alert, AlertController } from './components/alert/alert';
export { App } from './components/app/app';
export { Avatar } from './components/avatar/avatar';
export { Backdrop } from './components/backdrop/backdrop';
export { Badge } from './components/badge/badge';
export { One } from './components/badge/badge/one';
export { Two } from './components/badge/badge/two';
export { Button } from './components/button/button';
export { Card } from './components/card/card';
export { CardContent } from './components/card/card-content';
export { CardHeader } from './components/card/card-header';
export { CardTitle } from './components/card/card-title';
export { Checkbox } from './components/checkbox/checkbox';
export { Chip } from './components/chip/chip';
export { ClickBlock } from './util/click-block';
export { Content } from './components/content/content';
export { DateTime } from './components/datetime/datetime';
export { FabButton } from './components/fab/fab';
export { FabContainer } from './components/fab/fab-container';
export { FabList } from './components/fab/fab-list';
export { Col } from './components/grid/column';
export { Grid } from './components/grid/grid';
export { Row } from './components/grid/row';
export { Ion } from './components/ion';
export { Icon } from './components/icon/icon';
export { Img } from './components/img/img';
export { InfiniteScroll } from './components/infinite-scroll/infinite-scroll';
export { InfiniteScrollContent } from './components/infinite-scroll/infinite-scroll-content';
export { TextInput } from './components/input/input';
export { IonicApp } from './components/app/app-root';
export { Item } from './components/item/item';
export { ItemContent } from './components/item/item-content';
export { ItemDivider } from './components/item/item-divider';
export { ItemGroup } from './components/item/item-group';
export { ItemReorder } from './components/item/item-reorder';
export { Reorder } from './components/item/reorder';
export { ItemSliding } from './components/item/item-sliding';
export { ItemOptions } from './components/item/item-options';
export { Label } from './components/label/label';
export { List } from './components/list/list';
export { ListHeader } from './components/list/list-header';
export { Loading, LoadingController } from './components/loading/loading';
export { Menu } from './components/menu/menu';
export { MenuClose } from './components/menu/menu-close';
export { MenuController } from './components/menu/menu-controller';
export { MenuToggle } from './components/menu/menu-toggle';
export { MenuType } from './components/menu/menu-types';
export { Modal, ModalController } from './components/modal/modal';
export { Nav } from './components/nav/nav';
export { NavPop } from './components/nav/nav-pop';
export { NavPopAnchor } from './components/nav/nav-pop-anchor';
export { NavPush } from './components/nav/nav-push';
export { NavPushAnchor } from './components/nav/nav-push-anchor';
export { Navbar } from './components/navbar/navbar';
export { NativeInput } from './components/input/native-input';
export { NextInput } from './components/input/next-input';
export { Note } from './components/note/note';
export { Option } from './components/option/option';
export { OverlayPortal } from './components/nav/overlay-portal';
export { Picker, PickerController } from './components/picker/picker';
export { Popover, PopoverController } from './components/popover/popover';
export { RadioButton } from './components/radio/radio-button';
export { RadioGroup } from './components/radio/radio-group';
export { Range } from './components/range/range';
${exportsToPurge}
export { Scroll } from './components/scroll/scroll';
export { Searchbar } from './components/searchbar/searchbar';
export { Segment } from './components/segment/segment';
export { SegmentButton } from './components/segment/segment-button';
export { Select } from './components/select/select';
export { ShowWhen } from './components/show-hide-when/show-hide-when';
export { DisplayWhen } from './components/show-hide-when/show-hide-when';
export { HideWhen } from './components/show-hide-when/hide-when';
export { Slide } from './components/slides/slide';
export { Slides } from './components/slides/slides';
export { Spinner } from './components/spinner/spinner';
export { Tab } from './components/tabs/tab';
export { TabButton } from './components/tabs/tab-button';
export { TabHighlight } from './components/tabs/tab-highlight';
export { Tabs } from './components/tabs/tabs';
export { TapClick, setupTapClick, isActivatable } from './tap-click/tap-click';
export { Toast, ToastController } from './components/toast/toast';
export { Toggle } from './components/toggle/toggle';
export { ToolbarBase } from './components/toolbar/toolbar';
export { Toolbar } from './components/toolbar/toolbar';
export { Header } from './components/toolbar/toolbar-header';
export { Footer } from './components/toolbar/toolbar-footer';
export { ToolbarItem } from './components/toolbar/toolbar-item';
export { ToolbarTitle } from './components/toolbar/toolbar-title';
export { Thumbnail } from './components/thumbnail/thumbnail';
export { Typography } from './components/typography/typography';
export { VirtualScroll } from './components/virtual-scroll/virtual-scroll';
/**
 * Export Providers
 */
export { Config, setupConfig, ConfigToken } from './config/config';
export { DomController } from './platform/dom-controller';
export { Platform, setupPlatform } from './platform/platform';
export { Haptic } from './tap-click/haptic';
export { DeepLinker } from './navigation/deep-linker';
export { NavController } from './navigation/nav-controller';
export { NavControllerBase } from './navigation/nav-controller-base';
export { NavParams } from './navigation/nav-params';
export { DeepLink, DeepLinkMetadata } from './navigation/nav-util';
export { UrlSerializer, DeepLinkConfigToken } from './navigation/url-serializer';
export { ViewController } from './navigation/view-controller';
export { ActionSheetCmp } from './components/action-sheet/action-sheet-component';
export { AlertCmp } from './components/alert/alert-component';
export { LoadingCmp } from './components/loading/loading-component';
export { ModalCmp } from './components/modal/modal-component';
export { PickerCmp, PickerColumnCmp } from './components/picker/picker-component';
export { PopoverCmp } from './components/popover/popover-component';
export { ToastCmp } from './components/toast/toast-component';
/**
 * Export Utils
 */
export { PanGesture } from './gestures/drag-gesture';
export { Gesture } from './gestures/gesture';
export { SlideEdgeGesture } from './gestures/slide-edge-gesture';
export { SlideGesture } from './gestures/slide-gesture';
export { BLOCK_ALL, GESTURE_GO_BACK_SWIPE, GESTURE_MENU_SWIPE, GESTURE_ITEM_SWIPE, GESTURE_REFRESHER, GESTURE_TOGGLE, GestureController, GestureDelegate, BlockerDelegate } from './gestures/gesture-controller';
export { Events, setupEvents, setupProvideEvents } from './util/events';
export { IonicErrorHandler } from './util/ionic-error-handler';
export { Keyboard } from './platform/keyboard';
export { Form, IonicFormInput, IonicTapInput } from './util/form';
export { reorderArray } from './util/util';
export { Animation } from './animations/animation';
export { PageTransition } from './transitions/page-transition';
export { Transition } from './transitions/transition';
      `;

      // act

      const modulesToPurge = ['/Users/dan/myApp/node_modules/ionic-angular/components/range/range-knob',
                              '/Users/dan/myApp/node_modules/ionic-angular/components/refresher/refresher',
                              '/Users/dan/myApp/node_modules/ionic-angular/components/refresher/refresher-content'];
      const newContent = treeshake.purgeUnusedImportsAndExportsFromIndex('/Users/dan/myApp/node_modules/ionic-angular/index.js', indexFileContent, modulesToPurge);

      // assert
      expect(newContent).not.toEqual(indexFileContent);
      expect(newContent.indexOf(importsToPurge)).toEqual(-1);
      expect(newContent.indexOf(exportsToPurge)).toEqual(-1);
    });
  });
});
