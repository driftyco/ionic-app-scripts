import * as path from 'path';
import * as fs from 'fs';
import { promisify } from './promisify';

export interface IonicProject {
  name: string;
  email: string;
  app_id: string;
  proxies: {
    path: string,
    proxyUrl: string,
    proxyNoAgent: boolean,
    rejectUnauthorized: boolean
  }[];
}

const readFilePromise = promisify<Buffer, string>(fs.readFile);

export function getProjectJson(): Promise<IonicProject> {
  const projectFile = path.join(process.cwd(), 'ionic.config.json');

  return readFilePromise(projectFile).then(function(textString) {
    return JSON.parse(textString.toString());
  });
}
