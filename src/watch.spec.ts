import { BuildContext, BuildState, ChangedFile } from './util/interfaces';
import { FileCache } from './util/file-cache';
import { runBuildUpdate } from './watch';
import { Watcher, prepareWatcher } from './watch';
import * as path from 'path';


describe('watch', () => {

  describe('runBuildUpdate', () => {

    it('should require transpile full build for html file add', () => {
      const files: ChangedFile[] = [{
        event: 'add',
        filePath: 'file1.html',
        ext: '.html'
      }];
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresBuild);
    });

    it('should require transpile full build for html file change and not already successful bundle', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.html',
        ext: '.html'
      }];
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresBuild);
    });

    it('should require template update for html file change and already successful bundle', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.html',
        ext: '.html'
      }];
      context.bundleState = BuildState.SuccessfulBuild;
      runBuildUpdate(context, files);
      expect(context.templateState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require sass update for ts file unlink', () => {
      const files: ChangedFile[] = [{
        event: 'unlink',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      runBuildUpdate(context, files);
      expect(context.sassState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require sass update for ts file add', () => {
      const files: ChangedFile[] = [{
        event: 'add',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      runBuildUpdate(context, files);
      expect(context.sassState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require sass update for scss file add', () => {
      const files: ChangedFile[] = [{
        event: 'add',
        filePath: 'file1.scss',
        ext: '.scss'
      }];
      runBuildUpdate(context, files);
      expect(context.sassState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require sass update for scss file change', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.scss',
        ext: '.scss'
      }];
      runBuildUpdate(context, files);
      expect(context.sassState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require transpile full build for single ts add, but only bundle update when already successful bundle', () => {
      const files: ChangedFile[] = [{
        event: 'add',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      context.bundleState = BuildState.SuccessfulBuild;
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresBuild);
      expect(context.bundleState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require transpile full build for single ts add', () => {
      const files: ChangedFile[] = [{
        event: 'add',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresBuild);
      expect(context.bundleState).toEqual(BuildState.RequiresBuild);
    });

    it('should require transpile full build for single ts change and not in file cache', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresBuild);
      expect(context.bundleState).toEqual(BuildState.RequiresBuild);
    });

    it('should require transpile update only and full bundle build for single ts change and already in file cache and hasnt already had successful bundle', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      context.bundleState = BuildState.SuccessfulBuild;
      const resolvedFilePath = path.resolve('file1.ts');
      context.fileCache.set(resolvedFilePath, { path: 'file1.ts', content: 'content' });
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresUpdate);
      expect(context.bundleState).toEqual(BuildState.RequiresUpdate);
    });

    it('should require transpile update only and bundle update for single ts change and already in file cache and bundle already successful', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.ts',
        ext: '.ts'
      }];
      const resolvedFilePath = path.resolve('file1.ts');
      context.fileCache.set(resolvedFilePath, { path: 'file1.ts', content: 'content' });
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresUpdate);
      expect(context.bundleState).toEqual(BuildState.RequiresBuild);
    });

    it('should require transpile full build for multiple ts changes', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.ts',
        ext: '.ts'
      }, {
        event: 'change',
        filePath: 'file2.ts',
        ext: '.ts'
      }];
      runBuildUpdate(context, files);
      expect(context.transpileState).toEqual(BuildState.RequiresBuild);
      expect(context.bundleState).toEqual(BuildState.RequiresBuild);
    });

    it('should not update bundle state if no transpile changes', () => {
      const files: ChangedFile[] = [{
        event: 'change',
        filePath: 'file1.scss',
        ext: '.scss'
      }];
      runBuildUpdate(context, files);
      expect(context.bundleState).toEqual(undefined);
    });

    it('should do nothing if there are no changed files', () => {
      expect(runBuildUpdate(context, [])).toEqual(null);
      expect(runBuildUpdate(context, null)).toEqual(null);
    });


    let context: BuildContext;
    beforeEach(() => {
      context = {
        fileCache: new FileCache()
      };
    });

  });

  describe('prepareWatcher', () => {

    it('should do nothing when options.ignored is a function', () => {
      const ignoreFn = function(){};
      const watcher: Watcher = { options: { ignored: ignoreFn } };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.ignored).toBe(ignoreFn);
    });

    it('should set replacePathVars when options.ignored is a string', () => {
      const watcher: Watcher = { options: { ignored: '{{SRC}}/**/*.spec.ts' } };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.ignored).toEqual('/some/src/**/*.spec.ts');
    });

    it('should set replacePathVars when paths is an array', () => {
      const watcher: Watcher = { paths: [
        '{{SRC}}/some/path1',
        '{{SRC}}/some/path2'
      ] };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.paths.length).toEqual(2);
      expect(watcher.paths[0]).toEqual('/some/src/some/path1');
      expect(watcher.paths[1]).toEqual('/some/src/some/path2');
    });

    it('should set replacePathVars when paths is a string', () => {
      const watcher: Watcher = { paths: '{{SRC}}/some/path' };
      const context: BuildContext = { srcDir: '/some/src/' };
      prepareWatcher(context, watcher);
      expect(watcher.paths).toEqual('/some/src/some/path');
    });

    it('should not set options.ignoreInitial if it was provided', () => {
      const watcher: Watcher = { options: { ignoreInitial: false } };
      const context: BuildContext = {};
      prepareWatcher(context, watcher);
      expect(watcher.options.ignoreInitial).toEqual(false);
    });

    it('should set options.ignoreInitial to true if it wasnt provided', () => {
      const watcher: Watcher = { options: {} };
      const context: BuildContext = {};
      prepareWatcher(context, watcher);
      expect(watcher.options.ignoreInitial).toEqual(true);
    });

    it('should not set options.cwd from context.rootDir if it was provided', () => {
      const watcher: Watcher = { options: { cwd: '/my/cwd/' } };
      const context: BuildContext = { rootDir: '/my/root/dir/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.cwd).toEqual('/my/cwd/');
    });

    it('should set options.cwd from context.rootDir if it wasnt provided', () => {
      const watcher: Watcher = {};
      const context: BuildContext = { rootDir: '/my/root/dir/' };
      prepareWatcher(context, watcher);
      expect(watcher.options.cwd).toEqual(context.rootDir);
    });

    it('should create watcher options when not provided', () => {
      const watcher: Watcher = {};
      const context: BuildContext = {};
      prepareWatcher(context, watcher);
      expect(watcher.options).toBeDefined();
    });

  });

});
