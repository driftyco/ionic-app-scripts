import { join } from 'path';

import * as uglifyLib from 'uglify-js';

import * as helpers from './util/helpers';
import * as uglifyTask from './uglifyjs';


describe('uglifyjs', () => {
  describe('uglifyjsWorkerImpl', () => {
    it('should call uglify for the appropriate files', () => {
      const buildDir = join('some', 'fake', 'dir', 'myApp', 'www', 'build');
      const pathOne = join(buildDir, '0.main.js');
      const pathOneMap = pathOne + '.map';
      const pathTwo = join(buildDir, '1.main.js');
      const pathTwoMap = pathTwo + '.map';
      const pathThree = join(buildDir, 'main.js');
      const pathThreeMap = pathThree + '.map';
      const context = {
        buildDir: buildDir,
        bundledFilePaths: [pathOne, pathOneMap, pathTwo, pathTwoMap, pathThree, pathThreeMap]
      };
      const mockMinfiedResponse = {
        code: 'code',
        map: 'map'
      };
      const mockUglifyConfig = {
        mangle: true,
        compress: true
      };

      const uglifySpy = spyOn(uglifyLib, 'minify').and.returnValue(mockMinfiedResponse);
      const writeFileSpy = spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());

      const promise = uglifyTask.uglifyjsWorkerImpl(context, mockUglifyConfig);

      return promise.then(() => {
        expect(uglifyLib.minify).toHaveBeenCalledTimes(3);
        expect(uglifySpy.calls.all()[0].args[0]).toEqual(pathOne);
        expect(uglifySpy.calls.all()[0].args[1].compress).toEqual(true);
        expect(uglifySpy.calls.all()[0].args[1].mangle).toEqual(true);
        expect(uglifySpy.calls.all()[0].args[1].inSourceMap).toEqual(pathOneMap);
        expect(uglifySpy.calls.all()[0].args[1].outSourceMap).toEqual(pathOneMap);

        expect(uglifySpy.calls.all()[1].args[0]).toEqual(pathTwo);
        expect(uglifySpy.calls.all()[1].args[1].compress).toEqual(true);
        expect(uglifySpy.calls.all()[1].args[1].mangle).toEqual(true);
        expect(uglifySpy.calls.all()[1].args[1].inSourceMap).toEqual(pathTwoMap);
        expect(uglifySpy.calls.all()[1].args[1].outSourceMap).toEqual(pathTwoMap);

        expect(uglifySpy.calls.all()[2].args[0]).toEqual(pathThree);
        expect(uglifySpy.calls.all()[2].args[1].compress).toEqual(true);
        expect(uglifySpy.calls.all()[2].args[1].mangle).toEqual(true);
        expect(uglifySpy.calls.all()[2].args[1].inSourceMap).toEqual(pathThreeMap);
        expect(uglifySpy.calls.all()[2].args[1].outSourceMap).toEqual(pathThreeMap);

        expect(writeFileSpy).toHaveBeenCalledTimes(6);
        expect(writeFileSpy.calls.all()[0].args[0]).toEqual(pathOne);
        expect(writeFileSpy.calls.all()[0].args[1]).toEqual(mockMinfiedResponse.code);
        expect(writeFileSpy.calls.all()[1].args[0]).toEqual(pathOneMap);
        expect(writeFileSpy.calls.all()[1].args[1]).toEqual(mockMinfiedResponse.map);

        expect(writeFileSpy.calls.all()[2].args[0]).toEqual(pathTwo);
        expect(writeFileSpy.calls.all()[2].args[1]).toEqual(mockMinfiedResponse.code);
        expect(writeFileSpy.calls.all()[3].args[0]).toEqual(pathTwoMap);
        expect(writeFileSpy.calls.all()[3].args[1]).toEqual(mockMinfiedResponse.map);

        expect(writeFileSpy.calls.all()[4].args[0]).toEqual(pathThree);
        expect(writeFileSpy.calls.all()[4].args[1]).toEqual(mockMinfiedResponse.code);
        expect(writeFileSpy.calls.all()[5].args[0]).toEqual(pathThreeMap);
        expect(writeFileSpy.calls.all()[5].args[1]).toEqual(mockMinfiedResponse.map);
      });
    });
  });
});
