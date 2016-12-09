export class ModuleRoute {
  constructor(public readonly path: string, public readonly className: string = null) {
  }

  toString() {
    return `${this.path}#${this.className}`;
  }

  static fromString(entry: string): ModuleRoute {
    const split = entry.split('#');
    return new ModuleRoute(split[0], split[1]);
  }
}
