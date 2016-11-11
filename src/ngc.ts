import { basename, join } from 'path';
import { BuildContext, TaskInfo } from './util/interfaces';
import { BuildError } from './util/errors';
import { copy as fsCopy, emptyDirSync, outputJsonSync, readFileSync, statSync } from 'fs-extra';
import { fillConfigDefaults, generateContext, getUserConfigFile, getNodeBinExecutable } from './util/config';
import { getTsConfigPath } from './transpile';
import { Logger } from './logger/logger';
import { objectAssign } from './util/helpers';
import * as ts from 'typescript';


export function ngc(context?: BuildContext, configFile?: string) {
  context = generateContext(context);
  configFile = getUserConfigFile(context, taskInfo, configFile);

  const logger = new Logger('ngc');

  return ngcWorker(context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch(err => {
      throw logger.fail(err);
    });
}


export function ngcWorker(context: BuildContext, configFile: string) {
  // first make a copy of src TS files
  // and copy them into the tmp directory
  return copySrcTsToTmpDir(context).then(() => {
    return runNgc(context, configFile);
  });
}


function runNgc(context: BuildContext, configFile: string) {
  return new Promise((resolve, reject) => {
    const ngcConfig: NgcConfig = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);

    // make a copy of the users src tsconfig file
    // and save the modified copy into the tmp directory
    createTmpTsConfig(context, ngcConfig);

    const ngcCmd = getNodeBinExecutable(context, 'ngc');
    if (!ngcCmd) {
      reject(new BuildError(`Unable to find Angular Compiler "ngc" command: ${ngcCmd}. Please ensure @angular/compiler-cli has been installed with NPM.`));
      return;
    }

    // let's kick off the actual ngc command on our copied TS files
    // use the user's ngc in their node_modules to ensure ngc
    // versioned and working along with the user's ng2 version
    const spawn = require('cross-spawn');
    const ngcCmdArgs = [
      '--project', getTmpTsConfigPath(context)
    ];

    Logger.debug(`run: ${ngcCmd} ${ngcCmdArgs.join(' ')}`);

    // would love to not use spawn here but import and run ngc directly
    const cp = spawn(ngcCmd, ngcCmdArgs);

    let errorMsgs: string[] = [];

    cp.stdout.on('data', (data: string) => {
      Logger.info(data);
    });

    cp.stderr.on('data', (data: string) => {
      if (data) {
        data.toString().split('\n').forEach(line => {
          if (!line.trim().length) {
            // if it's got no data then don't bother
            return;
          }
          if (line.substr(0, 4) === '    ' || line === 'Compilation failed') {
            // if it's indented then it's some callstack message we don't care about
            return;
          }
          // split by the : character, then rebuild the line until it's too long
          // and make a new line
          const lineSections = line.split(': ');
          let msgSections: string[] = [];
          for (var i = 0; i < lineSections.length; i++) {
            msgSections.push(lineSections[i]);
            if (msgSections.join(': ').length > 40) {
              errorMsgs.push(msgSections.join(': '));
              msgSections = [];
            }
          }
          if (msgSections.length) {
            errorMsgs.push(msgSections.join(': '));
          }
        });
      }
    });

    cp.on('close', (code: string) => {
      if (errorMsgs.length) {
        errorMsgs.forEach(errorMsg => {
          Logger.error(errorMsg);
        });
        reject(new BuildError());

      } else {
        resolve();
      }
    });
  });
}


function createTmpTsConfig(context: BuildContext, ngcConfig: NgcConfig) {
  // create the tsconfig from the original src
  const tsConfigPath = getTsConfigPath(context);
  const tsConfigFile = ts.readConfigFile(tsConfigPath, path => readFileSync(path, 'utf8'));

  if (!tsConfigFile || !tsConfigFile.config) {
    throw new BuildError(`invalid tsconfig: ${tsConfigPath}`);
  }

  if (!tsConfigFile.config.compilerOptions) {
    throw new BuildError(`invalid tsconfig compilerOptions: ${tsConfigPath}`);
  }

  // delete outDir if it's set since we only want
  // to compile to the same directory we're in
  delete tsConfigFile.config.compilerOptions.outDir;

  const mergedConfig = objectAssign({}, tsConfigFile.config, ngcConfig);

  // save the modified copy into the tmp directory
  outputJsonSync(getTmpTsConfigPath(context), mergedConfig);
}


function copySrcTsToTmpDir(context: BuildContext) {
  return new Promise((resolve, reject) => {

    // ensure the tmp directory is ready to go
    try {
      emptyDirSync(context.tmpDir);
    } catch (e) {
      reject(new BuildError(`tmpDir error: ${e}`));
      return;
    }

    const copyOpts: any = {
      filter: filterCopyFiles
    };

    Logger.debug(`copySrcTsToTmpDir, srcDir: ${context.srcDir} to tmpDir: ${context.tmpDir}`);

    fsCopy(context.srcDir, context.tmpDir, copyOpts, (err) => {
      if (err) {
        reject(new BuildError(err));
      } else {
        resolve();
      }
    });
  });
}


function filterCopyFiles(filePath: any, hoop: any) {
  let shouldInclude = false;

  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      shouldInclude = (EXCLUDE_DIRS.indexOf(basename(filePath)) < 0);

    } else {
      shouldInclude = (filePath.endsWith('.ts') || filePath.endsWith('.html'));
    }
  } catch (e) {}

  return shouldInclude;
}


export function getTmpTsConfigPath(context: BuildContext) {
  return join(context.tmpDir, 'tsconfig.json');
}


const EXCLUDE_DIRS = ['assets', 'theme'];


const taskInfo: TaskInfo = {
  fullArg: '--ngc',
  shortArg: '-n',
  envVar: 'IONIC_NGC',
  packageConfig: 'ionic_ngc',
  defaultConfigFile: 'ngc.config'
};


export interface NgcConfig {
  include: string[];
}
