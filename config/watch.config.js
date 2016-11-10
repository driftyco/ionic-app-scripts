var watch = require('../dist/watch');
var copy = require('../dist/copy');
var copyConfig = require('./copy.config');


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{SRC}}/**/*.(ts|html|scss)'
      ],
      options: { ignored: '{{SRC}}/**/*.spec.ts' },
      callback: watch.buildUpdate
    },

    {
      paths: copyConfig.include.map(f => f.src),
      callback: copy.copyUpdate
    }

  ]

};
