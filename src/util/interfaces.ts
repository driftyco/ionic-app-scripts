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
  isUpdate?: boolean;
  fullBuildCompleted?: boolean;
  bundler?: string;
  useTranspileCache?: boolean;
  useBundleCache?: boolean;
  useSassCache?: boolean;
  fileCache?: FileCache;
  successfulSass?: boolean;
  inlineTemplates?: boolean;
  webpackWatch?: any;
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
