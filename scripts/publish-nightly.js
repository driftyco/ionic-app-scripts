var execSync = require('child_process').execSync;
var fs = require('fs');
var path = require('path');

var packageJsonPath = path.join(__dirname, '..', 'package.json');
var tempPackageJsonPath = path.join(__dirname, '..', 'package-orig.json');
var originalPackageJson = require(packageJsonPath);

/*
 * This script assumes the `build` step was run prior to it
 */

function backupOriginalPackageJson() {
  var originalContent = JSON.stringify(originalPackageJson, null, 2);
  fs.writeFileSync(tempPackageJsonPath, originalContent);
}

function createNightlyVersionInPackageJson() {
  var originalVersion = originalPackageJson.version;
  originalPackageJson.version = originalVersion + '-' + createTimestamp();
  fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));
}

function revertPackageJson() {
  var fileContent = fs.readFileSync(tempPackageJsonPath);
  fileContent = fileContent + '\n';
  fs.writeFileSync(packageJsonPath, fileContent);
  fs.unlinkSync(tempPackageJsonPath);
}

function createTimestamp() {
  // YYYYMMDDHHMM
  var d = new Date();
  return d.getUTCFullYear() + // YYYY
          ('0' + (d.getUTCMonth() + 1)).slice(-2) + // MM
          ('0' + (d.getUTCDate())).slice(-2) + // DD
          ('0' + (d.getUTCHours())).slice(-2) + // HH
          ('0' + (d.getUTCMinutes())).slice(-2); // MM
}

function publishToNpm(tagName) {
  var command = `npm publish --tag=${tagName} ${process.cwd()}`;
  execSync(command);
}


function mainFunction() {
  try {
    let tagName = 'nightly';
    if (process.argv.length >= 3) {
      tagName = process.argv[2];
    }
    console.log(`Building ${tagName} ... BEGIN`);
    console.log('Backing up the original package.json');
    backupOriginalPackageJson();
    console.log('Creating the nightly version of package.json');
    createNightlyVersionInPackageJson();
    console.log('Publishing to npm');
    publishToNpm(tagName);
    console.log('Restoring original package.json');
    revertPackageJson();
    console.log(`Building ${tagName}... DONE`);
  }
  catch (ex) {
    console.log(`Something went wrong with publishing the nightly. This process modifies the package.json, so restore it before committing code! - ${ex.message}`);
    process.exit(1);
  }
}

mainFunction();