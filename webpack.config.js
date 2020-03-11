const path = require('path');
const webpack = require('webpack');
const InertEntryPlugin = require('inert-entry-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const manifest_filename = path.join(__dirname, "src", "manifest.json")

module.exports = {
  entry: manifest_filename,
  output: {
    filename: "manifest.json",
    path: path.join(__dirname, "dist", "extension", "maoxian-web-clipper")
  },
  module: {
    rules: [
      {
        test: manifest_filename,
        use: [
          'extricate-loader',
          'interpolate-loader'
        ]
      },
    ]
  },
  plugins: [
    // This is required to use manifest.json as the entry point.
    new InertEntryPlugin(),
    // Clean dist/extension/maoxian-web-clipper in every build.
    new CleanWebpackPlugin(),
  ],
}