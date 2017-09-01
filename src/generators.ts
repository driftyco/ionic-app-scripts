import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import { hydrateRequest, hydrateTabRequest, getNgModules, GeneratorOption, GeneratorRequest, nonPageFileManipulation, generateTemplates, tabsModuleManipulation } from './generators/util';

export { getNgModules, GeneratorOption, GeneratorRequest };

export function processPageRequest(context: BuildContext, name: string, commandOptions?: { module?: boolean; constants?: boolean; }) {
  if (commandOptions) {
    const hydratedRequest = hydrateRequest(context, { type: 'page', name, includeNgModule: commandOptions.module });
    return generateTemplates(context, hydratedRequest, commandOptions.constants);
  }else {
    const hydratedRequest = hydrateRequest(context, { type: 'page', name, includeNgModule: false });
    return generateTemplates(context, hydratedRequest);
  }
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

export function processTabsRequest(context: BuildContext, name: string, tabs: any[],  commandOptions?: { module?: boolean; constants?: boolean; }) {

  const includePageConstants = commandOptions ? commandOptions.constants : false;
  const includeNgModule = commandOptions ? commandOptions.module : false;

  const tabHydratedRequests = tabs.map((tab) => hydrateRequest(context, { type: 'page', name: tab, includeNgModule}));
  const hydratedRequest = hydrateTabRequest(context, { type: 'tabs', name, includeNgModule, tabs: tabHydratedRequests });

  return generateTemplates(context, hydratedRequest, includePageConstants).then(() => {
    const promises = tabHydratedRequests.map((hydratedRequest) => {
      return generateTemplates(context, hydratedRequest, includePageConstants);
    });

    return Promise.all(promises);
  }).then((tabs) => {
    tabsModuleManipulation(tabs, hydratedRequest, tabHydratedRequests);
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



