import * as path from 'path';
import { injectNotificationScript } from './injector';
import { injectLiveReloadScript } from './live-reload';
import * as express from 'express';
import * as fs from 'fs';
import * as url from 'url';
import {
  ServeConfig,
  LOGGER_DIR,
  IONIC_LAB_URL,
  IOS_PLATFORM_PATHS,
  ANDROID_PLATFORM_PATHS
} from './serve-config';
import { Logger } from '../logger/logger';
import * as proxyMiddleware from 'proxy-middleware';
import { injectDiagnosticsHtml } from '../logger/logger-diagnostics';
import * as Constants from '../util/constants';
import { getBooleanPropertyValue } from '../util/helpers';
import { getProjectJson, IonicProject } from '../util/ionic-project';

import { LabAppView, ApiCordovaProject, ApiPackageJson } from './lab';


/**
 * Create HTTP server
 */
export function createHttpServer(config: ServeConfig): express.Application {

  const app = express();
  app.set('serveConfig', config);

  app.get('/', serveIndex);
  app.use('/', express.static(config.wwwDir));
  app.use(`/${LOGGER_DIR}`, express.static(path.join(__dirname, '..', '..', 'bin'), { maxAge: 31536000 }));

  // Lab routes
  app.use(IONIC_LAB_URL + '/static', express.static(path.join(__dirname, '..', '..', 'lab', 'static')));
  app.get(IONIC_LAB_URL, LabAppView);
  app.get(IONIC_LAB_URL + '/api/v1/cordova', ApiCordovaProject);
  app.get(IONIC_LAB_URL + '/api/v1/app-config', ApiPackageJson);

  app.get('/cordova.js', servePlatformResource, serveMockCordovaJS);
  app.get('/cordova_plugins.js', servePlatformResource);
  app.get('/plugins/*', servePlatformResource);

  if (config.useProxy) {
    setupProxies(app);
  }

  if (config.isPathLocationStrategy) {
    app.get('*', serveIndex);
  }

  return app;
}

function setupProxies(app: express.Application) {
  if (getBooleanPropertyValue(Constants.ENV_READ_CONFIG_JSON)) {
    getProjectJson().then(function (projectConfig: IonicProject) {
      for (const proxy of projectConfig.proxies || []) {
        let opts: any = url.parse(proxy.proxyUrl);
        if (proxy.proxyNoAgent) {
          opts.agent = false;
        }

        opts.rejectUnauthorized = !(proxy.rejectUnauthorized === false);
        opts.cookieRewrite = proxy.cookieRewrite;

        app.use(proxy.path, proxyMiddleware(opts));
        Logger.info('Proxy added:' + proxy.path + ' => ' + url.format(opts));
      }
    }).catch((err: Error) => {
      Logger.error(`Failed to read the projects ionic.config.json file: ${err.message}`);
    });
  }
}

/**
 * http responder for /index.html base entrypoint
 */
function serveIndex(req: express.Request, res: express.Response) {
  const config: ServeConfig = req.app.get('serveConfig');

  // respond with the index.html file
  const indexFileName = path.join(config.wwwDir, process.env[Constants.ENV_VAR_HTML_TO_SERVE]);
  fs.readFile(indexFileName, (err, indexHtml) => {
    if (!indexHtml) {
      Logger.error(`Failed to load index.html`);
      res.send('try again later');
      return;
    }
    if (config.useLiveReload) {
      indexHtml = injectLiveReloadScript(indexHtml, req.hostname, config.liveReloadPort);
      indexHtml = injectNotificationScript(config.rootDir, indexHtml, config.notifyOnConsoleLog, config.notificationPort);
    }

    indexHtml = injectDiagnosticsHtml(config.buildDir, indexHtml);

    res.set('Content-Type', 'text/html');
    res.send(indexHtml);
  });
}

/**
 * http responder for cordova.js file
 */
function serveMockCordovaJS(req: express.Request, res: express.Response) {
  res.set('Content-Type', 'application/javascript');
  res.send('// mock cordova file during development');
}

/**
 * Middleware to serve platform resources
 */
async function servePlatformResource(req: express.Request, res: express.Response, next: express.NextFunction) {
  const config: ServeConfig = req.app.get('serveConfig');
  const userAgent = req.header('user-agent');

  if (!config.isCordovaServe) {
    return next();
  }

  let root = await getResourcePath(req.url, config, userAgent);
  if (root) {
    res.sendFile(req.url, { root });
  } else {
    next();
  }
}

/**
 * Determines the appropriate resource path, and checks if the specified url 
 * 
 * @returns string of the resource path or undefined if there is no match
 */
async function getResourcePath(url: string, config: ServeConfig, userAgent: string): Promise<string> {
  let searchPaths: string[] = [config.wwwDir];
  if (isUserAgentIOS(userAgent)) {
    searchPaths = IOS_PLATFORM_PATHS.map(resourcePath => path.join(config.rootDir, resourcePath));
  } else if (isUserAgentAndroid(userAgent)) {
    searchPaths = ANDROID_PLATFORM_PATHS.map(resourcePath => path.join(config.rootDir, resourcePath));
  }

  for (let i = 0; i < searchPaths.length; i++) {
    let checkPath = path.join(searchPaths[i], url);
    try {
      let result = await checkFile(checkPath);
      return searchPaths[i];
    } catch (e) { }
  }
}

/**
 * Checks if a file exists (responds to stat)
 */
function checkFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err: Error, stats: any) => {
      if (err) {
        return reject();
      }
      resolve();
    });
  });
}

function isUserAgentIOS(ua: string): boolean {
  ua = ua.toLowerCase();
  return (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('ipod') > -1);
}

function isUserAgentAndroid(ua: string): boolean {
  ua = ua.toLowerCase();
  return ua.indexOf('android') > -1;
}
