import { injectCoreHtml } from './inject-scripts';


describe('Inject Scripts', () => {

  describe('injectCoreHtml', () => {

    it('should replace an existed injected script tag', () => {
      const inputHtml = '' +
        '<html>\n' +
        '<head>\n' +
        '  <script data-ionic="inject">\n' +
        '    alert(11111);\n' +
        '  </script>\n' +
        '</head>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>';

      const output = injectCoreHtml(inputHtml, '  <script data-ionic="inject">\n' +
                                               '    alert(55555);\n' +
                                               '  </script>');

      expect(output).toEqual(
        '<html>\n' +
        '<head>\n' +
        '  <script data-ionic="inject">\n' +
        '    alert(55555);\n' +
        '  </script>\n' +
        '</head>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>');
    });

    it('should replace only one existed injected script tag', () => {
      const inputHtml = '' +
        '<html>\n' +
        '<head>\n' +
        '  <script data-ionic="inject">\n' +
        '    alert(11111);\n' +
        '  </script>\n' +
        '  <script>\n' +
        '    alert(222);\n' +
        '  </script>\n' +
        '</head>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>';

      const output = injectCoreHtml(inputHtml, '  <script data-ionic="inject">\n' +
                                               '    alert(55555);\n' +
                                               '  </script>');

      expect(output).toEqual(
        '<html>\n' +
        '<head>\n' +
        '  <script data-ionic="inject">\n' +
        '    alert(55555);\n' +
        '  </script>\n' +
        '  <script>\n' +
        '    alert(222);\n' +
        '  </script>\n' +
        '</head>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>');
    });

    it('should add script to top of file when no html tag', () => {
      const inputHtml = '' +
        '<body>\n' +
        '</body>';

      const output = injectCoreHtml(inputHtml, '<injected></injected>');

      expect(output).toEqual(
        '<injected></injected>\n' +
        '<body>\n' +
        '</body>');
    });

    it('should add script below <html> with attributes', () => {
      const inputHtml = '' +
        '<html dir="rtl">\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>';

      const output = injectCoreHtml(inputHtml, '<injected></injected>');

      expect(output).toEqual(
        '<html dir="rtl">\n' +
        '<injected></injected>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>');
    });

    it('should add script below <html> when no head tag', () => {
      const inputHtml = '' +
        '<html>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>';

      const output = injectCoreHtml(inputHtml, '<injected></injected>');

      expect(output).toEqual(
        '<html>\n' +
        '<injected></injected>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>');
    });

    it('should add script below <head>', () => {
      const inputHtml = '' +
        '<html>\n' +
        '<head>\n' +
        '</head>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>';

      const output = injectCoreHtml(inputHtml, '<injected></injected>');

      expect(output).toEqual(
        '<html>\n' +
        '<head>\n' +
        '<injected></injected>\n' +
        '</head>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>');
    });

    it('should add script below <head> with attributes and all caps tag', () => {
      const inputHtml = '' +
        '<html>\n' +
        '<HEAD data-attr="yup">\n' +
        '</HEAD>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>';

      const output = injectCoreHtml(inputHtml, '<injected></injected>');

      expect(output).toEqual(
        '<html>\n' +
        '<HEAD data-attr="yup">\n' +
        '<injected></injected>\n' +
        '</HEAD>\n' +
        '<body>\n' +
        '</body>\n' +
        '</html>');
    });

  });

});



