import { EventEmitter } from 'events';
import { Logger } from './logger';

const emmitter = new EventEmitter();


export function on(eventType: string, listener: {(data?: any): void}) {
  Logger.debug(`An ${eventType} event occurred`);
  return emmitter.on(eventType, listener);
}


export function emit(eventType: string, val?: any) {
  Logger.debug(`Emitting event ${eventType}`);
  return emmitter.emit(eventType, val);
}


export const EventType = {
  BuildFinished: 'BuildFinished',
  SassFinished: 'SassFinished',
  BundleFinished: 'BundleFinished',
  FileChange: 'FileChange',
  FileAdd: 'FileAdd',
  FileDelete: 'FileDelete',
  DirectoryAdd: 'DirectoryAdd',
  DirectoryDelete: 'DirectoryDelete',
  TaskEvent: 'TaskEvent',
  UpdatedDiagnostics: 'UpdatedDiagnostics',

  WebpackFilesChanged: 'WebpackFilesChanged'
};
