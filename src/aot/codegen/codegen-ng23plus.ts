import * as CompilerCLI from '@angular/compiler-cli';
import { CodegenOptions } from '../../util/interfaces';

export function isAngular23Plus() {
  if ((CompilerCLI as any).NodeCompilerHostContext) {
    return true;
  }
  return false;
}

export function runCodegen(options: CodegenOptions) {
  const NodeCompilerHostContext = (CompilerCLI as any).NodeCompilerHostContext;
  const instance = new NodeCompilerHostContext();
  const codeGenerator = CompilerCLI.CodeGenerator.create(options.angularCompilerOptions,
                                                        options.cliOptions,
                                                        options.program,
                                                        options.compilerHost,
                                                        instance);

  // angular 2.3+ api for codegen does not take any options
  return (codeGenerator.codegen as any)();
}
