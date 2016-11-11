import { BuildError } from './util/errors';
import { Logger } from './logger/logger';
import { WorkerMessage } from './util/interfaces';


process.on('message', (msg: WorkerMessage) => {
  try {
    const modulePath = `./${msg.taskModule}`;
    const taskWorker = require(modulePath)[msg.taskWorker];

    taskWorker(msg.context, msg.workerConfig)
      .then((val: any) => {
        taskResolve(msg.taskModule, msg.taskWorker, val);
      }, (val: any) => {
        taskReject(msg.taskModule, msg.taskWorker, val);
      })
      .catch((err: any) => {
        taskError(msg.taskModule, msg.taskWorker, err);
      });

  } catch (e) {
    taskError(msg.taskModule, msg.taskWorker, e);
    process.exit(1);
  }
});


function taskResolve(taskModule: string, taskWorker: string, val: any) {
  const msg: WorkerMessage = {
    taskModule: taskModule,
    taskWorker: taskWorker,
    resolve: val,
    pid: process.pid
  };

  Logger.debug(`worker resolve, taskModule: ${msg.taskModule}, pid: ${msg.pid}`);

  process.send(msg);
}


function taskReject(taskModule: string, taskWorker: string, val: any) {
  const msg: WorkerMessage = {
    taskModule: taskModule,
    taskWorker: taskWorker,
    reject: new BuildError(val).toJson(),
    pid: process.pid
  };

  Logger.debug(`worker reject, taskModule: ${msg.taskModule}, pid: ${msg.pid}`);

  process.send(msg);
}


function taskError(taskModule: string, taskWorker: string, err: any) {
  const msg: WorkerMessage = {
    taskModule: taskModule,
    taskWorker: taskWorker,
    error: new BuildError(err).toJson(),
    pid: process.pid
  };

  Logger.debug(`worker error, taskModule: ${msg.taskModule}, pid: ${msg.pid}`);

  process.send(msg);
}
