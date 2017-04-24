import { BuildContext, CoreCompiler } from '../util/interfaces';
import { Logger } from '../logger/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as nodeSass from 'node-sass';
import * as rollup from 'rollup';
import * as typescript from 'typescript';
import * as uglify from 'uglify-js';


export function bundleCoreComponents(context: BuildContext) {
  const compiler = getCoreCompiler(context);

  if (!compiler) {
    Logger.debug(`skipping core component bundling`);
    return Promise.resolve();
  }

  const config = {
    srcDir: context.coreDir,
    destDir: context.buildDir,
    packages: {
      fs: fs,
      path: path,
      nodeSass: nodeSass,
      rollup: rollup,
      typescript: typescript,
      uglify: uglify
    }
  };

  return compiler.bundle(config).then(results => {
    if (results.errors) {
      results.errors.forEach((err: string) => {
        Logger.error(`compiler.bundle, results: ${err}`);
      });
    }
  }).catch(err => {
    Logger.error(`compiler.bundle: ${err}`);
  });
}


function getCoreCompiler(context: BuildContext): CoreCompiler {
  try {
    return require(context.coreCompilerFilePath);
  } catch (e) {
    Logger.debug(`error loading core compiler: ${context.coreCompilerFilePath}, ${e}`);
  }
  return null;
}

// In serve mode, we only want to do the look-up for the compiler once
let cachedCompilerModuleResult: CompilerModuleResult = null;
export function doesCompilerExist(context: BuildContext): boolean {
  if (!cachedCompilerModuleResult) {
    const result = getCoreCompiler(context);
    cachedCompilerModuleResult = {
      found: result ? true : false,
      module: result ? result : null
    };
  }

  return cachedCompilerModuleResult.found;
}

interface CompilerModuleResult {
  found: boolean;
  module: any;
};
