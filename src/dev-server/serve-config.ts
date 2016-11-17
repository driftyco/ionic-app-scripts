export interface ServeConfig {
  httpPort: number;
  host: string;
  rootDir: string;
  wwwDir: string;
  buildDir: string;
  launchBrowser: boolean;
  launchLab: boolean;
  browserToLaunch: string;
  useLiveReload: boolean;
  liveReloadPort: Number;
  notificationPort: Number;
  useServerLogs: boolean;
  notifyOnConsoleLog: boolean;
  useProxy: boolean;
}
export const LOGGER_DIR = '__ion-dev-server';
export const IONIC_LAB_URL = `/${LOGGER_DIR}/ionic-lab.html`;
