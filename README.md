# Ionic App Scripts

Helper scripts to get [Ionic apps](http://ionicframework.com/) up and running quickly (minus the config overload).


### Config Defaults

Out of the box, Ionic starters have been preconfigured with great defaults for building fast apps, including:

- Transpiling source code to ES5 JavaScript
- Ahead of Time (AoT) template compiling
- Just in Time (JiT) template compiling
- Bundling modules for faster runtime execution
- Treeshaking unused components and dead-code removal
- Generating CSS from bundled component Sass files
- Autoprefixing vendor CSS prefixes
- Minifying JavaScript files
- Compressing CSS files
- Copying `src` static assets to `www`
- Linting source files
- Watching source files for live-reloading

Just the bullet list above is a little overwhelming, and each task requires quite a bit of development time just to get started. Ionic App Script's intention is to make it easier to complete common tasks so developers can focus on building their app, rather than building build scripts.

Note that the [Ionic Framework's](https://github.com/driftyco/ionic) source is made up of modules and can be packaged by any bundler or build process. However, this project's goal is provide simple scripts to make building Ionic apps easier, while also allowing developers to further configure their build process.


### NPM Scripts

Instead of depending on external task runners, Ionic App Scripts now prefers being executed from [NPM scripts](https://docs.npmjs.com/misc/scripts). Ionic's NPM scripts come preconfigured within the project's `package.json` file. For example, this is the default setup for npm scripts within each starters:

```
  "scripts": {
    "build": "ionic-app-scripts build",
    "watch": "ionic-app-scripts watch"
  },
```

To run the `build` script found in the `package.json` `scripts` property, execute:

```
npm run build
```


## Custom Config Files

In many cases, the defaults which Ionic provides covers most of the scenarios required by developers. However, Ionic App Scripts does provide multiple ways to configure and override the defaults for each of the various tasks. Note that Ionic will always apply its defaults for any property that was not provided by custom configurations.

[Default Config Files](https://github.com/driftyco/ionic-app-scripts/tree/master/config)

### NPM Config

Within the `package.json` file, NPM also provides a handy [config](https://docs.npmjs.com/misc/config#per-package-config-settings) property. Below is an example of setting a custom config file using the `config` property in a project's `package.json`.

```
  "config": {
    "ionic_rollup": "./config/rollup.config.js",
    "ionic_cleancss": "./config/cleancss.config.js"
  },
```

### Command-line Flags

Remember how we're actually running `ionic-app-scripts` from the `scripts` property of project's `package.json` file? Well we can also add command-line flags to each script, or make new scripts with these custom flags. For example:

```
  "scripts": {
    "build": "ionic-app-scripts build --rollup ./config/rollup.config.js",
    "minify": "ionic-app-scripts minify --cleancss ./config/cleancss.config.js",
  },
```

The same command-line flags can be also applied to `npm run` commands too, such as:

```
npm run build --rollup ./config/rollup.config.js
```


### Overriding Config Files

| Config File | NPM Config Property | Cmd-line Flag         |
|-------------|---------------------|-----------------------|
| CleanCss    | `ionic_cleancss`    | `--cleancss` or `-e`  |
| Copy        | `ionic_copy`        | `--copy` or `-y`      |
| Generator   | `ionic_generator`   | `--generator` or `-g` |
| NGC         | `ionic_ngc`         | `--ngc` or `-n`       |
| Rollup      | `ionic_rollup`      | `--rollup` or `-r`    |
| Sass        | `ionic_sass`        | `--sass` or `-s`      |
| TSLint      | `ionic_tslint`      | `--tslint` or `-l`    |
| UglifyJS    | `ionic_uglifyjs`    | `--uglifyjs` or `-u`  |


### Overriding Config Values

| Config Values   | NPM Config Property | Cmd-line Flag | Defaults        |
|-----------------|---------------------|---------------|-----------------|
| root directory  | `ionic_root_dir`    | `--rootDir`   | `process.cwd()` |
| tmp directory   | `ionic_tmp_dir`     | `--tmpDir`    | `.tmp`          |
| src directory   | `ionic_src_dir`     | `--srcDir`    | `src`           |
| www directory   | `ionic_www_dir`     | `--wwwDir`    | `www`           |
| build directory | `ionic_build_dir`   | `--buildDir`  | `build`         |


## All Available Tasks

These tasks are available within `ionic-app-scripts` and can be added to NPM scripts or any Node command.

| Task       | Description                                                                                         |
|------------|-----------------------------------------------------------------------------------------------------|
| `build`    | Full production build. Use `--dev` flag for dev build.                                              |
| `bundle`   | Bundle JS modules.                                                                                  |
| `clean`    | Empty the `www` directory.                                                                          |
| `cleancss` | Compress the output CSS with [CleanCss](https://github.com/jakubpawlowicz/clean-css)                |
| `copy`     | Run the copy tasks, which by defaults copies the `src/assets/` and `src/index.html` files to `www`. |
| `lint`     | Run the linter against the source `.ts` files, using the `tslint.json` config file at the root.     |
| `minify`   | Minifies the output JS bundle and compresses the compiled CSS.                                      |
| `ngc`      | Runs just the `ngc` portion of the production build.                                                |
| `sass`     | Sass compilation of used modules. Bundling must have as least ran once before Sass compilation.     |
| `tsc`      | Runs just the `tsc` portion of the dev build.                                                       |
| `watch`    | Runs watch for dev builds.                                                                          |

Example NPM Script:

```
  "scripts": {
    "minify": "ionic-app-scripts minify"
  },
```


## The Stack

- [Ionic Framework](http://ionicframework.com/)
- [TypeScript Compiler](https://www.typescriptlang.org/)
- [Angular Compiler (NGC)](https://github.com/angular/angular/tree/master/modules/%40angular/compiler-cli)
- [Rollup Module Bundler](http://rollupjs.org/)
- Ionic Component Sass
- [Node Sass](https://www.npmjs.com/package/node-sass)
- [Autoprefixer](https://github.com/postcss/autoprefixer)
- [UglifyJS](http://lisperator.net/uglifyjs/)
- [CleanCss](https://github.com/jakubpawlowicz/clean-css)
- [TSLint](http://palantir.github.io/tslint/)


## Development and publishing

When ready to publish a new version, run the following commands in order:

1.  npm version (patch|minor|major)
2.  npm run build
3.  cd dist
4.  npm publish