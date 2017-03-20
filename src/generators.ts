import { relative, dirname } from 'path';
import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import { readFileAsync, writeFileAsync } from './util/helpers';
import { hydrateRequest, hydrateTabRequest, getNgModules, GeneratorOption, GeneratorRequest, nonPageFileManipulation, generateTemplates } from './generators/util';
import { insertNamedImportIfNeeded, appendNgModuleDeclaration } from './util/typescript-utils';

export { getNgModules, GeneratorOption, GeneratorRequest };

export function processPageRequest(context: BuildContext, name: string) {
  const hydratedRequest = hydrateRequest(context, { type: 'page', name });
  return generateTemplates(context, hydratedRequest);
}

export function processPipeRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'pipe');
}

export function processDirectiveRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'directive');
}

export function processComponentRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'component');
}

export function processProviderRequest(context: BuildContext, name: string, ngModulePath: string) {
  return nonPageFileManipulation(context, name, ngModulePath, 'provider');
}

export function processTabsRequest(context: BuildContext, name: string, tabs: string[]) {
  const tabHydratedRequests = tabs.map((tab) => hydrateRequest(context, { type: 'page', name: tab }));
  const hydratedRequest = hydrateTabRequest(context, { type: 'tabs', name, tabs: tabHydratedRequests });

  return generateTemplates(context, hydratedRequest).then(() => {
    const promises = tabHydratedRequests.map((hydratedRequest) => {
      return generateTemplates(context, hydratedRequest);
    });

    return Promise.all(promises);
  }).then((tabs) => {
    const ngModulePath = tabs[0].find((element): boolean => {
      return element.indexOf('module') !== -1;
    });
    const tabsNgModulePath = `${hydratedRequest.dirToWrite}/${hydratedRequest.fileName}.module.ts`;

    readFileAsync(tabsNgModulePath).then((content) => {
      let fileContent = content;
      fileContent = insertNamedImportIfNeeded(tabsNgModulePath, fileContent, tabHydratedRequests[0].className, relative(dirname(tabsNgModulePath), ngModulePath.replace('.module.ts', '')));
      fileContent = appendNgModuleDeclaration(tabsNgModulePath, fileContent, tabHydratedRequests[0].className);

      writeFileAsync(tabsNgModulePath, fileContent);
    });
  });
}

export function listOptions() {
  const list: GeneratorOption[] = [];
  list.push({type: Constants.COMPONENT, multiple: false});
  list.push({type: Constants.DIRECTIVE, multiple: false});
  list.push({type: Constants.PAGE, multiple: false});
  list.push({type: Constants.PIPE, multiple: false});
  list.push({type: Constants.PROVIDER, multiple: false});
  list.push({type: Constants.TABS, multiple: true});
  return list;
}



