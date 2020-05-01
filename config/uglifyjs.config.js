
// https://www.npmjs.com/package/uglify-es

module.exports = {

  /**
   * mangle: uglify 2's mangle option
   */
  mangle: true,
  
  /**
   * keep_fnames: uglify 2's keep_fnames option
   */
  keep_fnames: true,

  /**
   * compress: uglify 2's compress option
   */
  compress: {
    toplevel: true,
    pure_getters: true    
  }
};
