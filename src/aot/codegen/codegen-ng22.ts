import * as CompilerCLI from '@angular/compiler-cli';
import { CodegenOptions } from '../../util/interfaces';

export function isAngular22() {
  if ((CompilerCLI as any).NodeReflectorHostContext) {
    return true;
  }
  return false;
}

export function runCodegen(options: CodegenOptions) {
  const NodeReflectorHostContextConstructor = (CompilerCLI as any).NodeReflectorHostContext;
  const instance = new NodeReflectorHostContextConstructor(options.compilerHost);
  const codeGenerator = CompilerCLI.CodeGenerator.create(options.angularCompilerOptions,
                                                        options.cliOptions,
                                                        options.program,
                                                        options.compilerHost,
                                                        instance);

  // angular 2.2 api to codegen
  return (codeGenerator.codegen as any)({transitiveModules: true});
}

