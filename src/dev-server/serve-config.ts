export interface ServeConfig {
  httpPort: number;
  host: string;
  rootDir: string;
  launchBrowser: boolean;
  launchLab: boolean;
  browserToLaunch: string;
  useLiveReload: boolean;
  liveReloadPort: Number;
  notificationPort: Number;
  useNotifier: boolean;
  useServerLogs: boolean;
  notifyOnConsoleLog: boolean;
  useProxy: boolean;
}
export const LOGGER_DIR = '__ion-dev-server';
export const IONIC_LAB_URL = `/${LOGGER_DIR}/ionic_lab.html`;
