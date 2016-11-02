import { BuildContext } from './util/interfaces';
import { generateContext, getConfigValue, hasConfigValue } from './util/config';
import { Logger } from './util/logger';
import { watch } from './watch';
import * as chalk from 'chalk';
import open from './util/open';
import { createNotificationServer } from './dev-server/notification-server';
import { createHttpServer } from './dev-server/http-server';
import { createLiveReloadServer } from './dev-server/live-reload';
import { ServeConfig, IONIC_LAB_URL } from './dev-server/serve-config';


const DEV_LOGGER_DEFAULT_PORT = 53703;
const LIVE_RELOAD_DEFAULT_PORT = 35729;
const DEV_SERVER_DEFAULT_PORT = 8100;
const DEV_SERVER_DEFAULT_HOST = 'localhost';

export function serve(context?: BuildContext) {
  context = generateContext(context);

  const config: ServeConfig = {
    httpPort: getHttpServerPort(context),
    host: getHttpServerHost(context),
    rootDir: context.wwwDir,
    launchBrowser: launchBrowser(context),
    launchLab: launchLab(context),
    browserToLaunch: browserToLaunch(context),
    useLiveReload: useLiveReload(context),
    liveReloadPort: getLiveReloadServerPort(context),
    notificationPort: getNotificationPort(context),
    useServerLogs: useServerLogs(context),
    useNotifier: true,
    useProxy: useProxy(context),
    notifyOnConsoleLog: sendClientConsoleLogs(context)
  };

  const HttpServer = createHttpServer(config);
  const liveReloadServer = createLiveReloadServer(config);
  const notificationServer = createNotificationServer(config);

  return watch(context)
    .then(() => {
      onReady(config, context);
    }, () => {
      onReady(config, context);
    });
}

function onReady(config: ServeConfig, context: BuildContext) {
  if (config.launchBrowser || config.launchLab) {
    const openOptions: string[] = [`http://${config.host}:${config.httpPort}/`]
      .concat(launchLab(context) ? [IONIC_LAB_URL] : [])
      .concat(browserOption(context) ? [browserOption(context)] : [])
      .concat(platformOption(context) ? ['?ionicplatform=', platformOption(context)] : []);

    open(openOptions.join(''), browserToLaunch(context));
  }
  Logger.info(chalk.green(`dev server running: http://${config.host}:${config.httpPort}/`));
}

function getHttpServerPort(context: BuildContext) {
  const port = getConfigValue(context, '--port', '-p', 'ionic_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_SERVER_DEFAULT_PORT;
}

function getHttpServerHost(context: BuildContext) {
  const host = getConfigValue(context, '--address', '-h', 'ionic_address', null);
  if (host) {
    return host;
  }
  return DEV_SERVER_DEFAULT_HOST;
}

function getLiveReloadServerPort(context: BuildContext) {
  const port = getConfigValue(context, '--livereload-port', null, 'ionic_livereload_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return LIVE_RELOAD_DEFAULT_PORT;
}

export function getNotificationPort(context: BuildContext) {
  const port = getConfigValue(context, '--dev-logger-port', null, 'ionic_dev_logger_port', null);
  if (port) {
    return parseInt(port, 10);
  }
  return DEV_LOGGER_DEFAULT_PORT;
}

function useServerLogs(context: BuildContext) {
  return hasConfigValue(context, '--serverlogs', '-s', 'ionic_serverlogs', false);
}

function launchBrowser(context: BuildContext) {
  return !hasConfigValue(context, '--nobrowser', '-b', 'ionic_launch_browser', false);
}

function browserToLaunch(context: BuildContext) {
  return getConfigValue(context, '--browser', '-w', 'ionic_browser', null);
}

function browserOption(context: BuildContext) {
  return getConfigValue(context, '--browseroption', '-o', 'ionic_browseroption', null);
}

function launchLab(context: BuildContext) {
  return hasConfigValue(context, '--lab', '-l', 'ionic_lab', false);
}

function platformOption(context: BuildContext) {
  return getConfigValue(context, '--platform', '-t', 'ionic_platform_browser', null);
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
