import { access } from 'fs';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { createProgram, findConfiguration, getFileNames } from 'tslint';
import { generateContext, getUserConfigFile } from './util/config';
import { join } from 'path';
import { Logger } from './logger/logger';
import { printDiagnostics, DiagnosticsType } from './logger/logger-diagnostics';
import { runTsLintDiagnostics } from './logger/logger-tslint';
import { runWorker } from './worker-client';
import * as Linter from 'tslint';
import * as fs from 'fs';
import * as ts from 'typescript';


export function lint(context?: BuildContext, configFile?: string) {
  context = generateContext(context)

  if (context.noLint) {
    Logger.debug('Linter is disabled.');
    return Promise.resolve();
  }

  const logger = new Logger('lint');

  return runWorker('lint', 'lintWorker', context, configFile)
    .then(() => logger.finish())
    .catch(err => {
      throw logger.fail(new BuildError(err));
    });
}


export function lintWorker(context: BuildContext, configFile: string) {
  return getLintConfig(context, configFile).then(configFile => {
    // there's a valid tslint config, let's continue
    return lintApp(context, configFile);
  })
}


export function lintUpdate(event: string, filePath: string, context: BuildContext) {
  if (context.noLint) {
    Logger.debug('Linter is disabled.');
    return Promise.resolve();
  }

  return new Promise(resolve => {
    // throw this in a promise for async fun, but don't let it hang anything up
    const workerConfig: LintWorkerConfig = {
      configFile: getUserConfigFile(context, taskInfo, null),
      filePath: filePath
    };

    runWorker('lint', 'lintUpdateWorker', context, workerConfig);
    resolve();
  });
}


export function lintUpdateWorker(context: BuildContext, workerConfig: LintWorkerConfig) {
  return getLintConfig(context, workerConfig.configFile).then(configFile => {
    // there's a valid tslint config, let's continue (but be quiet about it!)
    const program = createProgram(configFile, context.srcDir);
    return lintFile(context, program, workerConfig.filePath);
  }).catch(() => {
  });
}


function lintApp(context: BuildContext, configFile: string) {
  const program = createProgram(configFile, context.srcDir);
  const files = getFileNames(program);

  const promises = files.map(file => {
    return lintFile(context, program, file)
      .then(() => true)
      .catch(() => false);
  });

  return Promise.all(promises)
    .then((f) => {
      if (f.some(x => !!x) && !context.isWatch && context.lintLevel === 'error') {
        throw new Error("Lint failed");
      }
    });
}


function lintFile(context: BuildContext, program: ts.Program, filePath: string) {
  return new Promise((resolve, reject) => {

    if (isMpegFile(filePath)) {
      // silly .ts files actually being video files
      resolve();
      return;
    }

    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) {
        // don't care if there was an error
        // let's just move on with our lives
        resolve();
        return;
      }

      try {
        const configuration = findConfiguration(null, filePath);

        const linter = new Linter(filePath, contents, {
          configuration: configuration,
          formatter: null,
          formattersDirectory: null,
          rulesDirectory: null,
        }, program);

        const lintResult = linter.lint();
        if (lintResult && lintResult.failures.length) {
          const diagnostics = runTsLintDiagnostics(context, <any>lintResult.failures);
          printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);

          reject();
        }

      } catch (e) {
        Logger.debug(`Linter ${e}`);
      }

      resolve();
    });

  });
}


function getLintConfig(context: BuildContext, configFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    if (!configFile) {
      configFile = join(context.rootDir, 'tslint.json');
    }

    Logger.debug(`tslint config: ${configFile}`);

    access(configFile, (err) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        reject();
        return;
      }
      resolve(configFile);
    });
  });
}


function isMpegFile(file: string) {
  var buffer = new Buffer(256);
  buffer.fill(0);

  const fd = fs.openSync(file, 'r');
  try {
    fs.readSync(fd, buffer, 0, 256, null);
    if (buffer.readInt8(0) === 0x47 && buffer.readInt8(188) === 0x47) {
      Logger.debug(`tslint: ${file}: ignoring MPEG transport stream`);
      return true;
    }
  } finally {
    fs.closeSync(fd);
  }
  return false;
}


const taskInfo: TaskInfo = {
  fullArg: '--tslint',
  shortArg: '-i',
  envVar: 'ionic_tslint',
  packageConfig: 'IONIC_TSLINT',
  defaultConfigFile: '../tslint'
};

export interface LintWorkerConfig {
  configFile: string;
  filePath: string;
}
