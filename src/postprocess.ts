import { Logger } from './logger/logger';
import { BuildContext } from './util/interfaces';
import { updateIndexHtml } from './core/inject-scripts';
import { purgeSourceMapsIfNeeded } from './util/source-maps';
import { removeUnusedFonts } from './optimization/remove-unused-fonts';


export function postprocess(context: BuildContext) {
  const logger = new Logger(`postprocess`);
  return postprocessWorker(context).then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      throw logger.fail(err);
    });
}


function postprocessWorker(context: BuildContext) {
  return Promise.all([
    purgeSourceMapsIfNeeded(context),
    removeUnusedFonts(context),
    updateIndexHtml(context)
  ]);
}
