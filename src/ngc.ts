import { basename, join } from 'path';
import { BuildContext, BuildOptions, TaskInfo } from './util/interfaces';
import { copy as fsCopy, emptyDirSync, outputJsonSync, statSync } from 'fs-extra';
import { fillConfigDefaults, generateContext, generateBuildOptions, getNodeBinExecutable } from './util/config';
import { endsWith } from './util/helpers';
import { Logger } from './util/logger';
import { getTsConfig } from './transpile';

export function ngc(context?: BuildContext, options?: BuildOptions, ngcConfig?: NgcConfig) {
  context = generateContext(context);
  options = generateBuildOptions(options);
  ngcConfig = fillConfigDefaults(context, ngcConfig, NGC_TASK_INFO);

  const logger = new Logger('ngc');

  // first make a copy of src TS files
  // and copy them into the tmp directory
  return copySrcTsToTmpDir(context).then(() => {
    // ts files have finishe being copied to the tmp directory
    // now compile the copied TS files with NGC
    return runNgc(context, options, ngcConfig);

  }).then(() => {
    return logger.finish();

  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}


export function ngcUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  Logger.debug(`ngcUpdate, event: ${event}, path: ${path}`);

  const ngcConfig = fillConfigDefaults(context, null, NGC_TASK_INFO);
  return runNgc(context, options, ngcConfig);
}


function runNgc(context: BuildContext, options: BuildOptions, ngcConfig: NgcConfig) {
  return new Promise((resolve, reject) => {
    // make a copy of the users src tsconfig file
    // and save the modified copy into the tmp directory
    createTmpTsConfig(context, ngcConfig);

    const ngcCmd = getNodeBinExecutable(context, 'ngc');
    if (!ngcCmd) {
      reject(new Error(`Unable to find Angular Compiler "ngc" command: ${ngcCmd}. Please ensure @angular/compiler-cli has been installed with NPM.`));
      return;
    }

    // let's kick off the actual ngc command on our copied TS files
    // use the user's ngc in their node_modules to ensure ngc
    // versioned and working along with the user's ng2 version
    const spawn = require('cross-spawn');
    const ngcCmdArgs = [
      '--project', getTmpTsConfigPath(context)
    ];

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
        Logger.error(`NGC Compilation failed`);
        errorMsgs.forEach(errorMsg => {
          Logger.error(errorMsg);
        });

        reject('');

      } else {
        resolve();
      }
    });
  });
}


function createTmpTsConfig(context: BuildContext, ngcConfig: NgcConfig) {
  // create the tsconfig from the original src
  const tsConfig = getTsConfig(context.rootDir);

  // delete outDir if it's set since we only want
  // to compile to the same directory we're in
  delete tsConfig.compilerOptions.outDir;

  // force where to look for ts files
  tsConfig.include = ngcConfig.include;

  // change baseUrl to support path mappings
  tsConfig.compilerOptions.baseUrl = ngcConfig.compilerOptions.baseUrl;

  // save the modified copy into the tmp directory
  outputJsonSync(getTmpTsConfigPath(context), tsConfig);
}


function copySrcTsToTmpDir(context: BuildContext) {
  return new Promise((resolve, reject) => {

    // ensure the tmp directory is ready to go
    try {
      emptyDirSync(context.tmpDir);
    } catch (e) {
      throw new Error(`tmpDir error: ${e}`);
    }

    const copyOpts: any = {
      filter: filterCopyFiles
    };

    Logger.debug(`copySrcTsToTmpDir, src: ${context.srcDir}, src: ${context.tmpDir}`);

    fsCopy(context.srcDir, context.tmpDir, copyOpts, (err) => {
      if (err) {
        reject(err);
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
      shouldInclude = (endsWith(filePath, '.ts') || endsWith(filePath, '.html'));
    }
  } catch (e) {}

  return shouldInclude;
}


export function getTmpTsConfigPath(context: BuildContext) {
  return join(context.tmpDir, 'tsconfig.json');
}


const EXCLUDE_DIRS = ['assets', 'theme'];


const NGC_TASK_INFO: TaskInfo = {
  fullArgConfig: '--ngc',
  shortArgConfig: '-n',
  envConfig: 'ionic_ngc',
  defaultConfigFilename: 'ngc.config'
};


export interface NgcConfig {
  include: string[];
  compilerOptions: {
    baseUrl: string;
  };
}
