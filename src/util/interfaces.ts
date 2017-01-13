import { FileCache } from './file-cache';
import { VirtualDirStats, VirtualFileStats } from './virtual-file-utils';

export interface BuildContext {
  rootDir?: string;
  tmpDir?: string;
  srcDir?: string;
  wwwDir?: string;
  wwwIndex?: string;
  buildDir?: string;
  moduleFiles?: string[];
  isProd?: boolean;
  isWatch?: boolean;
  runAot?: boolean;
  runMinifyJs?: boolean;
  runMinifyCss?: boolean;
  optimizeJs?: boolean;

  bundler?: string;
  fileCache?: FileCache;
  inlineTemplates?: boolean;
  webpackWatch?: any;

  sassState?: BuildState;
  transpileState?: BuildState;
  templateState?: BuildState;
  bundleState?: BuildState;
  cordova?: any;
}


export enum BuildState {
  SuccessfulBuild,
  RequiresUpdate,
  RequiresBuild
}


export interface WorkerMessage {
  taskModule?: string;
  taskWorker?: string;
  context?: BuildContext;
  workerConfig?: any;
  resolve?: any;
  reject?: any;
  error?: any;
  pid?: number;
}


export interface WorkerProcess {
  task: string;
  worker: any;
}


export interface TaskInfo {
  fullArg: string;
  shortArg: string;
  envVar: string;
  packageConfig: string;
  defaultConfigFile: string;
}


export interface File {
  path: string;
  content: string;
  timestamp?: number;
}


export interface Diagnostic {
  level: string;
  type: string;
  language: string;
  header: string;
  code: string;
  messageText: string;
  absFileName: string;
  relFileName: string;
  lines: PrintLine[];
}


export interface PrintLine {
  lineIndex: number;
  lineNumber: number;
  text: string;
  html: string;
  errorCharStart: number;
  errorLength: number;
}


export interface WsMessage {
  category: string;
  type: string;
  data: any;
}


export interface BuildUpdateMessage {
  buildId: number;
  reloadApp: boolean;
}


export interface ChangedFile {
  event: string;
  filePath: string;
  ext: string;
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


export interface VirtualFileSystem {
  addVirtualFile(filePath: string, fileContent: string): void;
  getFileContent(filePath: string): string;
  getDirectoryStats(path: string): VirtualDirStats;
  getSubDirs(directoryPath: string): string[];
  getFileNamesInDirectory(directoryPath: string): string[];
  getAllFileStats():  { [filePath: string]: VirtualFileStats };
  getAllDirStats():  { [filePath: string]: VirtualDirStats };
};

export interface DeepLinkConfigEntry {
  modulePath: string;
  namedExport: string;
  name: string;
};

export interface HydratedDeepLinkConfigEntry extends DeepLinkConfigEntry {
  absolutePath: string;
};

export interface AppNgModuleInfo {
  absolutePath: string;
  className: string;
};