import { LOGGER_DIR } from './serve-config';

const LOGGER_HEADER = '<!-- Ionic Dev Server: Injected Logger Script -->';

export function injectNotificationScript(content: any, notifyOnConsoleLog: boolean, notificationPort: Number): any {
  let contentStr = content.toString();
  const consoleLogScript = getConsoleLoggerScript(notifyOnConsoleLog, notificationPort);

  if (contentStr.indexOf(LOGGER_HEADER) > -1) {
    // already added script somehow
    return content;
  }

  let match = contentStr.match(/<head>(?![\s\S]*<head>)/i);
  if (!match) {
    match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
  }
  if (match) {
    contentStr = contentStr.replace(match[0], `${match[0]}\n${consoleLogScript}`);
  } else {
    contentStr = consoleLogScript + contentStr;
  }

  return contentStr;
}

function getConsoleLoggerScript(notifyOnConsoleLog: boolean, notificationPort: Number) {
  const ionDevServer = JSON.stringify({
    sendConsoleLogs: notifyOnConsoleLog,
    wsPort: notificationPort,
    notificationIconPath: `${LOGGER_DIR}/ionic.png`
  });

  return `
  ${LOGGER_HEADER}
  <script>var IonicDevServerConfig=${ionDevServer};</script>
  <link href="${LOGGER_DIR}/ion-dev.css" rel="stylesheet">
  <script src="${LOGGER_DIR}/ion-dev.js"></script>
  `;
}