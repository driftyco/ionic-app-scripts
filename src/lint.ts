import { access } from 'fs';
import { BuildContext, ChangedFile, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { createProgram, findConfiguration, getFileNames } from 'tslint';
import { getUserConfigFile } from './util/config';
import { join } from 'path';
import { Logger } from './logger/logger';
import { printDiagnostics, DiagnosticsType } from './logger/logger-diagnostics';
import { runTsLintDiagnostics } from './logger/logger-tslint';
import { runWorker } from './worker-client';
import * as Linter from 'tslint';
import * as fs from 'fs';
import * as ts from 'typescript';


export function lint(context: BuildContext, configFile?: string) {
  return runWorker('lint', 'lintWorker', context, configFile)
    .catch(err => {
      throw new BuildError(err);
    });
}


export function lintWorker(context: BuildContext, configFile: string) {
  return getLintConfig(context, configFile).then(configFile => {
    // there's a valid tslint config, let's continue
    return lintApp(context, configFile);
  }).catch(() => {});
}


export function lintUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
  return new Promise(resolve => {
    // throw this in a promise for async fun, but don't let it hang anything up
    const workerConfig: LintWorkerConfig = {
      configFile: getUserConfigFile(context, taskInfo, null),
      filePaths: changedTypescriptFiles.map(changedTypescriptFile => changedTypescriptFile.filePath)
    };

    runWorker('lint', 'lintUpdateWorker', context, workerConfig);
    resolve();
  });
}


export function lintUpdateWorker(context: BuildContext, workerConfig: LintWorkerConfig) {
  return getLintConfig(context, workerConfig.configFile).then(configFile => {
    // there's a valid tslint config, let's continue (but be quiet about it!)
    const program = createProgram(configFile, context.srcDir);
    return lintFiles(context, program, workerConfig.filePaths);
  }).catch(() => {
  });
}


function lintApp(context: BuildContext, configFile: string) {
  const program = createProgram(configFile, context.srcDir);
  const files = getFileNames(program);

  const promises = files.map(file => {
    return lintFile(context, program, file);
  });

  return Promise.all(promises);
}

function lintFiles(context: BuildContext, program: ts.Program, filePaths: string[]) {
  const promises: Promise<any>[] = [];
  for (const filePath of filePaths) {
    promises.push(lintFile(context, program, filePath));
  }
  return Promise.all(promises);
}

function lintFile(context: BuildContext, program: ts.Program, filePath: string): Promise<any> {
  return new Promise((resolve) => {

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
        if (lintResult && lintResult.failures) {
          const diagnostics = runTsLintDiagnostics(context, <any>lintResult.failures);
          printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);
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
  filePaths: string[];
}
