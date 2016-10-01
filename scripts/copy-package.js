var fs = require('fs');
var path = require('path');


// copy package json
var packageJsonPath = path.join(process.cwd(), 'package.json');
var packageJson = require(packageJsonPath);
if (! packageJson) {
  throw new Error('Can\'t find package json');
}

delete packageJson.devDependencies;

fs.writeFile('./dist/package.json', JSON.stringify(packageJson, null, 2));