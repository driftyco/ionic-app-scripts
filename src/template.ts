import { BuildContext, BuildState, ChangedFile, File } from './util/interfaces';
import { changeExtension } from './util/helpers';
import { Logger } from './logger/logger';
import { getJsOutputDest } from './bundle';
import { invalidateCache } from './rollup';
import { dirname, extname, join, parse, resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';


export function templateUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  try {
    const changedTemplates = changedFiles.filter(changedFile => changedFile.ext === '.html');
    const start = Date.now();
    const bundleOutputDest = getJsOutputDest(context);
    let bundleSourceText = readFileSync(bundleOutputDest, 'utf8');

    // update the corresponding transpiled javascript file with the template changed (inline it)
    // as well as the bundle
    for (const changedTemplateFile of changedTemplates) {
      const file = context.fileCache.get(changedTemplateFile.filePath);
      if (! updateCorrespondingJsFile(context, file.content, changedTemplateFile.filePath)) {
        throw new Error(`Failed to inline template ${changedTemplateFile.filePath}`);
      }
      bundleSourceText = replaceExistingJsTemplate(bundleSourceText, file.content, changedTemplateFile.filePath);
    }

    // invaldiate any rollup bundles, if they're not using rollup no harm done
    invalidateCache();

    // awesome, all good and template updated in the bundle file
    const logger = new Logger(`template update`);
    logger.setStartTime(start);

    writeFileSync(bundleOutputDest, bundleSourceText, { encoding: 'utf8'});

    // congrats, all gud
    changedTemplates.forEach(changedTemplate => {
      Logger.debug(`templateUpdate, updated: ${changedTemplate.filePath}`);
    });

    context.templateState = BuildState.SuccessfulBuild;
    logger.finish();
    resolve();

  } catch (ex) {
    Logger.debug(`templateUpdate error: ${ex.message}`);
    context.transpileState = BuildState.RequiresBuild;
    context.bundleState = BuildState.RequiresUpdate;
    return Promise.resolve();
  }
}

function updateCorrespondingJsFile(context: BuildContext, newTemplateContent: string, existingHtmlTemplatePath: string) {
  const javascriptFiles = context.fileCache.getAll().filter((file: File) => dirname(file.path) === dirname(existingHtmlTemplatePath) && extname(file.path) === '.js');
  for (const javascriptFile of javascriptFiles) {
    const newContent = replaceExistingJsTemplate(javascriptFile.content, newTemplateContent, existingHtmlTemplatePath);
    if (newContent && newContent !== javascriptFile.content) {
      javascriptFile.content = newContent;
      // set the file again to generate a new timestamp
      // do the same for the typescript file just to invalidate any caches, etc.
      context.fileCache.set(javascriptFile.path, javascriptFile);
      const typescriptFilePath = changeExtension(javascriptFile.path, '.ts');
      context.fileCache.set(typescriptFilePath, context.fileCache.get(typescriptFilePath));
      return true;
    }
  }
  return false;
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


export function replaceExistingJsTemplate(existingSourceText: string, newTemplateContent: string, htmlFilePath: string): string {
  let prefix = getTemplatePrefix(htmlFilePath);
  let startIndex = existingSourceText.indexOf(prefix);

  let isStringified = false;

  if (startIndex === -1) {
    prefix = stringify(prefix);
    isStringified = true;
  }

  startIndex = existingSourceText.indexOf(prefix);
  if (startIndex === -1) {
    return null;
  }

  let suffix = getTemplateSuffix(htmlFilePath);
  if (isStringified) {
    suffix = stringify(suffix);
  }

  const endIndex = existingSourceText.indexOf(suffix, startIndex + 1);
  if (endIndex === -1) {
    return null;
  }

  const oldTemplate = existingSourceText.substring(startIndex, endIndex + suffix.length);
  let newTemplate = getTemplateFormat(htmlFilePath, newTemplateContent);

  if (isStringified) {
    newTemplate = stringify(newTemplate);
  }

  let lastChange: string = null;
  while (existingSourceText.indexOf(oldTemplate) > -1 && existingSourceText !== lastChange) {
    lastChange = existingSourceText = existingSourceText.replace(oldTemplate, newTemplate);
  }

  return existingSourceText;
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
