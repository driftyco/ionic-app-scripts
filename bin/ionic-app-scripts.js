#!/usr/bin/env node

if (process.argv.length > 2) {

  if (process.env.npm_config_argv) {
    try {
      var npmRunArgs = JSON.parse(process.env.npm_config_argv);
      if (npmRunArgs && npmRunArgs.original && npmRunArgs.original.length > 2) {
        // add flags from original "npm run" command
        for (var i = 2; i < npmRunArgs.original.length; i++) {
          process.argv.push(npmRunArgs.original[i]);
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  require('../index').run(process.argv[2]);

} else {
  console.error('Missing ionic app script task name');
}
