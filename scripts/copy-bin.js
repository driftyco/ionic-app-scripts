var fs = require('fs-extra');
var path = require('path');

var binPath = path.join(process.cwd(), 'bin', 'ionic-app-scripts.js');
var distBinPath = path.join(process.cwd(), 'dist', 'bin');
var destFileName = path.join(distBinPath, 'ionic-app-scripts.js');

var fileContent = fs.readFileSync(binPath).toString();

fs.mkdirpSync(distBinPath);
fs.writeFileSync(destFileName, fileContent)