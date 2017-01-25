import * as commonChunksPlugins from './common-chunks-plugins';
import { join } from 'path';

describe('common-chunks-plugins', () => {
  describe('checkIfModuleIsIonicDependency', () => {
    it('should return false when userRequest is null', () => {
      const result = commonChunksPlugins.checkIfModuleIsIonicDependency({});
      expect(result).toEqual(false);
    });

    it('should return false when userRequest is an unknown 3rd party module', () => {
      const result = commonChunksPlugins.checkIfModuleIsIonicDependency({
        userRequest: join(commonChunksPlugins.NODE_MODULES, 'moment', 'index.js')
      });
      expect(result).toEqual(false);
    });

    it('should return true when userRequest is an known 3rd party module', () => {
      const angularResult = commonChunksPlugins.checkIfModuleIsIonicDependency({
        userRequest: join(commonChunksPlugins.ANGULAR, 'src', 'something.js')
      });

      const rxjsResult = commonChunksPlugins.checkIfModuleIsIonicDependency({
        userRequest: join(commonChunksPlugins.RXJS, 'src', 'something.js')
      });

      const ionicResult = commonChunksPlugins.checkIfModuleIsIonicDependency({
        userRequest: join(commonChunksPlugins.IONIC, 'src', 'something.js')
      });

      const zoneResult = commonChunksPlugins.checkIfModuleIsIonicDependency({
        userRequest: join(commonChunksPlugins.ZONEJS, 'src', 'something.js')
      });

      expect(angularResult).toEqual(true);
      expect(rxjsResult).toEqual(true);
      expect(ionicResult).toEqual(true);
      expect(zoneResult).toEqual(true);
    });
  });

  describe('checkIfModuleIsNodeModuleButNotIonicDepenedency', () => {
    it('should return false when userRequest is null', () => {
      const result = commonChunksPlugins.checkIfModuleIsNodeModuleButNotIonicDepenedency({});
      expect(result).toEqual(false);
    });

    it('should return true when userRequest is an unknown 3rd party module', () => {
      const result = commonChunksPlugins.checkIfModuleIsNodeModuleButNotIonicDepenedency({
        userRequest: join(commonChunksPlugins.NODE_MODULES, 'moment', 'index.js')
      });
      expect(result).toEqual(true);
    });

    it('should return false when userRequest is a known 3rd party module', () => {
      const angularResult = commonChunksPlugins.checkIfModuleIsNodeModuleButNotIonicDepenedency({
        userRequest: join(commonChunksPlugins.ANGULAR, 'src', 'something.js')
      });

      const rxjsResult = commonChunksPlugins.checkIfModuleIsNodeModuleButNotIonicDepenedency({
        userRequest: join(commonChunksPlugins.RXJS, 'src', 'something.js')
      });

      const ionicResult = commonChunksPlugins.checkIfModuleIsNodeModuleButNotIonicDepenedency({
        userRequest: join(commonChunksPlugins.IONIC, 'src', 'something.js')
      });

      const zoneResult = commonChunksPlugins.checkIfModuleIsNodeModuleButNotIonicDepenedency({
        userRequest: join(commonChunksPlugins.ZONEJS, 'src', 'something.js')
      });

      expect(angularResult).toEqual(false);
      expect(rxjsResult).toEqual(false);
      expect(ionicResult).toEqual(false);
      expect(zoneResult).toEqual(false);
    });
  });
});
