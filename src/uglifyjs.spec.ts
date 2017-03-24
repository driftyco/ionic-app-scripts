import * as fs from 'fs';
import { join } from 'path';

import * as uglifyLib from 'uglify-js';

import * as helpers from './util/helpers';
import * as uglifyTask from './uglifyjs';


describe('uglifyjs', () => {
  describe('uglifyjsWorkerImpl', () => {
    it('should call uglify for the appropriate files', () => {
      const buildDir = join('some', 'fake', 'dir', 'myApp', 'www', 'build');
      const context = {
        buildDir: buildDir
      };
      const fileNames = ['polyfills.js', 'sw-toolbox.js', '0.main.js', '0.main.js.map', '1.main.js', '1.main.js.map', 'main.js', 'main.js.map'];
      const mockMinfiedResponse = {
        code: 'code',
        map: 'map'
      };
      const mockUglifyConfig = {
        mangle: true,
        compress: true
      };

      spyOn(fs, 'readdirSync').and.returnValue(fileNames);
      const uglifySpy = spyOn(uglifyLib, 'minify').and.returnValue(mockMinfiedResponse);
      const writeFileSpy = spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());

      const promise = uglifyTask.uglifyjsWorkerImpl(context, mockUglifyConfig);

      return promise.then(() => {
        expect(uglifyLib.minify).toHaveBeenCalledTimes(3);
        expect(uglifySpy.calls.all()[0].args[0]).toEqual(join(buildDir, '0.main.js'));
        expect(uglifySpy.calls.all()[0].args[1].compress).toEqual(true);
        expect(uglifySpy.calls.all()[0].args[1].mangle).toEqual(true);
        expect(uglifySpy.calls.all()[0].args[1].inSourceMap).toEqual(join(buildDir, '0.main.js.map'));
        expect(uglifySpy.calls.all()[0].args[1].outSourceMap).toEqual(join(buildDir, '0.main.js.map'));

        expect(uglifySpy.calls.all()[1].args[0]).toEqual(join(buildDir, '1.main.js'));
        expect(uglifySpy.calls.all()[1].args[1].compress).toEqual(true);
        expect(uglifySpy.calls.all()[1].args[1].mangle).toEqual(true);
        expect(uglifySpy.calls.all()[1].args[1].inSourceMap).toEqual(join(buildDir, '1.main.js.map'));
        expect(uglifySpy.calls.all()[1].args[1].outSourceMap).toEqual(join(buildDir, '1.main.js.map'));

        expect(uglifySpy.calls.all()[2].args[0]).toEqual(join(buildDir, 'main.js'));
        expect(uglifySpy.calls.all()[2].args[1].compress).toEqual(true);
        expect(uglifySpy.calls.all()[2].args[1].mangle).toEqual(true);
        expect(uglifySpy.calls.all()[2].args[1].inSourceMap).toEqual(join(buildDir, 'main.js.map'));
        expect(uglifySpy.calls.all()[2].args[1].outSourceMap).toEqual(join(buildDir, 'main.js.map'));

        expect(writeFileSpy).toHaveBeenCalledTimes(6);
        expect(writeFileSpy.calls.all()[0].args[0]).toEqual(join(buildDir, '0.main.js'));
        expect(writeFileSpy.calls.all()[0].args[1]).toEqual(mockMinfiedResponse.code);
        expect(writeFileSpy.calls.all()[1].args[0]).toEqual(join(buildDir, '0.main.js.map'));
        expect(writeFileSpy.calls.all()[1].args[1]).toEqual(mockMinfiedResponse.map);

        expect(writeFileSpy.calls.all()[2].args[0]).toEqual(join(buildDir, '1.main.js'));
        expect(writeFileSpy.calls.all()[2].args[1]).toEqual(mockMinfiedResponse.code);
        expect(writeFileSpy.calls.all()[3].args[0]).toEqual(join(buildDir, '1.main.js.map'));
        expect(writeFileSpy.calls.all()[3].args[1]).toEqual(mockMinfiedResponse.map);

        expect(writeFileSpy.calls.all()[4].args[0]).toEqual(join(buildDir, 'main.js'));
        expect(writeFileSpy.calls.all()[4].args[1]).toEqual(mockMinfiedResponse.code);
        expect(writeFileSpy.calls.all()[5].args[0]).toEqual(join(buildDir, 'main.js.map'));
        expect(writeFileSpy.calls.all()[5].args[1]).toEqual(mockMinfiedResponse.map);
      });
    });
  });
});
