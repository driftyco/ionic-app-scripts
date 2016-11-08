import { File } from './interfaces';
import { emit, EventType } from './events';

export class FileCache {

  private map: Map<string, File>;

  constructor() {
    this.map = new Map<string, File>();
  }

  put(key: string, file: File) {
    file.timestamp = Date.now();
    this.map.set(key, file);
    // emit(EventType.DanFileChanged, key);
  }

  get(key: string): File {
    return this.map.get(key);
  }

  remove(key: string): Boolean {
    const result = this.map.delete(key);
    // emit(EventType.DanFileDeleted, key);
    return result;
  }

  getAll() {
    var list: File[] = [];
    this.map.forEach((file: File) => {
      list.push(file);
    });
    return list;
  }

  getRawStore(): Map<string, File> {
    return this.map;
  }
}
