var buildUpdate = require('../build').buildUpdate;
var templateUpdate = require('../template').templateUpdate;
var copyUpdate = require('../copy').copyUpdate;
var sassUpdate = require('../sass').sassUpdate;


// https://www.npmjs.com/package/chokidar

module.exports = {

  watchers: [

    {
      paths: [
        '{{TMP}}/**/*.js'
      ],
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
      paths: [
        '{{SRC}}/assets'
      ],
      callback: copyUpdate
    },

  ]

};
