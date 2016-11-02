import * as path from 'path';
import { injectNotificationScript } from './injector';
import { injectLiveReloadScript } from './live-reload';
import * as express from 'express';
import * as fs from 'fs';
import * as url from 'url';
import { ServeConfig, LOGGER_DIR } from './serve-config';
import { Logger } from '../util/logger';
import { promisify } from '../util/promisify';
import * as proxyMiddleware from 'proxy-middleware';
import { getProjectJson, IonicProject } from '../util/ionic-project';

const readFilePromise = promisify<Buffer, string>(fs.readFile);

/**
 * Create HTTP server
 */
export function createHttpServer(config: ServeConfig): express.Application {

  const app = express();
  app.set('serveConfig', config);
  app.listen(config.httpPort, config.host, function() {
    Logger.info(`listening on ${config.httpPort}`);
  });

  app.get('/', serveIndex);
  app.use('/', express.static(config.rootDir));
  app.use(`/${LOGGER_DIR}`, express.static(path.join(__dirname, '..', '..', 'bin')));
  app.get('/cordova.js', serveCordovaJS);

  if (config.useProxy) {
    setupProxies(app);
  }

  return app;
}

function setupProxies(app: express.Application) {

  getProjectJson().then(function(projectConfig: IonicProject) {
    for (const proxy of projectConfig.proxies || []) {
      var opts: any = url.parse(proxy.proxyUrl);
      if (proxy.proxyNoAgent) {
        opts.agent = false;
      }

      opts.rejectUnauthorized = !(proxy.rejectUnauthorized === false);

      app.use(proxy.path, proxyMiddleware(opts));
      Logger.info('Proxy added:', proxy.path + ' => ' + url.format(opts));
    }
  });
}

/**
 * http responder for /index.html base entrypoint
 */
function serveIndex(req: express.Request, res: express.Response)  {
  const config: ServeConfig = req.app.get('serveConfig');
  let htmlFile = path.join(req.app.get('serveConfig').rootDir, 'index.html');

  readFilePromise(htmlFile).then((content: Buffer) => {
    if (config.useLiveReload) {
      content = injectLiveReloadScript(content, config.host, config.liveReloadPort);
    }
    if (config.useNotifier) {
      content = injectNotificationScript(content, config.notifyOnConsoleLog, config.notificationPort);
    }

    // File found so lets send it back to the response
    res.set('Content-Type', 'text/html');
    res.send(content);
  });
}

/**
 * http responder for cordova.js fiel
 */
function serveCordovaJS(req: express.Request, res: express.Response) {
  res.set('Content-Type', 'application/javascript');
  res.send('// mock cordova file during development');
}