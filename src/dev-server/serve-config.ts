import * as path from 'path';

export interface ServeConfig {
  httpPort: number;
  host: string;
  hostBaseUrl: string;
  rootDir: string;
  wwwDir: string;
  buildDir: string;
  isCordovaServe: boolean;
  launchBrowser: boolean;
  launchLab: boolean;
  browserToLaunch: string;
  useLiveReload: boolean;
  liveReloadPort: Number;
  notificationPort: Number;
  useServerLogs: boolean;
  notifyOnConsoleLog: boolean;
  useProxy: boolean;
  devapp: boolean;
}
export const LOGGER_DIR = '__ion-dev-server';
export const IONIC_LAB_URL = '/ionic-lab';

export const IOS_PLATFORM_PATHS = [path.join('platforms', 'ios', 'www')];
export const ANDROID_PLATFORM_PATHS = [
  path.join('platforms', 'android', 'assets', 'www'),
  path.join('platforms', 'android', 'app', 'src', 'main', 'assets', 'www')
];
