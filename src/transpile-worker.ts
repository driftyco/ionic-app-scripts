import { BuildContext } from './util/interfaces';
import { transpileWorker, TranspileWorkerMessage, TranspileWorkerConfig } from './transpile';


const context: BuildContext = {};

process.on('message', (incomingMsg: TranspileWorkerMessage) => {
  context.rootDir = incomingMsg.rootDir;
  context.buildDir = incomingMsg.buildDir;
  context.isProd = incomingMsg.isProd;

  const workerConfig: TranspileWorkerConfig = {
    configFile: incomingMsg.configFile,
    writeInMemory: false,
    sourceMaps: false,
    cache: false,
    inlineTemplate: false
  };

  transpileWorker(context, workerConfig)
    .then(() => {
      const outgoingMsg: TranspileWorkerMessage = {
        transpileSuccess: true
      };
      process.send(outgoingMsg);
    })
    .catch(() => {
      const outgoingMsg: TranspileWorkerMessage = {
        transpileSuccess: false
      };
      process.send(outgoingMsg);
    });

});
