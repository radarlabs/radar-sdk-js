const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: process.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'Radar',
    libraryExport: 'default',
    umdNamedDefine: true
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          }
        ]
      }
    ]
  }
};
