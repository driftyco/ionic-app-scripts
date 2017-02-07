import { dirname, join } from 'path';
import { DeepLinkConfigEntry, HydratedDeepLinkConfigEntry } from '../util/interfaces';

/* this is a very temporary approach to extracting deeplink data since the Angular compiler API has changed a bit */

function getLinksArrayContent(appNgModuleFileContent: string) {
  const deepLinksContentMatches = LINKS_REGEX.exec(appNgModuleFileContent.toString());
  if (deepLinksContentMatches && deepLinksContentMatches.length === 2) {
    return deepLinksContentMatches[1];
  }
  return null;
}

export function extractDeepLinkPathData(appNgModuleFileContent: string) {
  const linksInternalContent = getLinksArrayContent(appNgModuleFileContent);
  if (!linksInternalContent) {
    return null;
  }
  const pathsList = extractRegexContent(appNgModuleFileContent, LOAD_CHILDREN_REGEX);
  const nameList = extractRegexContent(appNgModuleFileContent, NAME_REGEX);

  const expectedLength = pathsList.length;

  if (nameList.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} names in deep link config, found the following: ${nameList.join(',')}`);
  }

  // metadata looks legit, let's do some looping shall we
  const deepLinkConfig: DeepLinkConfigEntry[] = [];
  for (let i = 0; i < expectedLength; i++) {
    const moduleAndExport = pathsList[i].split('#');
    const path = moduleAndExport[0];
    const namedExport = moduleAndExport[1];
    const name = nameList[i];
    deepLinkConfig.push({modulePath: path, namedExport: namedExport, name: name});
  }
  return deepLinkConfig;
}

function extractRegexContent(content: string, regex: RegExp) {
  let match: RegExpExecArray = null;
  const results: string[] = [];
  while ((match = regex.exec(content))) {
    if (!match) {
      break;
    }
    results.push(match[1]);
  }
  return results;
}

export function getDeepLinkData(appNgModuleFilePath: string, appNgModuleFileContent: string, isAot: boolean): HydratedDeepLinkConfigEntry[] {
  const deepLinkConfigList = extractDeepLinkPathData(appNgModuleFileContent);
  if (!deepLinkConfigList) {
    return [];
  }
  const appDirectory = dirname(appNgModuleFilePath);
  const absolutePathSuffix = isAot ? '.ngfactory.ts' : '.ts';
  const modulePathSuffix = isAot ? '.ngfactory' : '';
  const namedExportSuffix = isAot ? 'NgFactory' : '';
  const hydratedDeepLinks = deepLinkConfigList.map(deepLinkConfigEntry => {
    return Object.assign({}, deepLinkConfigEntry, {
      modulePath: deepLinkConfigEntry.modulePath + modulePathSuffix,
      namedExport: deepLinkConfigEntry.namedExport + namedExportSuffix,
      absolutePath: join(appDirectory, deepLinkConfigEntry.modulePath + absolutePathSuffix)
    }) as HydratedDeepLinkConfigEntry;
  });
  return hydratedDeepLinks;
}

const LINKS_REGEX = /links\s*?:\s*\[([\s|\S]*)\]/igm;
const LOAD_CHILDREN_REGEX = /loadChildren\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
const NAME_REGEX = /name\s*?:\s*?['"`]\s*?(.*?)['"`]/igm;
