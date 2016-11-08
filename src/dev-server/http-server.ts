import * as path from 'path';
import { injectNotificationScript } from './injector';
import { injectLiveReloadScript } from './live-reload';
import * as express from 'express';
import * as fs from 'fs';
import * as url from 'url';
import { ServeConfig, LOGGER_DIR } from './serve-config';
import { Logger } from '../util/logger';
import * as proxyMiddleware from 'proxy-middleware';
import { injectDiagnosticsHtml } from '../util/logger-diagnostics';
import { getProjectJson, IonicProject } from '../util/ionic-project';


/**
 * Create HTTP server
 */
export function createHttpServer(config: ServeConfig): express.Application {

  const app = express();
  app.set('serveConfig', config);
  app.listen(config.httpPort, config.host, function() {
    Logger.debug(`listening on ${config.httpPort}`);
  });

  app.get('/', serveIndex);
  app.use('/', express.static(config.wwwDir));
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

  // respond with the index.html file
  const indexFileName = path.join(config.wwwDir, 'index.html');
  fs.readFile(indexFileName, (err, indexHtml) => {
    if (config.useLiveReload) {
      indexHtml = injectLiveReloadScript(indexHtml, config.host, config.liveReloadPort);
    }

    if (config.useNotifier) {
      indexHtml = injectNotificationScript(indexHtml, config.notifyOnConsoleLog, config.notificationPort);
    }

    indexHtml = injectDiagnosticsHtml(config.buildDir, indexHtml);

    res.set('Content-Type', 'text/html');
    res.send(indexHtml);
  });
}

/**
 * http responder for cordova.js file
 */
function serveCordovaJS(req: express.Request, res: express.Response) {
  res.set('Content-Type', 'application/javascript');
  res.send('// mock cordova file during development');
}
