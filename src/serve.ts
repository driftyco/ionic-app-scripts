import { BuildContext } from './util/interfaces';
import { generateContext, getConfigValue, hasConfigValue } from './util/config';
import { BuildError } from './util/errors';
import { setContext } from './util/helpers';
import { Logger } from './logger/logger';
import { watch } from './watch';
import open from './util/open';
import { createNotificationServer } from './dev-server/notification-server';
import { createHttpServer } from './dev-server/http-server';
import { createLiveReloadServer } from './dev-server/live-reload';
import { ServeConfig, IONIC_LAB_URL } from './dev-server/serve-config';

const DEV_LOGGER_DEFAULT_PORT = 53703;
const LIVE_RELOAD_DEFAULT_PORT = 35729;
const DEV_SERVER_DEFAULT_PORT = 8100;
const DEV_SERVER_DEFAULT_HOST = '0.0.0.0';

export function serve(context?: BuildContext) {
  context = generateContext(context);
  setContext(context);
  const config: ServeConfig = {
    httpPort: getHttpServerPort(context),
    host: getHttpServerHost(context),
    rootDir: context.rootDir,
    wwwDir: context.wwwDir,
    buildDir: context.buildDir,
    isCordovaServe: isCordovaServe(context),
    launchBrowser: launchBrowser(context),
    launchLab: launchLab(context),
    browserToLaunch: browserToLaunch(context),
    useLiveReload: useLiveReload(context),
    liveReloadPort: getLiveReloadServerPort(context),
    notificationPort: getNotificationPort(context),
    useServerLogs: useServerLogs(context),
    useProxy: useProxy(context),
    notifyOnConsoleLog: sendClientConsoleLogs(context)
  };

  createNotificationServer(config);
  createLiveReloadServer(config);
  createHttpServer(config);

  return watch(context)
    .then(() => {
      onReady(config, context);
    }, (err: BuildError) => {
      throw err;
    })
    .catch((err: BuildError) => {
      if (err && err.isFatal) {
        process.exit(1);
      } else {
        onReady(config, context);
      }
    });
}

function onReady(config: ServeConfig, context: BuildContext) {
  const host = config.host === '0.0.0.0' ? 'localhost' : config.host;
  if (config.launchBrowser || config.launchLab) {
    const openOptions: string[] = [`http://${host}:${config.httpPort}`]
      .concat(launchLab(context) ? [IONIC_LAB_URL] : [])
      .concat(browserOption(context) ? [browserOption(context)] : [])
      .concat(platformOption(context) ? ['?ionicplatform=', platformOption(context)] : []);

    open(openOptions.join(''), browserToLaunch(context));
  }
  Logger.info(`dev server running: http://${host}:${config.httpPort}/`, 'green', true);
  Logger.newLine();
}

function getHttpServerPort(context: BuildContext) {
  const port = getConfigValue(context, '--port', '-p', 'IONIC_PORT', 'ionic_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_SERVER_DEFAULT_PORT;
}

function getHttpServerHost(context: BuildContext) {
  const host = getConfigValue(context, '--address', '-h', 'IONIC_ADDRESS', 'ionic_address', null);
  if (host) {
    return host;
  }
  return DEV_SERVER_DEFAULT_HOST;
}

function getLiveReloadServerPort(context: BuildContext) {
  const port = getConfigValue(context, '--livereload-port', null, 'IONIC_LIVERELOAD_PORT', 'ionic_livereload_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return LIVE_RELOAD_DEFAULT_PORT;
}

export function getNotificationPort(context: BuildContext) {
  const port = getConfigValue(context, '--dev-logger-port', null, 'IONIC_DEV_LOGGER_PORT', 'ionic_dev_logger_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_LOGGER_DEFAULT_PORT;
}

function useServerLogs(context: BuildContext) {
  return hasConfigValue(context, '--serverlogs', '-s', 'ionic_serverlogs', false);
}

function isCordovaServe(context: BuildContext) {
  return hasConfigValue(context, '--iscordovaserve', '-z', 'ionic_cordova_serve', false);
}

function launchBrowser(context: BuildContext) {
  return !hasConfigValue(context, '--nobrowser', '-b', 'ionic_launch_browser', false);
}

function browserToLaunch(context: BuildContext) {
  return getConfigValue(context, '--browser', '-w', 'IONIC_BROWSER', 'ionic_browser', null);
}

function browserOption(context: BuildContext) {
  return getConfigValue(context, '--browseroption', '-o', 'IONIC_BROWSEROPTION', 'ionic_browseroption', null);
}

function launchLab(context: BuildContext) {
  return hasConfigValue(context, '--lab', '-l', 'ionic_lab', false);
}

function platformOption(context: BuildContext) {
  return getConfigValue(context, '--platform', '-t', 'IONIC_PLATFORM_BROWSER', 'ionic_platform_browser', null);
}

function useLiveReload(context: BuildContext) {
  return !hasConfigValue(context, '--nolivereload', '-d', 'ionic_livereload', false);
}

function useProxy(context: BuildContext) {
  return !hasConfigValue(context, '--noproxy', '-x', 'ionic_proxy', false);
}

function sendClientConsoleLogs(context: BuildContext) {
  return hasConfigValue(context, '--consolelogs', '-c', 'ionic_consolelogs', false);
}
