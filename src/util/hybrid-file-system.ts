import { basename, dirname, join } from 'path';
import { FileSystem, VirtualFileSystem } from './interfaces';
import { FileCache } from './file-cache';
import { VirtualDirStats, VirtualFileStats } from './virtual-file-utils';

export class HybridFileSystem implements FileSystem, VirtualFileSystem {

  private filesStats: { [filePath: string]: VirtualFileStats } = {};
  private directoryStats: { [filePath: string]: VirtualDirStats } = {};
  private originalFileSystem: FileSystem;

  constructor(private fileCache: FileCache) {
  }

  setFileSystem(fs: FileSystem) {
    this.originalFileSystem = fs;
  }

  isSync() {
    return this.originalFileSystem.isSync();
  }

  stat(path: string, callback: Function): any {
    // first check the fileStats
    const fileStat = this.filesStats[path];
    if (fileStat) {
      return callback(null, fileStat);
    }
    // then check the directory stats
    const directoryStat = this.directoryStats[path];
    if (directoryStat) {
      return callback(null, directoryStat);
    }
    // fallback to list
    return this.originalFileSystem.stat(path, callback);
  }

  readdir(path: string, callback: Function): any {
    return this.originalFileSystem.readdir(path, callback);
  }

  readJson(path: string, callback: Function): any {
    return this.originalFileSystem.readJson(path, callback);
  }

  readlink(path: string, callback: Function): any {
    return this.originalFileSystem.readlink(path, (err: Error, response: any) => {
      callback(err, response);
    });
  }

  purge(pathsToPurge: string[]): void {
    if (this.fileCache) {
      for (const path of pathsToPurge) {
        this.fileCache.remove(path);
      }
    }
  }

  readFile(path: string, callback: Function): any {
    const file = this.fileCache.get(path);
    if (file) {
      callback(null, new Buffer(file.content));
      return;
    }
    return this.originalFileSystem.readFile(path, callback);
  }

  addVirtualFile(filePath: string, fileContent: string) {
    this.fileCache.set(filePath, { path: filePath, content: fileContent });
    const fileStats = new VirtualFileStats(filePath, fileContent);
    this.filesStats[filePath] = fileStats;
    const directoryPath = dirname(filePath);
    const directoryStats = new VirtualDirStats(directoryPath);
    this.directoryStats[directoryPath] = directoryStats;
  }

  getFileContent(filePath: string) {
    const file = this.fileCache.get(filePath);
    if (file) {
      return file.content;
    }
    return null;
  }

  getDirectoryStats(path: string): VirtualDirStats {
    return this.directoryStats[path];
  }

  getSubDirs(directoryPath: string): string[] {
    return Object.keys(this.directoryStats)
      .filter(filePath => dirname(filePath) === directoryPath)
      .map(filePath => basename(directoryPath));
  }

  getFileNamesInDirectory(directoryPath: string): string[] {
    return Object.keys(this.filesStats).filter(filePath => dirname(filePath) === directoryPath).map(filePath => basename(filePath));
  }

  getAllFileStats(): { [filePath: string]: VirtualFileStats } {
    return this.filesStats;
  }

  getAllDirStats(): { [filePath: string]: VirtualDirStats } {
    return this.directoryStats;
  }

  mkdirp(filePath: string, callback: Function) {
    callback();
  }

  join(dirPath: string, fileName: string) {
    return join(dirPath, fileName);
  }

  writeFile(filePath: string, fileContent: Buffer, callback: Function) {
    const stringContent = fileContent.toString();
    this.addVirtualFile(filePath, stringContent);
    callback();
  }
}
