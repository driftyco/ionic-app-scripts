import { FileCache } from './file-cache';


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

  bundler?: string;
  fileCache?: FileCache;
  inlineTemplates?: boolean;
  webpackWatch?: any;

  sassState?: BuildState;
  transpileState?: BuildState;
  templateState?: BuildState;
  bundleState?: BuildState;

  noLint?: boolean;
  lintLevel?: 'warn' | 'error';
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
