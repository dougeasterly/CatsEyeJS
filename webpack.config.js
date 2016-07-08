const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: ["babel-polyfill", path.join(__dirname, "src/cats-eye.ts")],
  output: {
    path: __dirname,
    filename: "cats-eye.bundle.js"
  },
  resolve: {
    extensions: ["", ".js", ".ts"]
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loaders: ["babel?presets=es2015", "ts"]
      },
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        dead_code: true,
        warnings: false
      }
    })
  ]
};
