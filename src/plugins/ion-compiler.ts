import { changeExtension } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { Logger } from '../util/logger';
import { dirname, join, resolve } from 'path';
import * as pluginutils from 'rollup-pluginutils';


export function ionCompiler(context: BuildContext) {
  const filter = pluginutils.createFilter(INCLUDE, EXCLUDE);


  return {
    name: 'ion-compiler',

    transform(sourceText: string, sourcePath: string): any {
      if (!filter(sourcePath)) {
        return null;
      }

      const jsSourcePath = changeExtension(sourcePath, '.js');

      if (context.fileCache) {
        const file = context.fileCache.get(jsSourcePath);
        const map = context.fileCache.get(jsSourcePath + '.map');
        if (!file || !file.content) {
          Logger.debug(`transform: unable to find ${jsSourcePath}`);
          return null;
        }

        let mapContent: any = null;
        if (map.content) {
          try {
            mapContent = JSON.parse(map.content);
          } catch (ex) {
          }
        }

        return {
          code: file.content,
          map: mapContent
        };
      }

      return null;
    },

    resolveId(importee: string, importer: string): any {
      return resolveId(importee, importer, context);
    },

    load(sourcePath: string) {
      if (context.fileCache) {
        const file = context.fileCache.get(sourcePath);
        if (file && file.content) {
          return file.content;
        }
      }

      return null;
    }
  };
}


export function resolveId(importee: string, importer: string, context: BuildContext) {
  if (!importer || /\0/.test(importee)) {
    // disregard entry module
    // ignore IDs with null character, these belong to other plugins
    return null;
  }

  if (context.fileCache) {
    const importerFile = context.fileCache.get(importer);
    if (importerFile && importerFile.content) {
      const attemptedImporteeBasename =  resolve(join(dirname(importer), importee));
      const attemptedImportee = attemptedImporteeBasename + '.ts';
      const importeeFile = context.fileCache.get(attemptedImportee);
      if (importeeFile) {
        Logger.debug(`resolveId: found and resolving ${attemptedImportee}`);
        return attemptedImportee;
      } else {
        // rather than a file, the attempedImportee could be a directory
        // while via node resolve pattern auto resolves to index file
        const attemptedImporteeIndex = resolve(join(attemptedImporteeBasename, 'index.ts'));
        const importeeIndexFile = context.fileCache.get(attemptedImporteeIndex);
        if (importeeIndexFile) {
          Logger.debug(`resolveId: found and resolving ${attemptedImporteeIndex}`);
          return attemptedImporteeIndex;
        }
      }
    }
  }
  return null;
}


const INCLUDE = ['*.ts+(|x)', '**/*.ts+(|x)'];
const EXCLUDE = ['*.d.ts', '**/*.d.ts'];
