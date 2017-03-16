import { generateContext } from './util/config';
import * as Constants from './util/constants';
import { BuildContext } from './util/interfaces';
import { hydrateRequest, getNgModules, GeneratorOption, GeneratorRequest, nonPageFileManipulation, generateTemplates } from './generators/util';

export { getNgModules, GeneratorOption, GeneratorRequest };

export function processPageRequest(context: BuildContext, name: string) {
  return generateTemplates(context, { type: 'page', name });
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
  const hydratedRequest = hydrateRequest(context, { type: 'tabs', name });

  return generateTemplates(context, hydratedRequest).then(() => {
    const promises = tabs.map((tab) => {
      return generateTemplates(context, { type: 'page', name: tab });
    });

    return Promise.all(promises);
  }).then(() => {
    // TODO: NgModule changes
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



