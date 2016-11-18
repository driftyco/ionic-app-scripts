# Ionic App Scripts

Helper scripts to get [Ionic apps](http://ionicframework.com/) up and running quickly (minus the config overload).

To get the latest `@ionic/app-scripts`, please run:

```
npm install @ionic/app-scripts@latest --save-dev
```

### Config Defaults

Out of the box, Ionic starters have been preconfigured with great defaults for building fast apps, including:

- Multi-core processing tasks in parallel for faster builds
- In-memory file transpiling and bundling
- Transpiling source code to ES5 JavaScript
- Ahead of Time (AoT) template compiling
- Just in Time (JiT) template compiling
- Template inlining for JiT builds
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
    "ionic:build": "ionic-app-scripts build",
    "ionic:serve": "ionic-app-scripts serve"
  },
```

To run the `build` script found in the `package.json` `scripts` property, execute:

```
npm run build
```


## Custom Configuration

In many cases, the defaults which Ionic provides covers most of the scenarios required by developers. However, Ionic App Scripts does provide multiple ways to configure and override the defaults for each of the various tasks. Note that Ionic will always apply its defaults for any property that was not provided by custom configuration.

[Default Config Files](https://github.com/driftyco/ionic-app-scripts/tree/master/config)

### package.json Config

Ionic projects use the `package.json` file for configuration. There's a handy [config](https://docs.npmjs.com/misc/config#per-package-config-settings) property which can be used. Below is an example of setting a custom config file using the `config` property in a project's `package.json`.

```
  "config": {
    "ionic_bundler": "rollup",
    "ionic_source_map": "source-map",
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

| Config File | package.json Config | Cmd-line Flag         |
|-------------|---------------------|-----------------------|
| CleanCss    | `ionic_cleancss`    | `--cleancss` or `-e`  |
| Copy        | `ionic_copy`        | `--copy` or `-y`      |
| Generator   | `ionic_generator`   | `--generator` or `-g` |
| NGC         | `ionic_ngc`         | `--ngc` or `-n`       |
| Rollup      | `ionic_rollup`      | `--rollup` or `-r`    |
| Sass        | `ionic_sass`        | `--sass` or `-s`      |
| TSLint      | `ionic_tslint`      | `--tslint` or `-i`    |
| UglifyJS    | `ionic_uglifyjs`    | `--uglifyjs` or `-u`  |
| Watch       | `ionic_watch`       | `--watch`             |
| Webpack     | `ionic_webpack`     | `--webpack` or `-w`   |


### Overriding Config Values

| Config Values   | package.json Config | Cmd-line Flag | Defaults        | Details        |
|-----------------|---------------------|---------------|-----------------|----------------|
| bundler         | `ionic_bundler`     | `--bundler`   | `webpack`       | Chooses which bundler to use: `webpack` or `rollup` |
| source map type | `ionic_source_map`  | `--sourceMap` | `eval`          | Chooses the webpack `devtool` option. We only support `eval` or `source-map` for now |
| root directory  | `ionic_root_dir`    | `--rootDir`   | `process.cwd()` | The directory path of the Ionic app |
| tmp directory   | `ionic_tmp_dir`     | `--tmpDir`    | `.tmp`          | A temporary directory for codegen'd files using the Angular `ngc` AoT compiler |
| src directory   | `ionic_src_dir`     | `--srcDir`    | `src`           | The directory holding the Ionic src code |
| www directory   | `ionic_www_dir`     | `--wwwDir`    | `www`           | The deployable directory containing everything needed to run the app |
| build directory | `ionic_build_dir`   | `--buildDir`  | `build`         | The build process uses this directory to store generated files, etc |


### Ionic Environment Variables

These environment variables are automatically set to [Node's `process.env`](https://nodejs.org/api/process.html#process_process_env) property. These variables can be useful from within custom configuration files, such as custom `webpack.config.js` file.

| Environment Variable    | Description                                                          |
|-------------------------|----------------------------------------------------------------------|
| `IONIC_ENV`             | Value can be either `prod` or `dev`.                                 |
| `IONIC_ROOT_DIR`        | The absolute path to the project's root directory.                   |
| `IONIC_TMP_DIR`         | The absolute path to the project's temporary directory.              |
| `IONIC_SRC_DIR`         | The absolute path to the app's source directory.                     |
| `IONIC_WWW_DIR`         | The absolute path to the app's public distribution directory.        |
| `IONIC_BUILD_DIR`       | The absolute path to the app's bundled js and css files.             |
| `IONIC_APP_SCRIPTS_DIR` | The absolute path to the `@ionic/app-scripts` node_module directory. |
| `IONIC_SOURCE_MAP`      | The Webpack `devtool` setting. We recommend `eval` or `source-map`.  |

The `process.env.IONIC_ENV` environment variable can be used to test whether it is a `prod` or `dev` build, which automatically gets set by any command. By default the `build` task is `prod`, and the `watch` and `serve` tasks are `dev`. Additionally, using the `--dev` command line flag will force the build to use `dev`.

Please take a look at the bottom of the [default Rollup config file](https://github.com/driftyco/ionic-app-scripts/blob/master/config/rollup.config.js) to see how the `IONIC_ENV` environment variable is being used to conditionally change config values for production builds.


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
| `transpile`| Runs just the `tsc` portion of the dev build.                                                       |
| `watch`    | Runs watch for dev builds.                                                                          |

Example NPM Script:

```
  "scripts": {
    "minify": "ionic-app-scripts minify"
  },
```

## Tips
1. The Webpack `devtool` setting is driven by the `ionic_source_map` variable. It defaults to `eval` for fast builds, but can provide the original source map by changing the value to `source-map`. There are additional values that Webpack supports, but we only support `eval` and `source-maps` for now.


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

## Contributing

We welcome any PRs, issues, and feedback! Please be respectful and follow the [Code of Conduct](https://github.com/driftyco/ionic/blob/master/CODE_OF_CONDUCT.md).

### Publish a release

Execute the following steps to publish a release:

1. Run `npm run build` to generate the `dist` directory
2. Run `npm run test` to validate the `dist` works
3. Temporarily tick the `package.json` version
4. Run `npm run changelog` to append the latest additions to the changelog
5. Manually verify and commit the changelog changes. Often times you'll want to manually add content/instructions
6. Revert the `package.json` version to the original version
7. Run `npm version patch` to tick the version and generate a git tag
8. Run `npm run github-release` to create the github release entry
9. Run `npm publish` to publish the package to npm
