To get the latest `@ionic/app-scripts`, please run:

```
npm install @ionic/app-scripts@latest --save-dev
```

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
