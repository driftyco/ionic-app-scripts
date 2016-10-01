const rollupConfig = require('./rollup.config');

// https://github.com/rollup/rollup/wiki/JavaScript-API

rollupConfig.entry = '.tmp/app/main.prod.js';
module.exports = rollupConfig;
