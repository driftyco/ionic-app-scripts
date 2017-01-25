import * as serve from './serve';
import * as config from './util/config';
import { BuildContext } from './util/interfaces';
import { ServeConfig } from './dev-server/serve-config';

import * as watch from './watch';
import * as open from './util/open';
import * as notificationServer from './dev-server/notification-server';
import * as httpServer from './dev-server/http-server';
import * as liveReloadServer from './dev-server/live-reload';
import * as network from './util/network';

describe('test serve', () => {
  let configResults: ServeConfig;
  let context: BuildContext;

  beforeEach(() => {
    context = {
      rootDir: '/',
      wwwDir: '/www',
      buildDir: '/build',
    };
    configResults = {
      httpPort: 8100,
      host: '0.0.0.0',
      rootDir: '/',
      wwwDir: '/www',
      buildDir: '/build',
      isCordovaServe: false,
      launchBrowser: true,
      launchLab: false,
      browserToLaunch: null,
      useLiveReload: true,
      liveReloadPort: 35729,
      notificationPort: 53703,
      useServerLogs: false,
      useProxy: true,
      notifyOnConsoleLog: false
    };
    spyOn(network, 'findClosestOpenPort').and.callFake((host: string, port: number) => Promise.resolve(port));
    spyOn(notificationServer, 'createNotificationServer');
    spyOn(liveReloadServer, 'createLiveReloadServer');
    spyOn(httpServer, 'createHttpServer');
    spyOn(watch, 'watch').and.returnValue(Promise.resolve());
    spyOn(open, 'default');
  });

  it('should work with no args on a happy path', () => {
    return serve.serve(context).then(() => {
      expect(network.findClosestOpenPort).toHaveBeenCalledWith('0.0.0.0', 53703);
      expect(notificationServer.createNotificationServer).toHaveBeenCalledWith(configResults);
      expect(liveReloadServer.createLiveReloadServer).toHaveBeenCalledWith(configResults);
      expect(httpServer.createHttpServer).toHaveBeenCalledWith(configResults);
      expect(open.default).toHaveBeenCalledWith('http://localhost:8100', null);
    });
  });

  it('should include ionicplatform in the browser url if platform is passed', () => {
    config.addArgv('--platform');
    config.addArgv('android');

    return serve.serve(context).then(() => {
      expect(network.findClosestOpenPort).toHaveBeenCalledWith('0.0.0.0', 53703);
      expect(notificationServer.createNotificationServer).toHaveBeenCalledWith(configResults);
      expect(liveReloadServer.createLiveReloadServer).toHaveBeenCalledWith(configResults);
      expect(httpServer.createHttpServer).toHaveBeenCalledWith(configResults);
      expect(open.default).toHaveBeenCalledWith('http://localhost:8100?ionicplatform=android', null);
    });
  })

  it('all args should be set in the config object and should be passed on to server functions', () => {
    config.setProcessArgs([]);
    config.addArgv('--serverlogs');
    configResults.useServerLogs = true;
    config.addArgv('--consolelogs');
    configResults.notifyOnConsoleLog = true;
    config.addArgv('--noproxy');
    configResults.useProxy = false;
    config.addArgv('--nolivereload');
    configResults.useLiveReload = false;
    config.addArgv('--lab');
    configResults.launchLab = true;
    config.addArgv('--browser');
    config.addArgv('safari');
    configResults.browserToLaunch = 'safari';
    config.addArgv('--port');
    config.addArgv('8101');
    configResults.httpPort = 8101;
    config.addArgv('--address');
    config.addArgv('127.0.0.1');
    configResults.host = '127.0.0.1';
    config.addArgv('--livereload-port');
    config.addArgv('35729');
    configResults.liveReloadPort = 35729;
    config.addArgv('--dev-logger-port');
    config.addArgv('53703');
    configResults.notificationPort = 53703;

    return serve.serve(context).then(() => {
      expect(network.findClosestOpenPort).toHaveBeenCalledWith('127.0.0.1', 53703);
      expect(notificationServer.createNotificationServer).toHaveBeenCalledWith(configResults);
      expect(liveReloadServer.createLiveReloadServer).toHaveBeenCalledWith(configResults);
      expect(httpServer.createHttpServer).toHaveBeenCalledWith(configResults);
      expect(open.default).toHaveBeenCalledWith('http://127.0.0.1:8101/ionic-lab', 'safari');
    });
  });
});
