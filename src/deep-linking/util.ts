import { dirname, join } from 'path';
import { DeepLinkConfigEntry, HydratedDeepLinkConfigEntry } from '../util/interfaces';

/* this is a very temporary approach to extracting deeplink data since the Angular compiler API has changed a bit */

function getLinksArrayContent(appNgModuleFileContent: string) {
  const deepLinksContentMatches = LINKS_REGEX.exec(appNgModuleFileContent.toString());
  if (!deepLinksContentMatches || deepLinksContentMatches.length !== 2) {
    throw new Error('Could not locate links array in deep links config');
  }
  return deepLinksContentMatches[1];
}

export function extractDeepLinkPathData(appNgModuleFileContent: string) {
  const linksInternalContent = getLinksArrayContent(appNgModuleFileContent);
  const pathsList = extractRegexContent(appNgModuleFileContent, PATHS_REGEX);
  const namedExportsList = extractRegexContent(appNgModuleFileContent, EXPORT_REGEX);
  const nameList = extractRegexContent(appNgModuleFileContent, NAME_REGEX);

  console.log('pathsList: ', pathsList);
  console.log('namedExportsList: ', namedExportsList);
  console.log('nameList: ', nameList);

  const expectedLength = pathsList.length;
  if (namedExportsList.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} named exports in deep link config, found the following: ${namedExportsList.join(',')}`);
  }

  if (nameList.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} names in deep link config, found the following: ${nameList.join(',')}`);
  }

  // metadata looks legit, let's do some looping shall we
  const deepLinkConfig: DeepLinkConfigEntry[] = [];
  for (let i = 0; i < expectedLength; i++) {
    const path = pathsList[i];
    const namedExport = namedExportsList[i];
    const name = nameList[i];
    deepLinkConfig.push({modulePath: path, namedExport: namedExport, name: name});
  }
  return deepLinkConfig;
}

function extractRegexContent(content: string, regex: RegExp) {
  let match: RegExpExecArray = null;
  const results: string[] = [];
  while ((match = regex.exec(content))){
    if (!match) {
      console.log('break');
      break;
    }
    results.push(match[1]);
  }
  return results;
}

export function getDeepLinkData(appNgModuleFilePath: string, appNgModuleFileContent: string): HydratedDeepLinkConfigEntry[] {
  const deepLinkConfigList = extractDeepLinkPathData(appNgModuleFileContent);
  console.log('deepLinkConfigList: ', deepLinkConfigList);
  const appDirectory = dirname(appNgModuleFilePath);
  const hydratedDeepLinks = deepLinkConfigList.map(deepLinkConfigEntry => {
    return Object.assign({}, deepLinkConfigEntry, {
      absolutePath: join(appDirectory, deepLinkConfigEntry.modulePath + '.ts')
    }) as HydratedDeepLinkConfigEntry;
  });
  console.log('hydratedDeepLinks: ', hydratedDeepLinks);
  return hydratedDeepLinks;
}

const LINKS_REGEX = /links\s*?:\s*\[([\s|\S]*)\]/igm;
const PATHS_REGEX = /path\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
const EXPORT_REGEX = /namedExport\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
const NAME_REGEX = /name\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;