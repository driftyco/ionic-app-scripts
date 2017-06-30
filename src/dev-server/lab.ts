import * as path from 'path';

import { buildCordovaConfig, CordovaProject } from '../util/cordova-config';

/**
 * Main Lab app view
 */
export let LabAppView = (req: any, res: any) => {
  return res.sendFile('index.html', {root: path.join(__dirname, '..', '..', 'lab')});
};

export let ApiCordovaProject = (req: any, res: any) => {
  buildCordovaConfig((err: any) => {
    res.status(400).json({ status: 'error', message: 'Unable to load config.xml' });
  }, (config: CordovaProject) => {
    res.json(config);
  });
};

export let ApiPackageJson = (req: any, res: any) => {
  res.sendFile(path.join(process.cwd(), 'package.json'), {
    headers: {
      'content-type': 'application/json'
    }
  })
};
