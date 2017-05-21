<a name="1.3.7"></a>
## [1.3.7](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.6...v1.3.7) (2017-05-04)


### Bug Fixes

* **config:** create new file cache if not defined, even on existing context object ([4359b3d](https://github.com/driftyco/ionic-app-scripts/commit/4359b3d))
* **generators:** import paths correct on windows ([d778857](https://github.com/driftyco/ionic-app-scripts/commit/d778857))
* **optimizations:** don't ever remove menu-types since it's not a side-effect in menu, it is used just for types ([d7a4d1e](https://github.com/driftyco/ionic-app-scripts/commit/d7a4d1e))
* **optimizations:** fix multiple bugs (components not being purged, overlays not working from providers, etc) for manual tree shaking ([4b538c7](https://github.com/driftyco/ionic-app-scripts/commit/4b538c7))
* **webpack:** fix issue where bundles output to build dir sub directo… ([#938](https://github.com/driftyco/ionic-app-scripts/issues/938)) ([aaa9d3c](https://github.com/driftyco/ionic-app-scripts/commit/aaa9d3c))


### Features

* **bonjour:** adds service auto-discovery ([c17e6df](https://github.com/driftyco/ionic-app-scripts/commit/c17e6df))



<a name="1.3.6"></a>
## [1.3.6](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.5...v1.3.6) (2017-04-27)


### Bug Fixes

* **webpack:** fix issue PR introduced with lazy loaded modules and webpack throwing an invalid error ([fb8b69a](https://github.com/driftyco/ionic-app-scripts/commit/fb8b69a))


### Features

* **optimization:** enable manual tree shaking by default ([1c57ee6](https://github.com/driftyco/ionic-app-scripts/commit/1c57ee6))



<a name="1.3.5"></a>
## [1.3.5](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.4...v1.3.5) (2017-04-26)


### Bug Fixes

* **build:** fix `extends` in `ts-config.json` ([#910](https://github.com/driftyco/ionic-app-scripts/issues/910)) ([0f01603](https://github.com/driftyco/ionic-app-scripts/commit/0f01603))
* **deep-linking:** fix issue where deep link config ends up being null when full build is triggered via a change to a template file with the identical content ([68fc463](https://github.com/driftyco/ionic-app-scripts/commit/68fc463))
* **serve:** Fix for browser not opening on linux, fixes [#425](https://github.com/driftyco/ionic-app-scripts/issues/425) ([#909](https://github.com/driftyco/ionic-app-scripts/issues/909)) ([77edbc6](https://github.com/driftyco/ionic-app-scripts/commit/77edbc6))


### Features

* **sass:** add option to pass addition postcss plugins ([#369](https://github.com/driftyco/ionic-app-scripts/issues/369)) ([be30a40](https://github.com/driftyco/ionic-app-scripts/commit/be30a40))



<a name="1.3.4"></a>
## [1.3.4](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.3...v1.3.4) (2017-04-18)


### Bug Fixes

* **webpack:** make ionic-angular/util dir dynamic and use the environment variable of ionic angular ([d3346b3](https://github.com/driftyco/ionic-app-scripts/commit/d3346b3))



<a name="1.3.3"></a>
## [1.3.3](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.2...v1.3.3) (2017-04-14)


### Bug Fixes

* **optimizations:** temporarily do not purge ctor params from any of angular ([212146c](https://github.com/driftyco/ionic-app-scripts/commit/212146c))



<a name="1.3.2"></a>
## [1.3.2](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.1...v1.3.2) (2017-04-12)


### Bug Fixes

* **deep-linking:** fix bug with null deep link config when modifying the main NgModule file (app.module.ts) ([759bb4f](https://github.com/driftyco/ionic-app-scripts/commit/759bb4f))
* **optimization:** don't purge ctorParams for angular core or angular platform browser ([9562181](https://github.com/driftyco/ionic-app-scripts/commit/9562181))
* **uglifyjs:** only minify files processed by webpack or rollup ([30ecdd8](https://github.com/driftyco/ionic-app-scripts/commit/30ecdd8))



<a name="1.3.1"></a>
## [1.3.1](https://github.com/driftyco/ionic-app-scripts/compare/v1.3.0...v1.3.1) (2017-04-06)


### Bug Fixes

* **config:** revert change and once again transpile bundle by default. ([b558584](https://github.com/driftyco/ionic-app-scripts/commit/b558584))
* **decorators:** don't remove third party transpiled (not static) decorators ([3a3259a](https://github.com/driftyco/ionic-app-scripts/commit/3a3259a))
* **deep-linking:** don't force the main bundle to be re-built unless the deep link config changed ([02b8e97](https://github.com/driftyco/ionic-app-scripts/commit/02b8e97))
* **errors:** better error msg reporting from worker threads ([d9d000a](https://github.com/driftyco/ionic-app-scripts/commit/d9d000a))
* **uglifyjs:** better error msg reporting ([49c0afb](https://github.com/driftyco/ionic-app-scripts/commit/49c0afb))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/driftyco/ionic-app-scripts/compare/v1.2.5...v1.3.0) (2017-04-05)


### Features

* **optimization:** purge decorators enabled by default ([b626e00](https://github.com/driftyco/ionic-app-scripts/commit/b626e00))
* **optimizations:** purge transpiled decorators ([ba5e0cd](https://github.com/driftyco/ionic-app-scripts/commit/ba5e0cd))



<a name="1.2.5"></a>
## [1.2.5](https://github.com/driftyco/ionic-app-scripts/compare/v1.2.4...v1.2.5) (2017-03-31)


### Bug Fixes

* **webpack:** fixes bugs where some third party libs didn't load correctly ([e7559e5](https://github.com/driftyco/ionic-app-scripts/commit/e7559e5))



<a name="1.2.4"></a>
## [1.2.4](https://github.com/driftyco/ionic-app-scripts/compare/v1.2.3...v1.2.4) (2017-03-30)

### Refactor
* **deep-linking:** set default segment value to filename without extension([5a97ba5](https://github.com/driftyco/ionic-app-scripts/commit/5a97ba5))

<a name="1.2.3"></a>
## [1.2.3](https://github.com/driftyco/ionic-app-scripts/compare/v1.2.2...v1.2.3) (2017-03-29)


### Bug Fixes

* **deep-linking:** Deep linking fixes for Windows and non-unix paths

* **script:** linux only accepts one argument after shebang, so revert giving app-scripts more memory by default ([0999f23](https://github.com/driftyco/ionic-app-scripts/commit/0999f23)), closes [#838](https://github.com/driftyco/ionic-app-scripts/issues/838)



<a name="1.2.2"></a>
## [1.2.2](https://github.com/driftyco/ionic-app-scripts/compare/v1.2.1...v1.2.2) (2017-03-27)


### Bug Fixes

* **generators:** use correct path and handle providers correctly ([e82d5ff](https://github.com/driftyco/ionic-app-scripts/commit/e82d5ff))
* **rollup:** pass all config options to generate ([3502360](https://github.com/driftyco/ionic-app-scripts/commit/3502360))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/driftyco/ionic-app-scripts/compare/v1.2.0...v1.2.1) (2017-03-26)


### Bug Fixes

* **deep-linking:** only attempt to inject deep-link config if there isn't an existing config and the ([507f1a8](https://github.com/driftyco/ionic-app-scripts/commit/507f1a8))
* **rollup:** fix bug with not generating source-map correctly ([3b1fd16](https://github.com/driftyco/ionic-app-scripts/commit/3b1fd16))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/driftyco/ionic-app-scripts/compare/v1.1.4...v1.2.0) (2017-03-24)


### Bug Fixes

* **deep-linking:** Fix issue with deep-linking when attempting to update a template and failing, resulting in a full build but not processing deep links ([6b158d3](https://github.com/driftyco/ionic-app-scripts/commit/6b158d3))
* **optimization:** fix out of memory errors by providing more memory by default ([b4c287a](https://github.com/driftyco/ionic-app-scripts/commit/b4c287a))
* **optimizations:** only store ionic and src files in memory ([f51314f](https://github.com/driftyco/ionic-app-scripts/commit/f51314f))
* **uglify:** check for correct file extension ([d17f2e1](https://github.com/driftyco/ionic-app-scripts/commit/d17f2e1))
* **uglify:** verify source maps are generated correctly for all bundles, tests ([fc44ca6](https://github.com/driftyco/ionic-app-scripts/commit/fc44ca6))
* **utils:** assign correct type ([3c3666c](https://github.com/driftyco/ionic-app-scripts/commit/3c3666c))
* **watch:** fixed bug where options.ignore was being ignored if it's an array ([7f1e54c](https://github.com/driftyco/ionic-app-scripts/commit/7f1e54c))
* **watch:** queue builds ([06e4971](https://github.com/driftyco/ionic-app-scripts/commit/06e4971))
* **watch:** queue buildUpdates events to avoid race conditions when bundling/building ([43caefa](https://github.com/driftyco/ionic-app-scripts/commit/43caefa))
* **webpack:** don't overwrite css files when outputting webpack files ([a32649f](https://github.com/driftyco/ionic-app-scripts/commit/a32649f))


### Features

* **serve:** change http-server to use request hostname instead of the configured hostname. ([8e1e81a](https://github.com/driftyco/ionic-app-scripts/commit/8e1e81a))
* **deep-linking:** generate default NgModule when missing by default ([90138fa](https://github.com/driftyco/ionic-app-scripts/commit/90138fa))
* **deep-linking:** parsing deeplink decorator is now enabled by default, no longer experimental ([e097d4e](https://github.com/driftyco/ionic-app-scripts/commit/e097d4e))
* **deep-linking:** upgrade script to generate NgModules for pages with [@DeepLink](https://github.com/DeepLink) decorator ([2943188](https://github.com/driftyco/ionic-app-scripts/commit/2943188))
* **generators:** generators for page, component, directive, pipe, provider ([e2a45e4](https://github.com/driftyco/ionic-app-scripts/commit/e2a45e4))
* **minification:** code-split bundles will be minified ([#814](https://github.com/driftyco/ionic-app-scripts/issues/814)) ([d8d9a4e](https://github.com/driftyco/ionic-app-scripts/commit/d8d9a4e))



<a name="1.1.4"></a>
## [1.1.4](https://github.com/driftyco/ionic-app-scripts/compare/v1.1.3...v1.1.4) (2017-02-23)


### Bug Fixes

* **optimizations:** comment out code instead of purge it so source-maps don't error out in some edge ([1dedc53](https://github.com/driftyco/ionic-app-scripts/commit/1dedc53))
* **watch:** make default watch fail-to-start timeout configurable so it works more reliably on slow ([2e2a647](https://github.com/driftyco/ionic-app-scripts/commit/2e2a647)), closes [#772](https://github.com/driftyco/ionic-app-scripts/issues/772)



<a name="1.1.3"></a>
## [1.1.3](https://github.com/driftyco/ionic-app-scripts/compare/v1.1.2...v1.1.3) (2017-02-17)


### Bug Fixes

* **config:** Setting readConfigJson constant wrong ([#761](https://github.com/driftyco/ionic-app-scripts/issues/761)) ([64bc17f](https://github.com/driftyco/ionic-app-scripts/commit/64bc17f))
* **source-maps:** source map must correspond to .js file name with a .map at the end ([debd88b](https://github.com/driftyco/ionic-app-scripts/commit/debd88b))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/driftyco/ionic-app-scripts/compare/v1.1.1...v1.1.2) (2017-02-16)


### Bug Fixes

* **deep-links:** handle configs with internal arrays ([a7df816](https://github.com/driftyco/ionic-app-scripts/commit/a7df816))
* **deep-links:** only provide deep links to webpack that contain the import used in code and the abs ([fae4862](https://github.com/driftyco/ionic-app-scripts/commit/fae4862))
* **optimizations:** remove the js file created by the optimizations bundling pass ([c0bb3f4](https://github.com/driftyco/ionic-app-scripts/commit/c0bb3f4))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/driftyco/ionic-app-scripts/compare/v1.1.0...v1.1.1) (2017-02-15)


### Bug Fixes

* **config:** node_modules directory should not be configurable (users were finding it confusing) ([1f58aaa](https://github.com/driftyco/ionic-app-scripts/commit/1f58aaa))
* **copy:** support overriding config entries with empty objects ([5879a8b](https://github.com/driftyco/ionic-app-scripts/commit/5879a8b))
* **deeplinks:** make deep link config parsing support 2.x and 3.x deep link config ([1ac7116](https://github.com/driftyco/ionic-app-scripts/commit/1ac7116))
* **deeplinks:** provide deep-links config to webpack as needed vs via the constructor ([a735e96](https://github.com/driftyco/ionic-app-scripts/commit/a735e96))
* **http-server:** drive reading ionic.config.json based on config value ([e2d0d83](https://github.com/driftyco/ionic-app-scripts/commit/e2d0d83))
* **optimizations:** throw error when ionic-angular index file isn't found ([6437005](https://github.com/driftyco/ionic-app-scripts/commit/6437005))
* **transpile:** get tsconfig.json location from config value ([79b0eeb](https://github.com/driftyco/ionic-app-scripts/commit/79b0eeb))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/driftyco/ionic-app-scripts/compare/v1.0.1...v1.1.0) (2017-02-11)

### Optimizations
We are starting to introduce optimizations to improve the size of the `bundle` generated by the build process.

The first set of optimizations are behind flags:

`ionic_experimental_manual_treeshaking` will remove Ionic components and code that are not being used from the bundle.
`ionic_experimental_purge_decorators` helps tree shaking by removing unnecessary `decorator` metadata from AoT code.

Since these are experimental, we are looking for feedback on how the work. Please test them out and [let us know](https://github.com/driftyco/ionic-app-scripts/issues) how it goes. See the instructions [here](https://github.com/driftyco/ionic-app-scripts#custom-configuration).


### Features
* **fonts:** remove used fonts for cordova builds ([967f784](https://github.com/driftyco/ionic-app-scripts/commit/967f784))

### Bug Fixes

* **build:** fix test if linting should trigger on file change ([#719](https://github.com/driftyco/ionic-app-scripts/issues/719)) ([e13b857](https://github.com/driftyco/ionic-app-scripts/commit/e13b857))
* **lint:** capture results of all linted files ([eb4314e](https://github.com/driftyco/ionic-app-scripts/commit/eb4314e)), closes [#725](https://github.com/driftyco/ionic-app-scripts/issues/725)
* **optimizations:** make optimizations work on windows and mac ([5fe21f3](https://github.com/driftyco/ionic-app-scripts/commit/5fe21f3))
* **serve:** assign all ports dynamically ([#727](https://github.com/driftyco/ionic-app-scripts/issues/727)) ([6b4115c](https://github.com/driftyco/ionic-app-scripts/commit/6b4115c))
* **webpack:** fix bug with using [name] for output file name ([1128c9c](https://github.com/driftyco/ionic-app-scripts/commit/1128c9c))






<a name="1.0.1"></a>
## [1.0.1](https://github.com/driftyco/ionic-app-scripts/compare/v1.0.0...v1.0.1) (2017-02-07)

### Breaking Changes

This release was accidentally published with a breaking change for Deep Links. If you're using Deep Links, please don't upgrade to this version. We are in the process of changing the DeepLinks API slightly.

### Bug Fixes

* **angular:** support angular 2.3+ ngc api ([13e930a](https://github.com/driftyco/ionic-app-scripts/commit/13e930a))
* **deep-linking:** works when there isn't a valid deep link config ([62f05fc](https://github.com/driftyco/ionic-app-scripts/commit/62f05fc))
* **deep-links:** adjust paths for AoT ([4055d73](https://github.com/driftyco/ionic-app-scripts/commit/4055d73))
* **sass:** output valid source maps, that chrome can parse ([#306](https://github.com/driftyco/ionic-app-scripts/issues/306)) ([6589550](https://github.com/driftyco/ionic-app-scripts/commit/6589550))
* **source-maps:** always generate source map, then purge them if not needed in postprocess step ([d26b44c](https://github.com/driftyco/ionic-app-scripts/commit/d26b44c))


### Features

* **createWorker:** pass argv and config_argv to spawned processes ([#487](https://github.com/driftyco/ionic-app-scripts/issues/487)) ([02dfff8](https://github.com/driftyco/ionic-app-scripts/commit/02dfff8))
* **lint:** new option to have stand alone lint bail ([b3bb906](https://github.com/driftyco/ionic-app-scripts/commit/b3bb906))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.48...v1.0.0) (2017-01-06)


### Upgrade Instructions
Execute the following command from your ionic project. This installs a new peer dependency called `sw-toolbox` that is used to simplify implementing a service-worker.

```
npm install sw-toolbox --save --save-exact
```


### Bug Fixes

* **build:** check to ensure tsconfig contains sourcemaps true. ([e6bcf22](https://github.com/driftyco/ionic-app-scripts/commit/e6bcf22))
* **config:** resolve any inputs that could be paths to absolute paths ([50876eb](https://github.com/driftyco/ionic-app-scripts/commit/50876eb))
* **copy:** check for null object and src/dest ([eabd125](https://github.com/driftyco/ionic-app-scripts/commit/eabd125))
* **ngc:** revert change to purge decorators (Angular CLI did too) ([8aae85c](https://github.com/driftyco/ionic-app-scripts/commit/8aae85c))
* **webpack:** update environment plugin for webpack 2 RC3 ([be3aac1](https://github.com/driftyco/ionic-app-scripts/commit/be3aac1))
* **websockets:** fix exception when no ws clients connected during rebuild ([#616](https://github.com/driftyco/ionic-app-scripts/issues/616)) ([8685bf8](https://github.com/driftyco/ionic-app-scripts/commit/8685bf8))



<a name="0.0.48"></a>
## [0.0.48](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.47...v0.0.48) (2016-12-19)

### Upgrade Instructions
`@ionic/app-scripts` version `0.0.47` had some breaking changes so please make sure you have performed those upgrade instructions.

### Bug Fixes

* **diagnostics:** fix null pointers ([72adc86](https://github.com/driftyco/ionic-app-scripts/commit/72adc86))
* **inline-templates:** check for existence of content ([#557](https://github.com/driftyco/ionic-app-scripts/issues/557)) ([b68e125](https://github.com/driftyco/ionic-app-scripts/commit/b68e125))
* **logging:** don't log msgs about websocket state ([18185fb](https://github.com/driftyco/ionic-app-scripts/commit/18185fb))
* **optimization:** stop removing decorators ([45b0255](https://github.com/driftyco/ionic-app-scripts/commit/45b0255))
* **serve:** find an open port for the notification server if port is used. ([d6de413](https://github.com/driftyco/ionic-app-scripts/commit/d6de413))
* **copy:** generate project context if it doesn't exist ([26f6db8](https://github.com/driftyco/ionic-app-scripts/commit/26f6db8a7d3398b940cfb4c4b3eb4a6f141e1be7#diff-b477061dcc036b7490cfc73741747819))


### Features

* **sass:** enable Sass indented files compilation ([#565](https://github.com/driftyco/ionic-app-scripts/issues/565)) ([f632298](https://github.com/driftyco/ionic-app-scripts/commit/f632298))



<a name="0.0.47"></a>
## [0.0.47](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.46...v0.0.47) (2016-12-12)

### Upgrade Instructions

#### Install latest Ionic CLI
Install the latest ionic cli. `sudo` may be required depending upon your `npm` set-up.

```
npm install -g ionic@latest
```

#### Entry Point Changes
Delete `main.dev.ts` and `main.prod.ts` and create a `main.ts` file with the following content:

```
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule);
```

#### Dev Builds By Default Changes
All builds are now development (non-AoT) builds by default. This allows for a better development experience when testing on a device. To get started, please follow the steps below.

Make sure the `scripts` section of `package.json` looks like this:

```
  "scripts": {
    "ionic:build": "ionic-app-scripts build",
    "ionic:serve": "ionic-app-scripts serve"
  }
```

`ionic run android --prod` will do a production build that utilizes AoT compiling and minifaction.
`ionic emulate ios --prod` will do a production build that utilizes AoT compiling and minifaction.
`ionic run android` will do a development build
`ionic emulate ios` will do a development build

If you wish to run AoT but disable minifaction, do the following
`ionic run android --aot`
`ionic emulate ios --aot`


#### Source Map Changes
Change `ionic_source_map` to `ionic_source_map_type` in package.json if it is overridden.

#### Config Changes
There were significant improvements/changes to most configs. Please review the changes and make sure any custom configs are up to date.

#### Validate TSConfig settings
Verify that `tsconfig.json` is up to date with recommended settings:

```
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "declaration": false,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": [
      "dom",
      "es2015"
    ],
    "module": "es2015",
    "moduleResolution": "node",
    "sourceMap": true,
    "target": "es5"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ],
  "compileOnSave": false,
  "atom": {
    "rewriteTsconfig": false
  }
}
```


### Breaking Changes
1. `main.dev.ts` and `main.prod.ts` have been deprecated in favor of `main.ts` with the content of `main.dev.ts`. The content of `main.ts` will be optimized at build time for production builds.
2. Builds are now always development (non-AoT) by default. To enable `prod` builds, use the `--prod` option.
3. `copy.config` and `watch.config` have breaking changes moving to an easier-to-extend configuration style.
4. `copy.config` uses `node-glob` instead of `fs-extra` to do the copy. Migrate from directory/files to globs in any custom configs.
5. `ionic_source_map` configuration has been changed to `ionic_source_map_type`.
6. Source maps now use `source-map` devtool option by default instead of `eval`. Change `ionic_source_map_type` option to return to the faster building `eval`.

### Bug Fixes

* **AoT:** dynamically enable prod mode for AoT builds ([0594803](https://github.com/driftyco/ionic-app-scripts/commit/0594803))
* **AoT:** use in-memory data store instead of .tmp directory for AoT codegen ([93106ff](https://github.com/driftyco/ionic-app-scripts/commit/93106ff))
* **build:** every build should run clean sync and copy async. ([6d4eb6e](https://github.com/driftyco/ionic-app-scripts/commit/6d4eb6e))
* **copy:** Resolve race condition in copy task, move to glob config ([cc99a73](https://github.com/driftyco/ionic-app-scripts/commit/cc99a73))
* **lab:** add lab to files ([f42c980](https://github.com/driftyco/ionic-app-scripts/commit/f42c980))
* **livereload:** livereload now correctly serves cordova plugins on run and emulate. ([a0c3f5d](https://github.com/driftyco/ionic-app-scripts/commit/a0c3f5d))
* **livereload:** on project build all pages connected should reload. ([#513](https://github.com/driftyco/ionic-app-scripts/issues/513)) ([62d6b23](https://github.com/driftyco/ionic-app-scripts/commit/62d6b23))
* **livereload:** use localhost instead of 0.0.0.0 when injecting live reload script ([#450](https://github.com/driftyco/ionic-app-scripts/issues/450)) ([7f8a0c3](https://github.com/driftyco/ionic-app-scripts/commit/7f8a0c3))
* **logging:** remove unnecessary websocket error msg, clean up copy error msg ([1517b06](https://github.com/driftyco/ionic-app-scripts/commit/1517b06))
* **ngc:** simpler AoT error reporting ([1b0f163](https://github.com/driftyco/ionic-app-scripts/commit/1b0f163))
* **serve:** add flag to indicate to serve for a cordova app ([93782e7](https://github.com/driftyco/ionic-app-scripts/commit/93782e7))
* **source-maps:** use detailed source-map as default, fix windows path issue ([19464b3](https://github.com/driftyco/ionic-app-scripts/commit/19464b3))
* **workers:** generate context in worker threads ([af036ec](https://github.com/driftyco/ionic-app-scripts/commit/af036ec))


### Features

* **build:** replace --dev flag with --prod and add flags --aot, --minifyJs, --minifyCss, --optimizeJs ([99922ce](https://github.com/driftyco/ionic-app-scripts/commit/99922ce))
* **bundle:** pre and post bundle hooks ([4835550](https://github.com/driftyco/ionic-app-scripts/commit/4835550))
* **copy:** update copy config to move web workers ([a909fc4](https://github.com/driftyco/ionic-app-scripts/commit/a909fc4))
* **lab:** fresh coat of paint ([edb6f09](https://github.com/driftyco/ionic-app-scripts/commit/edb6f09))
* **replacePathVars:** support interpolation of objects and arrays ([#449](https://github.com/driftyco/ionic-app-scripts/issues/449)) ([e039d46](https://github.com/driftyco/ionic-app-scripts/commit/e039d46))
* all arguments passed should be compared as case insensitive ([085c897](https://github.com/driftyco/ionic-app-scripts/commit/085c897))



<a name="0.0.46"></a>
## [0.0.46](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.44...v0.0.46) (2016-11-21)


### Bug Fixes

* **build:** better support for saving multiple files at a time ([254bb6c](https://github.com/driftyco/ionic-app-scripts/commit/254bb6c))
* **copy:** ionicons copied from ionicons ([69f89a8](https://github.com/driftyco/ionic-app-scripts/commit/69f89a8))
* **errors:** skip HTTP errors ([5906167](https://github.com/driftyco/ionic-app-scripts/commit/5906167))
* **proxies:** Wrong parameter in Logger.info, in setupProxies function causing proxies not to load ([#395](https://github.com/driftyco/ionic-app-scripts/issues/395)) ([316b1de](https://github.com/driftyco/ionic-app-scripts/commit/316b1de))
* **typescript:** lock typescript version to 2.0.x for now due to build error with 2.1.x ([ef7203b](https://github.com/driftyco/ionic-app-scripts/commit/ef7203b))
* **webpack:** fix path resolution ([97c23f9](https://github.com/driftyco/ionic-app-scripts/commit/97c23f9))
* **webpack:** reference json-loader to account for webpack breaking change ([d6fe709](https://github.com/driftyco/ionic-app-scripts/commit/d6fe709))
* **webpack:** resolve modules to rootDir ([#365](https://github.com/driftyco/ionic-app-scripts/issues/365)) ([64eb845](https://github.com/driftyco/ionic-app-scripts/commit/64eb845))


### Features

* **options:** allow users to pass their own cleanCss Options ([#377](https://github.com/driftyco/ionic-app-scripts/issues/377)) ([20df6d4](https://github.com/driftyco/ionic-app-scripts/commit/20df6d4))


<a name="0.0.45"></a>
## [0.0.45](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.44...v0.0.45) (2016-11-17)


### Bug Fixes

* **errors:** runtime error immediately, selectable stack ([70f68da](https://github.com/driftyco/ionic-app-scripts/commit/70f68da))
* **inline-templates:** update bundle and memory file representation on template change ([11a949d](https://github.com/driftyco/ionic-app-scripts/commit/11a949d))
* **rollup:** invalidate cache on template change ([80c0eb6](https://github.com/driftyco/ionic-app-scripts/commit/80c0eb6))
* **webpack:** invalidate cache by use of timestamps ([4d6bbd5](https://github.com/driftyco/ionic-app-scripts/commit/4d6bbd5))


### Features

* **run-build-update:** handle linked npm modules ([#375](https://github.com/driftyco/ionic-app-scripts/issues/375)) ([0f113c8](https://github.com/driftyco/ionic-app-scripts/commit/0f113c8))
* **serve:** add '/ionic-lab' as an alias for the lab html file path. ([c319404](https://github.com/driftyco/ionic-app-scripts/commit/c319404))



<a name="0.0.44"></a>
## [0.0.44](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.43...v0.0.44) (2016-11-15)


### Bug Fixes

* **debug:** cmd+shift+8 to show debug menu ([a26d729](https://github.com/driftyco/ionic-app-scripts/commit/a26d729))
* **error:** (cmd/ctrl)+8 for debug menu ([89550af](https://github.com/driftyco/ionic-app-scripts/commit/89550af))
* **error:** add header padding for cordova iOS ([5c4c547](https://github.com/driftyco/ionic-app-scripts/commit/5c4c547))
* **error:** apply correct css for runtime error close ([81f1d75](https://github.com/driftyco/ionic-app-scripts/commit/81f1d75))
* **error:** fix content scrolling ([3b82465](https://github.com/driftyco/ionic-app-scripts/commit/3b82465))
* **error:** reload immediately after js/html update ([07f918e](https://github.com/driftyco/ionic-app-scripts/commit/07f918e))
* **error:** safari css fixes ([7c2fb59](https://github.com/driftyco/ionic-app-scripts/commit/7c2fb59))
* **serve:** correct paths so that --lab works ([1d99a98](https://github.com/driftyco/ionic-app-scripts/commit/1d99a98))
* **serve:** open browser to localhost ([14275c7](https://github.com/driftyco/ionic-app-scripts/commit/14275c7))
* **transpile:** normalize and resolve paths always for OS independence ([ca6c889](https://github.com/driftyco/ionic-app-scripts/commit/ca6c889))
* **watch:** fallback for when chokidar watch ready/error don't fire (happens on windows when file is ([519cd7f](https://github.com/driftyco/ionic-app-scripts/commit/519cd7f)), closes [#282](https://github.com/driftyco/ionic-app-scripts/issues/282)
* **watch:** watch now ignores Mac OS meta data files ([02d0b8d](https://github.com/driftyco/ionic-app-scripts/commit/02d0b8d)), closes [#331](https://github.com/driftyco/ionic-app-scripts/issues/331)
* **webpack:** source maps link to original src for ide debugging ([39edd2e](https://github.com/driftyco/ionic-app-scripts/commit/39edd2e))


### Features

* **debug:** debug menu options ([53d6e30](https://github.com/driftyco/ionic-app-scripts/commit/53d6e30))
* **debug:** shake device to show debug menu ([770f4e3](https://github.com/driftyco/ionic-app-scripts/commit/770f4e3))
* **error:** client runtime error reporting ([fc40b92](https://github.com/driftyco/ionic-app-scripts/commit/fc40b92))
* **error:** syntax and error highlighting ([8836310](https://github.com/driftyco/ionic-app-scripts/commit/8836310))



<a name="0.0.43"></a>
## [0.0.43](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.42...v0.0.43) (2016-11-10)


### Bug Fixes

* **rollup:** removing rollup metadata prefix for paths ([350a288](https://github.com/driftyco/ionic-app-scripts/commit/350a288))
* **watch:** remove shorthand arg for watch ([0685c0b](https://github.com/driftyco/ionic-app-scripts/commit/0685c0b)), closes [#290](https://github.com/driftyco/ionic-app-scripts/issues/290)
* **webpack:** typo in import, close [#326](https://github.com/driftyco/ionic-app-scripts/issues/326) ([#341](https://github.com/driftyco/ionic-app-scripts/issues/341)) ([6b89fa2](https://github.com/driftyco/ionic-app-scripts/commit/6b89fa2))



<a name="0.0.42"></a>
## [0.0.42](https://github.com/driftyco/ionic-app-scripts/compare/v0.0.41...v0.0.42) (2016-11-09)

## Upgrade Steps
To use this version of `@ionic/app-scripts`, follow these steps to upgrade:

1. Install the latest version of the ionic cli

  ```
    npm install ionic@latest -g
  ```

  Note: sudo may be required depending on your workstation set-up

2. Update the project's `package.json` file's `script` section to look like this:

  ```
  ...
  "scripts" : {
    "ionic:build": "ionic-app-scripts build",
    "ionic:serve": "ionic-app-scripts serve"
  }
  ...
  ```

  Note: This is removing several deprecated Ionic scripts. If you have any of your own custom scripts, don't remove them.


3. Install the latest version of `@ionic/app-scripts`

  ```
  npm install @ionic/app-scripts@latest --save-dev
  ```

### Bug Fixes

* **bundling:** execute bundle updates if full bundle has completed at least once ([fbe56dc](https://github.com/driftyco/ionic-app-scripts/commit/fbe56dc))
* **sass:** remove broken sass caching ([91faf0b](https://github.com/driftyco/ionic-app-scripts/commit/91faf0b))


### Features

* **error:** use datauri for favicon build status ([892cf4a](https://github.com/driftyco/ionic-app-scripts/commit/892cf4a))
* **errors:** overlay build errors during development ([87f7648](https://github.com/driftyco/ionic-app-scripts/commit/87f7648))



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
