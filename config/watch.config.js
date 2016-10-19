var buildUpdate = require('../dist/build').buildUpdate;
var templateUpdate = require('../dist/template').templateUpdate;
var copyUpdate = require('../dist/copy').copyUpdate;
var sassUpdate = require('../dist/sass').sassUpdate;
var copyConfig = require('./copy.config').include;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{SRC}}/**/*.ts'
      ],
      options: { ignored: /(.*(?=\.spec|\.e2e).*?\.ts)/},
      callback: buildUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*.html'
      ],
      options: { ignored: /(index.html$)/ },
      callback: templateUpdate
    },

    {
      paths: [
        '{{SRC}}/**/*.scss'
      ],
      callback: sassUpdate
    },

    {
      paths: copyConfig.map(f => f.src),
      callback: copyUpdate
    },

  ]

};
