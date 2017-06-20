import { getConfigValue, setProcessEnvVar, getProcessEnvVar } from '../../util/config';
import { join } from 'path';
import { BuildContext } from '../../util/interfaces';
import { Logger } from '../../logger/logger';
import { ENV_VAR_APP_SCRIPTS_DIR } from '../../util/constants';
import * as Constants from './constants';


export function initVendorConfig(context: BuildContext ): BuildContext {
  // keep same style as in original config.ts file

  context.fileNamePattern = getConfigValue(context, '--fileNamePattern', null, Constants.ENV_FILE_NAME_PATTERN, null, null);
  setProcessEnvVar(Constants.ENV_FILE_NAME_PATTERN, context.fileNamePattern);
  Logger.debug(`File name pattern set to ${context.fileNamePattern}`);

  const fileNameLoaderPath = join(getProcessEnvVar(ENV_VAR_APP_SCRIPTS_DIR), 'dist', 'custom', 'webpack', 'file-name-ts-loader.js');
  setProcessEnvVar(Constants.ENV_CUSTOM_TS_LOADER, fileNameLoaderPath);
  Logger.debug(`Custom ts loader set to ${fileNameLoaderPath}`);

  return context;
}
