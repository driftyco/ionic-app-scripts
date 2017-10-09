import { extname, join } from 'path';

import { Logger } from '../logger/logger';
import * as Constants from '../util/constants';
import { getStringPropertyValue, readDirAsync, unlinkAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';


// For webapps, we pretty much need all fonts to be available because
// the web server deployment never knows which browser/platform is
// opening the app. Additionally, webapps will request fonts on-demand,
// so having them all sit in the www/assets/fonts directory doesn’t
// hurt anything if it’s never being requested.

// However, with Cordova, the entire directory gets bundled and
// shipped in the ipa/apk, but we also know exactly which platform
// is opening the webapp. For this reason we can safely delete font
// files we know would never be opened by the platform. So app-scripts
// will continue to copy all font files over, but the cordova build
// process would delete those we know are useless and just taking up
// space. End goal is that the Cordova ipa/apk filesize is smaller.

// Font Format Support:
// ttf: http://caniuse.com/#feat=ttf
// woff: http://caniuse.com/#feat=woff
// woff2: http://caniuse.com/#feat=woff2
export function removeUnusedFonts(context: BuildContext): Promise<any> {
  const fontDir = getStringPropertyValue(Constants.ENV_VAR_FONTS_DIR);
  return readDirAsync(fontDir).then((fileNames: string[]) => {
    fileNames = fileNames.sort();
    const toPurge = getFontFileNamesToPurge(context.target, context.platform, fileNames);
    const fullPaths = toPurge.map(fileName => join(fontDir, fileName));
    const promises = fullPaths.map(fullPath => unlinkAsync(fullPath));
    return Promise.all(promises);
  });
}

export function getFontFileNamesToPurge(target: string, platform: string, fileNames: string[]): string[] {
  if (target !== Constants.CORDOVA) {
    return [];
  }
  const filesToDelete = new Set<string>();
  for (const fileName of fileNames) {
    if (platform === 'android') {
      // remove noto-sans, roboto, and non-woff ionicons
      if (fileName.startsWith('noto-sans') || fileName.startsWith('roboto') || (isIonicons(fileName) && !isWoof(fileName))) {
        filesToDelete.add(fileName);
      }
    } else if (platform === 'ios') {
      // remove noto-sans, non-woff ionicons
      if (fileName.startsWith('noto-sans') || (fileName.startsWith('roboto') && !isWoof(fileName)) || (isIonicons(fileName) && !isWoof(fileName))) {
        filesToDelete.add(fileName);
      }
    }
    // for now don't bother deleting anything for windows, need to get some info first

  }
  return Array.from(filesToDelete);
}

function isIonicons(fileName: string) {
  return fileName.startsWith('ionicons');
}

// woof woof
function isWoof(fileName: string) {
  return extname(fileName) === '.woff' || extname(fileName) === '.woff2';
}
