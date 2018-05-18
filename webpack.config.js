const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './radar.js',
  mode: 'production',
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        ecma: 5
      }
    })
  ],
  output: {
    filename: 'radar.min.js',
    path: __dirname
  }
};
