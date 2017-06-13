import { Logger } from '../logger/logger';
import { getProjectJson } from '../util/ionic-project';
import { ServeConfig } from './serve-config';

export function createBonjourService(config: ServeConfig) {
  if (!config.devapp) {
    return;
  }
  getProjectJson()
    .then(project => project.name)
    .catch(() => 'ionic-app-scripts')
    .then(projectName => {
      try {
        const bonjour = require('bonjour')();
        const name = projectName + ':' + config.httpPort;
        bonjour.publish({
          name: name,
          type: 'ionicdev',
          port: config.httpPort
        });
        Logger.info(`publishing devapp service (${name})`);

      } catch (e) {
        Logger.warn('bonjour failed when trying to publish service');
        Logger.debug(e);
      }
    });
}
