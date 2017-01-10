/* this is a very temporary approach to extracting deeplink data since the Angular compiler API has changed a bit */

export function extractDeepLinkPathData(appNgModuleFileContent: string) {
  const matches = PATHS_REGEX.exec(appNgModuleFileContent);
  console.log('matches: ', matches);
  for (const match of matches) {
    //console.log('match: ', match);
  }
}

const PATHS_REGEX = /path\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;