import { BuildContext } from '../util/interfaces';
import { buildIonicGlobal } from './ionic-global';
import { readFileAsync, writeFileAsync } from '../util/helpers';
import { join } from 'path';


export function updateIndexHtml(context: BuildContext) {
  const indexPath = join(context.wwwDir, context.wwwIndex);

  return readFileAsync(indexPath).then(indexHtml => {
    if (!indexHtml) {
      return Promise.resolve(null);
    }

    indexHtml = injectCoreScripts(context, indexHtml);

    return writeFileAsync(indexPath, indexHtml);
  });
}


export function injectCoreScripts(context: BuildContext, indexHtml: string) {
  const inject = [];

  inject.push(`  <script data-ionic="inject">`);

  inject.push(`    ${buildIonicGlobal(context)}`);

  inject.push(`  </script>`);

  return injectCoreHtml(indexHtml, inject.join('\n'));
}


export function injectCoreHtml(indexHtml: string, inject: string) {
  // see if we can find an existing ionic script tag and replace it entirely
  const existingTag = indexHtml.match(/<script data-ionic="inject">[\s\S]*<\/script>/gi);
  if (existingTag) {
    return indexHtml.replace(existingTag[0], inject.trim());
  }

  // see if we can find the head tag and inject it immediate below it
  const headTag = indexHtml.match(/<head[^>]*>/gi);
  if (headTag) {
    return indexHtml.replace(headTag[0], `${headTag[0]}\n${inject}`);
  }

  // see if we can find the html tag and inject it immediate below it
  const htmlTag = indexHtml.match(/<html[^>]*>/gi);
  if (htmlTag) {
    return indexHtml.replace(htmlTag[0], `${htmlTag[0]}\n${inject}`);
  }

  return `${inject}\n${indexHtml}`;
}
