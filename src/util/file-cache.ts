import { File } from './interfaces';


export class FileCache {

  private map: Map<string, File>;

  constructor() {
    this.map = new Map<string, File>();
  }

  set(key: string, file: File) {
    file.timestamp = Date.now();
    this.map.set(key, file);
  }

  get(key: string): File {
    return this.map.get(key);
  }

  has(key: string) {
    return this.map.has(key);
  }

  remove(key: string): Boolean {
    const result = this.map.delete(key);
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
