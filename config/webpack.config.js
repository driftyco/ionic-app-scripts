var path = require('path');
var webpack = require('webpack');

function getEntryPoint() {
  if (process.env.IONIC_ENV === 'prod') {
    return '{{TMP}}/app/main.prod.js';
  }
  return '{{TMP}}/app/main.dev.js';
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
  return [];
}

function getSourcemapLoader() {
  if (process.env.IONIC_ENV === 'prod') {
    // TODO figure out the disk loader, it's not working yet
    return [];
  }

  return [
    {
      test: /\.js$/,
      loader: path.resolve(path.join(process.cwd(), 'node_modules', '@ionic', 'app-scripts', 'dist', 'loaders', 'typescript-sourcemap-loader-memory.js'))
    }
  ];
}

module.exports = {
  entry: getEntryPoint(),
  output: {
    path: '{{BUILD}}',
    filename: 'main.js'
  },
  devtool: 'source-map',

  resolve: {
    extensions: ['.js', '.json']
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