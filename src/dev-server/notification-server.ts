// Ionic Dev Server: Server Side Logger
import { Diagnostic, Logger, TaskEvent } from '../util/logger';
import { on, EventType } from '../util/events';
import { Server as WebSocketServer } from 'ws';
import { ServeConfig } from './serve-config';

let wsServer: any;
const msgToClient: WsMessage[] = [];

export interface WsMessage {
  category: string;
  type: string;
  data: any;
}

export function createNotificationServer(config: ServeConfig) {
  on(EventType.TaskEvent, (taskEvent: TaskEvent) => {
    const msg: WsMessage = {
      category: 'taskEvent',
      type: taskEvent.scope,
      data: taskEvent
    };
    queueMessageSend(msg);
  });

  on(EventType.TranspileDiagnostics, (diagnostic: Diagnostic) => {
    const msg: WsMessage = {
      category: 'transpileDiagnostics',
      type: 'typescript',
      data: diagnostic
    };
    queueMessageSend(msg);
  });

  // create web socket server
  const wss = new WebSocketServer({ port: config.notificationPort });

  wss.on('connection', (ws: any) => {
    wsServer = ws;

    wsServer.on('message', (incomingMessage: string) => {
      // incoming message from the client
      try {
        printClientMessage(JSON.parse(incomingMessage));
      } catch (e) {
        Logger.error(`error opening ws message: ${incomingMessage}`);
      }
    });

    drainMessageQueue();
  });

}


function queueMessageSend(msg: WsMessage) {
  msgToClient.push(msg);
  drainMessageQueue();
}


function drainMessageQueue() {
  if (wsServer) {
    var msg: any;
    while (msg = msgToClient.shift()) {
      try {
        wsServer.send(JSON.stringify(msg));
      } catch (e) {
        Logger.error(`error sending client ws, ${e}`);
      }
    }
  }
}

function printClientMessage(msg: WsMessage) {
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
