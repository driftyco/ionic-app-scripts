import { BuildContext } from './util/interfaces';
import { BuildError } from './util/errors';
import { emptyDirSync } from 'fs-extra';
import { Logger } from './logger/logger';


export function clean(context: BuildContext) {
  const logger = new Logger('clean');

  try {
    Logger.debug(`[Clean] clean: cleaning ${context.buildDir}`);

    emptyDirSync(context.buildDir);
    logger.finish();

  } catch (ex) {
    throw logger.fail(new BuildError(`Failed to clean directory ${context.buildDir} - ${ex.message}`));
  }

  return Promise.resolve();
}
