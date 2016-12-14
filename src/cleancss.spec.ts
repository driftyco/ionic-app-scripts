import { join } from 'path';
import * as rewire from 'rewire';

const cleanCss = rewire('./cleancss');

import * as cleanCssFactory from './util/clean-css-factory';
import * as config from './util/config';
import * as helpers from './util/helpers';
import * as workerClient from './worker-client';


describe('clean css task', () => {

  describe('cleancss', () => {
    it('should return when the worker returns', async () => {
      // arrange
      const context = { };
      const configFile: any = null;
      const spy = spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.resolve());
      // act
      await (cleanCss as any).cleancss(context, null);
      // assert
      expect(spy).toHaveBeenCalledWith('cleancss', 'cleancssWorker', context, configFile);
    });

    it('should throw when the worker throws', async () => {
      // arrange
      const context = { };
      const errorMessage = 'Simulating an error';
      spyOn(workerClient, workerClient.runWorker.name).and.throwError(errorMessage);
      try {
        // act
        await (cleanCss as any).cleancss(context, null);
       throw new Error('Should never get here');
      } catch (ex) {
         // assert
        expect(ex.message).toEqual(errorMessage, `Expected ex.message ${ex.message} to equal ${errorMessage}`);
      }
    });
  });

  describe('cleancssworker', () => {
    it('should throw when reading the file throws', async (done) => {
       const errorMessage = 'simulating an error';
      try {
        // arrange
        const context = { buildDir: 'www'};
        const cleanCssConfig = { sourceFileName: 'sourceFileName', destFileName: 'destFileName'};
        spyOn(config, config.generateContext.name).and.returnValue(context);
        spyOn(config, config.fillConfigDefaults.name).and.returnValue(cleanCssConfig);
        spyOn(helpers, helpers.readFileAsync.name).and.throwError(errorMessage);

        // act
        await (cleanCss as any).cleancssWorker(context, null);

        throw new Error('Should never get here');
      } catch (ex) {
        expect(ex.message).toEqual(errorMessage);
        done();
      }
    });

    it('should return what writeFileAsync returns', async (done) => {
      // arrange
      const context = { buildDir: 'www'};
      const cleanCssConfig = { sourceFileName: 'sourceFileName', destFileName: 'destFileName'};
      const fileContent = 'content';
      const minifiedContent = 'someContent';
      spyOn(config, config.generateContext.name).and.returnValue(context);
      spyOn(config, config.fillConfigDefaults.name).and.returnValue(cleanCssConfig);
      spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));
      spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());

      // use rewire to stub this since jasmine is insufficient
      const spy = jasmine.createSpy('mySpy').and.returnValue(Promise.resolve(minifiedContent));
      cleanCss.__set__('runCleanCss', spy);

      // act
      await (cleanCss as any).cleancssWorker(context, null);

      // assert
      expect(config.generateContext).toHaveBeenCalledWith(context);
      expect(config.fillConfigDefaults).toHaveBeenCalledWith(null, (cleanCss as any).taskInfo.defaultConfigFile);
      expect(helpers.readFileAsync).toHaveBeenCalledWith(join(context.buildDir, cleanCssConfig.sourceFileName));
      expect(helpers.writeFileAsync).toHaveBeenCalledWith(join(context.buildDir, cleanCssConfig.destFileName), minifiedContent);
      expect(spy).toHaveBeenCalledWith(cleanCssConfig, fileContent);
      done();
    });
  });

  describe('runCleanCss', () => {
    it('should reject when minification errors out', async (done) => {
      // arrange
      const errorMessage = 'simulating an error';
      const configFile = { options: {} };
      const fileContent = 'fileContent';
      let minifySpy: jasmine.Spy = null;
      try {
        const destinationFilePath = 'filePath';
        const mockMinifier = {
          minify: () => {}
        };
        minifySpy = spyOn(mockMinifier, mockMinifier.minify.name);
        spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue(mockMinifier);

        // act
        const promise = (cleanCss as any).runCleanCss(configFile, fileContent, destinationFilePath);
        // call the callback from the spy's args
        const callback = minifySpy.calls.mostRecent().args[1];
        callback(new Error(errorMessage), null);

        await promise;

        throw new Error('Should never get here');
      } catch (ex) {
        // assert
        expect(ex.message).toEqual(errorMessage);
        done();
      }
    });

    it('should reject when minification has one or more errors', async (done) => {
      // arrange
      const configFile = { options: {} };
      const fileContent = 'fileContent';
      let minifySpy: jasmine.Spy = null;
      const minificationResponse = {
        errors: ['some error']
      };
      try {
        const destinationFilePath = 'filePath';
        const mockMinifier = {
          minify: () => {}
        };
        minifySpy = spyOn(mockMinifier, mockMinifier.minify.name);
        spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue(mockMinifier);

        // act
        const promise = (cleanCss as any).runCleanCss(configFile, fileContent, destinationFilePath);
        // call the callback from the spy's args
        const callback = minifySpy.calls.mostRecent().args[1];
        callback(null, minificationResponse);

        await promise;

        throw new Error('Should never get here');
      } catch (ex) {
        // assert
        expect(ex.message).toEqual(minificationResponse.errors[0]);
        done();
      }
    });

    it('should return minified content', async (done) => {
      const configFile = { options: {} };
      const fileContent = 'fileContent';
      let minifySpy: jasmine.Spy = null;
      const minificationResponse = {
        styles: 'minifiedContent'
      };
      const destinationFilePath = 'filePath';
      const mockMinifier = {
        minify: () => {}
      };
      minifySpy = spyOn(mockMinifier, mockMinifier.minify.name);
      spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue(mockMinifier);

      // act
      const promise = (cleanCss as any).runCleanCss(configFile, fileContent, destinationFilePath);
      // call the callback from the spy's args
      const callback = minifySpy.calls.mostRecent().args[1];
      callback(null, minificationResponse);

      const result = await promise;
      expect(result).toEqual(minificationResponse.styles);
      expect(cleanCssFactory.getCleanCssInstance).toHaveBeenCalledWith(configFile.options);
      expect(minifySpy.calls.mostRecent().args[0]).toEqual(fileContent);
      done();
    });
  });
});

