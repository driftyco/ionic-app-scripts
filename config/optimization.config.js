var path = require('path');
var webpack = require('webpack');
var ionicWebpackFactory = require(process.env.IONIC_WEBPACK_FACTORY);

module.exports = {
  entry: process.env.IONIC_APP_ENTRY_POINT,
  output: {
    path: '{{BUILD}}',
    publicPath: 'build/',
    filename: 'deptree.js',
  },

  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      '@app/env': path.resolve('src/environments/environment' + (process.env.IONIC_ENV === 'prod' ? '' : '.' + process.env.IONIC_ENV) + '.ts')
    }
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: process.env.IONIC_OPTIMIZATION_LOADER
      },
      {
        test: /\.js$/,
        loader: process.env.IONIC_OPTIMIZATION_LOADER
      }
    ]
  },

  plugins: [
    ionicWebpackFactory.getIonicOptimizationEnvironmentPlugin(),
  ],

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
