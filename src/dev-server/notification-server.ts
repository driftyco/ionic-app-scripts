// Ionic Dev Server: Server Side Logger
import { Logger } from '../util/logger';
import { hasDiagnostics, getDiagnosticsHtmlContent } from '../util/logger-diagnostics';
import { on, EventType } from '../util/events';
import { Server as WebSocketServer } from 'ws';
import { ServeConfig } from './serve-config';


export function createNotificationServer(config: ServeConfig) {
  let wsServer: any;

  // queue up all messages to the client
  function queueMessageSend(msg: WsMessage) {
    msgToClient.push(msg);
    drainMessageQueue();
  }

  // drain the queue messages when the server is ready
  function drainMessageQueue() {
    if (wsServer) {
      let msg: any;
      while (msg = msgToClient.shift()) {
        try {
          wsServer.send(JSON.stringify(msg));
        } catch (e) {
          Logger.error(`error sending client ws, ${e}`);
        }
      }
    }
  }

  // a build update has started, notify the client
  on(EventType.BuildUpdateStarted, (buildUpdateId) => {
    const msg: WsMessage = {
      category: 'buildUpdate',
      type: 'started',
      data: {
        buildUpdateId: buildUpdateId
      }
    };
    queueMessageSend(msg);
  });

  // a build update has completed, notify the client
  on(EventType.BuildUpdateCompleted, (buildUpdateId) => {
    const msg: WsMessage = {
      category: 'buildUpdate',
      type: 'completed',
      data: {
        buildUpdateId: buildUpdateId,
        diagnosticsHtml: hasDiagnostics(config.buildDir) ? getDiagnosticsHtmlContent(config.buildDir) : null
      }
    };
    queueMessageSend(msg);
  });

  // create web socket server
  const wss = new WebSocketServer({ port: config.notificationPort });

  wss.on('connection', (ws: any) => {
    // we've successfully connected
    wsServer = ws;

    wsServer.on('message', (incomingMessage: string) => {
      // incoming message from the client
      try {
        printMessageFromClient(JSON.parse(incomingMessage));
      } catch (e) {
        Logger.error(`error opening ws message: ${incomingMessage}`);
      }
    });

    // now that we're connected, send off any messages
    // we might has already queued up
    drainMessageQueue();
  });

}


function printMessageFromClient(msg: WsMessage) {
  if (msg.data) {
    switch (msg.category) {
      case 'console':
        printConsole(msg);
        break;

      case 'exception':
        printException(msg);
        break;
    }
  }
}

function printConsole(msg: WsMessage) {
  const args = msg.data;
  args[0] = `console.${msg.type}: ${args[0]}`;

  switch (msg.type) {
    case 'error':
      Logger.error.apply(this, args);
      break;

    case 'warn':
      Logger.warn.apply(this, args);
      break;

    case 'debug':
      Logger.debug.apply(this, args);
      break;

    default:
      Logger.info.apply(this, args);
      break;
    }
}

function printException(msg: WsMessage) {

}

const msgToClient: WsMessage[] = [];

export interface WsMessage {
  category: string;
  type: string;
  data: any;
}
