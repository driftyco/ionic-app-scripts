import { IonicEnvironmentPlugin } from './ionic-environment-plugin';
import { getContext } from '../util/helpers';

export function getIonicEnvironmentPlugin() {
  const context = getContext();
  return new IonicEnvironmentPlugin(context.fileCache);
}