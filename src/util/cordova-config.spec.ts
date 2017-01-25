import * as cordovaConfig from './cordova-config';

describe('parseConfig function', () => {
  it('should return {} when the config does not contain a widget', () => {
    var result = cordovaConfig.parseConfig({});
    expect(result).toEqual({});
  });

  it('should return a CordovaProject without id or version if config.$ does not exist', () => {
    var result = cordovaConfig.parseConfig({
      widget: {
        name: ['thename'],
      }
    });

    expect(result).toEqual({
      name: 'thename',
    });
  });

  it('should return a CordovaProject on success', () => {
    var result = cordovaConfig.parseConfig({
      widget: {
        name: ['thename'],
        $: {
          id: 'theid',
          version: 'theversion'
        }
      }
    });

    expect(result).toEqual({
      name: 'thename',
      id: 'theid',
      version: 'theversion'
    });
  });
});

/*
describe('buildCordovaConfig', () => {
  it('should read the config.xml file', (done) => {
    let fs: any = jest.genMockFromModule('fs');
    fs.readFile = jest.fn().mockReturnValue('blah');
    jest.mock('xml2js', function() {
      return {
        Parser: function() {
          return {
            parseString: function (data, cb) {
              cb(null, 'parseConfigData');
            }
          };
        }
      };
    });

    function daCallback() {
      expect(fs.readfile).toHaveBeenCalledWith('config.xml');
      done();
    }

    cordovaConfig.buildCordovaConfig(daCallback, daCallback);
  });
});
*/
