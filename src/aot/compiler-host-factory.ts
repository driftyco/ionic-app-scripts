import { CompilerOptions } from 'typescript';
import { InMemoryCompilerHost } from './compiler-host';
import { getInstance as getFileSystemInstance } from '../util/hybrid-file-system-factory';

let instance: InMemoryCompilerHost = null;

export function getInMemoryCompilerHostInstance(options: CompilerOptions) {
  if (!instance) {
    instance = new InMemoryCompilerHost(options, getFileSystemInstance(false));
  }
  return instance;
}
