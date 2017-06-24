import { BuildContext } from '../util/interfaces';
import { buildIonicGlobal } from './ionic-global';


describe('Ionic Global', () => {

  describe('buildIonicGlobal', () => {

    it('should cache windowIonic', () => {
      const ctx: BuildContext = {
        rootDir: '/Users/elliemae/myapp',
        wwwDir: '/Users/elliemae/myapp/www',
        buildDir: '/Users/elliemae/myapp/www/build'
      };

      const r = buildIonicGlobal(ctx);

      expect(r).toBeDefined();
    });

  });

});
