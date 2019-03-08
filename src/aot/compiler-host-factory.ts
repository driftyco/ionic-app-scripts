import { CompilerOptions } from 'typescript';
import { FileSystemCompilerHost } from './compiler-host';
import { getInstance as getFileSystemInstance } from '../util/hybrid-file-system-factory';

let instance: FileSystemCompilerHost = null;

export function getFileSystemCompilerHostInstance(options: CompilerOptions) {
  if (!instance) {
    instance = new FileSystemCompilerHost(options, getFileSystemInstance(false));
  }
  return instance;
}
