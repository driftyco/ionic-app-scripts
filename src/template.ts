import { emit, EventType } from './util/events';
import { BUNDLER_WEBPACK } from './util/config';
import { BuildContext } from './util/interfaces';
import { BuildError, IgnorableError, Logger } from './util/logger';
import { bundleUpdate, getJsOutputDest } from './bundle';
import { dirname, extname, join, parse, resolve } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { sassUpdate } from './sass';
import { buildUpdate } from './build';


export function templateUpdate(event: string, filePath: string, context: BuildContext) {
  const logger = new Logger('template update');

  return templateUpdateWorker(event, filePath, context)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      if (err instanceof IgnorableError) {
        throw err;
      }
      throw logger.fail(err);
    });
}


function templateUpdateWorker(event: string, filePath: string, context: BuildContext) {
  Logger.debug(`templateUpdate, event: ${event}, path: ${filePath}`);

  if (event === 'change') {
    if (context.bundler === BUNDLER_WEBPACK) {
      Logger.debug(`templateUpdate: updating webpack file`);
      const typescriptFile = getTemplatesTypescriptFile(context, filePath);
      if (typescriptFile && typescriptFile.length > 0) {
        return buildUpdate(event, typescriptFile, context);
      }
    } else if (updateBundledJsTemplate(context, filePath)) {
      Logger.debug(`templateUpdate, updated js bundle, path: ${filePath}`);
      // technically, the bundle has changed so emit an event saying so
      emit(EventType.FileChange, getJsOutputDest(context));
      return Promise.resolve();
    }
  }

  Logger.debug('templateUpdateWorker: Can\'t update template, doing a full rebuild');
  // not sure how it changed, just do a full rebuild without the bundle cache
  context.useBundleCache = false;
  return bundleUpdate(event, filePath, context)
    .then(() => {
      context.useSassCache = true;
      return sassUpdate(event, filePath, context);
    })
    .catch(err => {
      if (err instanceof IgnorableError) {
        throw err;
      }
      throw new BuildError(err);
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


function updateBundledJsTemplate(context: BuildContext, htmlFilePath: string) {
  Logger.debug(`updateBundledJsTemplate, start: ${htmlFilePath}`);

  const outputDest = getJsOutputDest(context);

  try {
    let bundleSourceText = readFileSync(outputDest, 'utf8');
    let newTemplateContent = readFileSync(htmlFilePath, 'utf8');

    bundleSourceText = replaceBundleJsTemplate(bundleSourceText, newTemplateContent, htmlFilePath);

    if (bundleSourceText) {
      writeFileSync(outputDest, bundleSourceText, { encoding: 'utf8'});
      Logger.debug(`updateBundledJsTemplate, updated: ${htmlFilePath}`);
      return true;
    }

  } catch (e) {
    Logger.debug(`updateBundledJsTemplate error: ${e}`);
  }

  return false;
}

function getTemplatesTypescriptFile(context: BuildContext, templatePath: string) {
  try {
    const srcDirName = dirname(templatePath);
    const files = readdirSync(srcDirName);
    const typescriptFilesNames = files.filter(file => {
      return extname(file) === '.ts';
    });
    for (const fileName of typescriptFilesNames) {
      const fullPath = join(srcDirName, fileName);
      const fileContent = readFileSync(fullPath).toString();
      const isMatch = tryToMatchTemplateUrl(fileContent, fullPath, srcDirName, templatePath);
      if (isMatch) {
        return fullPath;
      }
    }
    return null;
  } catch (ex) {
    Logger.debug('getTemplatesTypescriptFile: Error occurred - ', ex.message);
    return null;
  }
}

function tryToMatchTemplateUrl(fileContent: string, filePath: string, componentDirPath: string, templateFilePath: string) {
  let lastMatch: string = null;
  let match: TemplateUrlMatch;

  while (match = getTemplateMatch(fileContent)) {
    if (match.component === lastMatch) {
      // panic! we don't want to melt any machines if there's a bug
      Logger.debug(`Error matching component: ${match.component}`);
      return false;
    }
    lastMatch = match.component;

    if (!match.templateUrl || match.templateUrl === '') {
      Logger.error(`Error @Component templateUrl missing in: "${filePath}"`);
      return false;
    }

    const templatUrlPath = resolve(join(componentDirPath, match.templateUrl));
    if (templatUrlPath === templateFilePath) {
      return true;
    }
  }
  return false;
}

export function replaceBundleJsTemplate(bundleSourceText: string, newTemplateContent: string, htmlFilePath: string): string {
  const prefix = getTemplatePrefix(htmlFilePath);
  const startIndex = bundleSourceText.indexOf(prefix);

  if (startIndex === -1) {
    return null;
  }

  const suffix = getTemplateSuffix(htmlFilePath);
  const endIndex = bundleSourceText.indexOf(suffix, startIndex + 1);

  if (endIndex === -1) {
    return null;
  }

  const oldTemplate = bundleSourceText.substring(startIndex, endIndex + suffix.length);
  const newTemplate = getTemplateFormat(htmlFilePath, newTemplateContent);

  let lastChange: string = null;
  while (bundleSourceText.indexOf(oldTemplate) > -1 && bundleSourceText !== lastChange) {
    lastChange = bundleSourceText = bundleSourceText.replace(oldTemplate, newTemplate);
  }

  return bundleSourceText;
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
