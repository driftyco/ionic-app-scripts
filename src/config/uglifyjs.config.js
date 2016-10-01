
// https://www.npmjs.com/package/uglify-js

module.exports = {

  /**
   * sourceFile: The javascript file to minify
   */
  sourceFile: 'main.js',

  /**
   * destFileName: file name for the minified js in the build dir
   */
  destFileName: 'main.js',

  /**
   * inSourceMap: file name for the input source map
   */
  inSourceMap: 'main.js.map',

  /**
   * outSourceMap: file name for the output source map
   */
  outSourceMap: 'main.js.map',

  /**
   * mangle: uglify 2's mangle option
   */
  mangle: true,

  /**
   * compress: uglify 2's compress option
   */
  compress: true,

  /**
   * comments: uglify 2's comments option
   */
  comments: true
};