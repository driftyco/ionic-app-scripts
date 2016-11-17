import { FileCache } from '../util/file-cache';

export class HybridFileSystem implements FileSystem {
  constructor(private fileCache: FileCache, private originalFileSystem: FileSystem) {
  }

  isSync() {
    return this.originalFileSystem.isSync();
  }

  stat(path: string, callback: Function): any {
    return this.originalFileSystem.stat(path, callback);
  }

  readdir(path: string, callback: Function): any {
    return this.originalFileSystem.readdir(path, callback);
  }

  readJson(path: string, callback: Function): any {
    return this.originalFileSystem.readJson(path, callback);
  }

  readlink(path: string, callback: Function): any {
    return this.originalFileSystem.readlink(path, callback);
  }

  purge(pathsToPurge: string[]): void {
    if (this.fileCache) {
      for (const path of pathsToPurge) {
        this.fileCache.remove(path);
      }
    }
  }

  readFile(path: string, callback: Function): any {
    if (this.fileCache) {
     const file = this.fileCache.get(path);
     if (file) {
       callback(null, new Buffer(file.content));
       return;
     }
    }
    return this.originalFileSystem.readFile(path, callback);
  }

}

export interface FileSystem {
  isSync(): boolean;
  stat(path: string, callback: Function): any;
  readdir(path: string, callback: Function): any;
  readFile(path: string, callback: Function): any;
  readJson(path: string, callback: Function): any;
  readlink(path: string, callback: Function): any;
  purge(what: any): void;
};
