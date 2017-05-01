import { Logger } from './logger/logger';
import { getSystemData, readFileAsync, writeFileAsync } from './util/helpers';
import { BuildContext } from './util/interfaces';
import { purgeSourceMapsIfNeeded } from './util/source-maps';
import { removeUnusedFonts } from './optimization/remove-unused-fonts';
import * as path from 'path';


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
    addIonicGlobal(context),
    purgeSourceMapsIfNeeded(context),
    removeUnusedFonts(context)
  ]);
}


function addIonicGlobal(context: BuildContext) {
  const outputFilePath = path.join(context.buildDir, context.outputJsFileName);

  return readFileAsync(outputFilePath).then(outputContent => {
    const ionicGlobal = buildIonicGlobal(context);

    if (outputContent.indexOf(ionicGlobal) === -1) {
      outputContent += ionicGlobal;
      return writeFileAsync(outputFilePath, outputContent);
    }
  });
}


function buildIonicGlobal(context: BuildContext) {
  if ((<any>context).windowIonic) {
    // just a quick way to cache this to avoid unnecessary readFiles
    return (<any>context).windowIonic;
  }

  const systemData = getSystemData(context.rootDir);

  let output = `
    (function(w){
      var i = w.Ionic = w.Ionic || {};
      ${systemData.ionicFramework ? `i.version = '${systemData.ionicFramework}';` : ''}
      ${systemData.angularCore ? `i.angular = '${systemData.angularCore}';` : ''}
      ${systemData.ionicNative ? `i.ionicNative = '${systemData.ionicNative}';` : ''}
    })(window);`;

  // real quick minification hack
  output = output.replace(/\s/g, '');
  output = output.replace('vari=', 'var i=');

  return (<any>context).windowIonic = `\n\n${output}`;
}
