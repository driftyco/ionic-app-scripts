import { BuildContext, WorkerProcess, WorkerMessage } from './util/interfaces';
import { BuildError } from './util/errors';
import { Logger } from './logger/logger';
import { fork, ChildProcess } from 'child_process';
import { join } from 'path';


export function runWorker(taskModule: string, taskWorker: string, context: BuildContext, workerConfig: any) {
  return new Promise((resolve, reject) => {
    const worker = <ChildProcess>createWorker(taskModule);
    const msg: WorkerMessage = {
      taskModule,
      taskWorker,
      context: {
        // only copy over what's important
        // don't copy over the large data properties
        rootDir: context.rootDir,
        tmpDir: context.tmpDir,
        srcDir: context.srcDir,
        wwwDir: context.wwwDir,
        wwwIndex: context.wwwIndex,
        buildDir: context.buildDir,
        isProd: context.isProd,
        isWatch: context.isWatch,
        bundler: context.bundler,
        inlineTemplates: context.inlineTemplates,
      },
      workerConfig
    };

    worker.on('message', (msg: WorkerMessage) => {
      if (msg.error) {
        reject(new BuildError(msg.error));

      } else if (msg.reject) {
        reject(new BuildError(msg.reject));

      } else {
        resolve(msg.resolve);
      }

      killWorker(msg.pid);
    });

    worker.on('error', (err: any) => {
      Logger.error(`worker error, taskModule: ${taskModule}, pid: ${worker.pid}, error: ${err}`);
    });

    worker.on('exit', (code: number) => {
      Logger.debug(`worker exited, taskModule: ${taskModule}, pid: ${worker.pid}`);
    });

    worker.send(msg);
  });
}


function killWorker(pid: number) {
  for (var i = workers.length - 1; i >= 0; i--) {
    if (workers[i].worker.pid === pid) {
      try {
        workers[i].worker.kill('SIGKILL');
      } catch (e) {
        Logger.error(`killWorker, ${pid}: ${e}`);
      } finally {
        delete workers[i].worker;
        workers.splice(i, 1);
      }
    }
  }
}


export function createWorker(taskModule: string): any {
  for (var i = workers.length - 1; i >= 0; i--) {
    if (workers[i].task === taskModule) {
      try {
        workers[i].worker.kill('SIGKILL');
      } catch (e) {
        Logger.debug(`createWorker, ${taskModule} kill('SIGKILL'): ${e}`);
      } finally {
        delete workers[i].worker;
        workers.splice(i, 1);
      }
    }
  }

  try {
    const workerModule = join(__dirname, 'worker-process.js');
    const worker = fork(workerModule, process.argv, {
      env: {
        FORCE_COLOR: true,
        npm_config_argv: process.env.npm_config_argv
      }
    });

    Logger.debug(`worker created, taskModule: ${taskModule}, pid: ${worker.pid}`);

    workers.push({
      task: taskModule,
      worker: worker
    });

    return worker;

  } catch (e) {
    throw new BuildError(`unable to create worker-process, task: ${taskModule}: ${e}`);
  }
}


export const workers: WorkerProcess[] = [];
