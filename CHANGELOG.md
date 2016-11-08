<a name="0.0.41"></a>
## [0.0.41](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.40...v0.0.41) (2016-11-07)


### Bug Fixes

* **webpack:** use source-maps instead of eval for prod builds ([fdd86be](https://github.com/driftyco/ionic-app-scripts/commit/fdd86be))



<a name="0.0.40"></a>
## 0.0.40 (2016-11-07)

### Breaking Changes

`ionic_source_map` variable is now used to drive the `devtool` (sourcemap) value for webpack. It now defaults to `eval` for faster builds. Set it to `source-map` for `typescript` sourcemaps.

### Bug Fixes
* **sourcemaps:** fix source maps for all files ([066de6d](https://github.com/driftyco/ionic-app-scripts/commit/066de6d))
* **sourcemaps:** webpack .ts sourcemaps ([bfca1be](https://github.com/driftyco/ionic-app-scripts/commit/bfca1be))
* **webpack:** modify config to use IONIC_APP_SCRIPTS_DIR variable ([2b7c606](https://github.com/driftyco/ionic-app-scripts/commit/2b7c606))


### Features
* **events:** emit bundler events ([8d73da9](https://github.com/driftyco/ionic-app-scripts/commit/8d73da9))
* **exports:** add templateUpdate and fullBuildUpdate ([a31897d](https://github.com/driftyco/ionic-app-scripts/commit/a31897d))
* **webpack source maps:** make it easy to configure source map type ([03565b7](https://github.com/driftyco/ionic-app-scripts/commit/03565b7))


### Performance Improvements

* **webpack:** speed up webpack build by not using file-system and watches ([23ad195](https://github.com/driftyco/ionic-app-scripts/commit/23ad195))


# 0.0.39 (2016-10-31)
* Switch default bundler to Webpack

# 0.0.36 (2016-10-15)

* Fix handling multiple async template updates


# 0.0.35 (2016-10-15)

* Fix resolving index files correctly
* Fix template rebuilds for multiple templates in one file
* Fix ability to watchers to ignore paths


# 0.0.34 (2016-10-15)

* Fix silently failed bundles
* Fix template path resolving issues


# 0.0.33 (2016-10-14)

* Improve build times for template changes
* Fix bundle updates on template changes


# 0.0.32 (2016-10-14)

* Fix Windows entry path normalization


# 0.0.31 (2016-10-13)

* Add ability use multiple processor cores for various subtasks
* Use typescript `createProgram` to transpile entire app
* Add syntax highlighting and colors to typescript, sass and tslint errors
* Improved error messages for typescript errors
* `clean` task only cleans out the `www/build/` directory rather than all of `www/`
* Add task to copy `src/service-worker.js` to `www/service-worker.js`
* Add task to copy `src/manifest.json` to `www/manifest.json`


# 0.0.30 (2016-10-06)

* Fix JS source maps
* Fix template inlining


# 0.0.29 (2016-10-05)

* Addressed memory usage error
* Dev builds no longer use the `.tmp` directory
* Dev build entry files should be the source `main.dev.ts` file
* Custom rollup configs should remove the `ngTemplate()` plugin
