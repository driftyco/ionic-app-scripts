import { BuildError } from './errors';


describe('Errors', () => {

  describe('BuildError', () => {

    it('should create BuildError from err object in constructor', () => {
      const buildError = new BuildError();
      buildError.hasBeenLogged = false;
      buildError.message = 'message1';
      buildError.name = 'name1';
      buildError.stack = 'stack1';

      const buildErrorCopy = new BuildError(buildError);

      const json = buildErrorCopy.toJson();
      expect(json.hasBeenLogged).toEqual(buildError.hasBeenLogged);
      expect(json.message).toEqual(buildError.message);
      expect(json.name).toEqual(buildError.name);
      expect(json.stack).toEqual(buildError.stack);
    });

    it('should create json object', () => {
      const buildError = new BuildError();
      buildError.hasBeenLogged = false;
      buildError.message = 'message';
      buildError.name = 'name';
      buildError.stack = 'stack';
      const json = buildError.toJson();
      expect(json.hasBeenLogged).toEqual(buildError.hasBeenLogged);
      expect(json.message).toEqual(buildError.message);
      expect(json.name).toEqual(buildError.name);
      expect(json.stack).toEqual(buildError.stack);
    });

  });

});
