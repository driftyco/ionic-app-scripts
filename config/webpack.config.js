var path = require('path');
var webpack = require('webpack');

var ionicWebpackFactoryPath = path.join(process.env.IONIC_APP_SCRIPTS_DIR, 'dist', 'webpack', 'ionic-webpack-factory.js');
var ionicWebpackFactory = require(ionicWebpackFactoryPath);

function getEntryPoint() {
  if (process.env.IONIC_ENV === 'prod') {
    return '{{TMP}}/app/main.prod.js';
  }
  return '{{SRC}}/app/main.dev.ts';
}

function getPlugins() {
  if (process.env.IONIC_ENV === 'prod') {
    return [
      // This helps ensure the builds are consistent if source hasn't changed:
      new webpack.optimize.OccurrenceOrderPlugin(),

      // Try to dedupe duplicated modules, if any:
      // Add this back in when Angular fixes the issue: https://github.com/angular/angular-cli/issues/1587
      //new DedupePlugin()
    ];
  }

  // for dev builds, use our custom environment
  return [
    ionicWebpackFactory.getIonicEnvironmentPlugin()
  ];
}

function getSourcemapLoader() {
  if (process.env.IONIC_ENV === 'prod') {
    // TODO figure out the disk loader, it's not working yet
    return [];
  }

  return [
    {
      test: /\.ts$/,
      loader: path.join(process.env.IONIC_APP_SCRIPTS_DIR, 'dist', 'webpack', 'typescript-sourcemap-loader-memory.js')
    }
  ];
}

function getDevtool() {
  if (process.env.IONIC_ENV === 'prod') {
    // for now, just force source-map for prod builds
    return 'source-map';
  }

  return process.env.IONIC_SOURCE_MAP;
}

module.exports = {
  entry: getEntryPoint(),
  output: {
    path: '{{BUILD}}',
    filename: 'main.js',
    devtoolModuleFilenameTemplate: ionicWebpackFactory.getSourceMapperFunction(),
  },
  devtool: getDevtool(),

  resolve: {
    extensions: ['.js', '.ts', '.json']
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json'
      }
    ].concat(getSourcemapLoader())
  },

  plugins: getPlugins(),

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};