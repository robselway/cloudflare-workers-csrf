const path = require('path')

module.exports = {
  entry: {
    bundle: path.join(__dirname, './src/index.ts'),
  },

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
  },

  mode: 'production',

  // mode: 'development',
  // devtool: 'cheap-module-eval-source-map',

  watchOptions: {
    ignored: /node_modules|dist|\.js/g,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    plugins: [],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
      },
    ],
  },
}