import { BuildContext, BuildState } from './util/interfaces';
import { Logger } from './logger/logger';
import { getJsOutputDest } from './bundle';
import { join, parse, resolve } from 'path';
import { readFileSync, writeFile } from 'fs';


export function templateUpdate(event: string, htmlFilePath: string, context: BuildContext) {
  return new Promise((resolve) => {
    const start = Date.now();
    const bundleOutputDest = getJsOutputDest(context);

    function failed() {
      context.transpileState = BuildState.RequiresBuild;
      context.bundleState = BuildState.RequiresUpdate;
      resolve();
    }

    try {
      let bundleSourceText = readFileSync(bundleOutputDest, 'utf8');
      let newTemplateContent = readFileSync(htmlFilePath, 'utf8');

      bundleSourceText = replaceBundleJsTemplate(bundleSourceText, newTemplateContent, htmlFilePath);

      if (bundleSourceText) {
        // awesome, all good and template updated in the bundle file
        const logger = new Logger(`template update`);
        logger.setStartTime(start);

        writeFile(bundleOutputDest, bundleSourceText, { encoding: 'utf8'}, (err) => {
          if (err) {
            // eww, error saving
            logger.fail(err);
            failed();

          } else {
            // congrats, all gud
            Logger.debug(`updateBundledJsTemplate, updated: ${htmlFilePath}`);
            context.templateState = BuildState.SuccessfulBuild;
            logger.finish();
            resolve();
          }
        });

      } else {
        failed();
      }

    } catch (e) {
      Logger.debug(`updateBundledJsTemplate error: ${e}`);
      failed();
    }
  });
}


export function inlineTemplate(sourceText: string, sourcePath: string): string {
  const componentDir = parse(sourcePath).dir;
  let match: TemplateUrlMatch;
  let replacement: string;
  let lastMatch: string = null;

  while (match = getTemplateMatch(sourceText)) {
    if (match.component === lastMatch) {
      // panic! we don't want to melt any machines if there's a bug
      Logger.debug(`Error matching component: ${match.component}`);
      return sourceText;
    }
    lastMatch = match.component;

    if (match.templateUrl === '') {
      Logger.error(`Error @Component templateUrl missing in: "${sourcePath}"`);
      return sourceText;
    }

    replacement = updateTemplate(componentDir, match);
    if (replacement) {
      sourceText = sourceText.replace(match.component, replacement);
    }
  }

  return sourceText;
}


export function updateTemplate(componentDir: string, match: TemplateUrlMatch): string {
  const htmlFilePath = join(componentDir, match.templateUrl);

  try {
    const templateContent = readFileSync(htmlFilePath, 'utf8');
    return replaceTemplateUrl(match, htmlFilePath, templateContent);
  } catch (e) {
    Logger.error(`template error, "${htmlFilePath}": ${e}`);
  }

  return null;
}


export function replaceTemplateUrl(match: TemplateUrlMatch, htmlFilePath: string, templateContent: string): string {
  const orgTemplateProperty = match.templateProperty;
  const newTemplateProperty = getTemplateFormat(htmlFilePath, templateContent);

  return match.component.replace(orgTemplateProperty, newTemplateProperty);
}


export function replaceBundleJsTemplate(bundleSourceText: string, newTemplateContent: string, htmlFilePath: string): string {
  let prefix = getTemplatePrefix(htmlFilePath);
  let startIndex = bundleSourceText.indexOf(prefix);

  let isStringified = false;

  if (startIndex === -1) {
    prefix = stringify(prefix);
    isStringified = true;
  }

  startIndex = bundleSourceText.indexOf(prefix);
  if (startIndex === -1) {
    return null;
  }

  let suffix = getTemplateSuffix(htmlFilePath);
  if (isStringified) {
    suffix = stringify(suffix);
  }

  const endIndex = bundleSourceText.indexOf(suffix, startIndex + 1);
  if (endIndex === -1) {
    return null;
  }

  const oldTemplate = bundleSourceText.substring(startIndex, endIndex + suffix.length);
  let newTemplate = getTemplateFormat(htmlFilePath, newTemplateContent);

  if (isStringified) {
    newTemplate = stringify(newTemplate);
  }

  let lastChange: string = null;
  while (bundleSourceText.indexOf(oldTemplate) > -1 && bundleSourceText !== lastChange) {
    lastChange = bundleSourceText = bundleSourceText.replace(oldTemplate, newTemplate);
  }

  return bundleSourceText;
}

function stringify(str: string) {
  str = JSON.stringify(str);
  return str.substr(1, str.length - 2);
}


export function getTemplateFormat(htmlFilePath: string, content: string) {
  // turn the template into one line and espcape single quotes
  content = content.replace(/\r|\n/g, '\\n');
  content = content.replace(/\'/g, '\\\'');

  return `${getTemplatePrefix(htmlFilePath)}'${content}'${getTemplateSuffix(htmlFilePath)}`;
}


function getTemplatePrefix(htmlFilePath: string) {
  return `template:/*ion-inline-start:"${resolve(htmlFilePath)}"*/`;
}


function getTemplateSuffix(htmlFilePath: string) {
  return `/*ion-inline-end:"${resolve(htmlFilePath)}"*/`;
}


export function getTemplateMatch(str: string): TemplateUrlMatch {
  const match = COMPONENT_REGEX.exec(str);
  if (match) {
    return {
      start: match.index,
      end: match.index + match[0].length,
      component: match[0],
      templateProperty: match[3],
      templateUrl: match[5].trim()
    };
  }
  return null;
}


const COMPONENT_REGEX = /Component\s*?\(\s*?(\{([\s\S]*?)(\s*templateUrl\s*:\s*(['"`])(.*?)(['"`])\s*?)([\s\S]*?)}\s*?)\)/m;

export interface TemplateUrlMatch {
  start: number;
  end: number;
  component: string;
  templateProperty: string;
  templateUrl: string;
}
