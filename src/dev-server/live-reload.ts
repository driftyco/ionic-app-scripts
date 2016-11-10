import { hasDiagnostics } from '../util/logger-diagnostics';
import * as path from 'path';
import * as tinylr from 'tiny-lr';
import { ServeConfig } from './serve-config';
import * as events from '../util/events';


export function createLiveReloadServer(config: ServeConfig) {
  const liveReloadServer = tinylr();
  liveReloadServer.listen(config.liveReloadPort, config.host);

  function fileChange(filePath: string | string[]) {
    // only do a live reload if there are no diagnostics
    // the notification server takes care of showing diagnostics
    if (!hasDiagnostics(config.buildDir)) {
      const files = Array.isArray(filePath) ? filePath : [filePath];
      liveReloadServer.changed({
        body: {
          files: files.map(f => '/' + path.relative(config.wwwDir, f))
        }
      });
    }
  }

  events.on(events.EventType.FileChange, fileChange);

  events.on(events.EventType.ReloadApp, () => {
    fileChange('index.html');
  });
}


export function injectLiveReloadScript(content: any, host: string, port: Number): any {
  let contentStr = content.toString();
  const liveReloadScript = getLiveReloadScript(host, port);

  if (contentStr.indexOf('/livereload.js') > -1) {
    // already added script
    return content;
  }

  let match = contentStr.match(/<\/body>(?![\s\S]*<\/body>)/i);
  if (!match) {
    match = contentStr.match(/<\/html>(?![\s\S]*<\/html>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${liveReloadScript}\n${match[0]}`);
  } else {
    contentStr += liveReloadScript;
  }

  return contentStr;
}

function getLiveReloadScript(host: string, port: Number) {
  var src = `//${host}:${port}/livereload.js?snipver=1`;
  return `  <!-- Ionic Dev Server: Injected LiveReload Script -->\n  <script src="${src}" async="" defer=""></script>`;
}
