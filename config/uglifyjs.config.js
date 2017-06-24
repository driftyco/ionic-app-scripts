
// https://www.npmjs.com/package/uglify-js

module.exports = {

  /**
   * mangle: uglify 2's mangle option
   */
  mangle: true,

  /**
   * compress: uglify 2's compress option
   */
  compress: {
    unused: true,
    dead_code: true,
    toplevel: true
  },

  /**
   * comments: uglify 2's comments option
   */
  comments: true
};