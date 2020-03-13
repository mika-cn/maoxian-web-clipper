const path = require('path');
const webpack = require('webpack');
const InertEntryPlugin = require('inert-entry-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ExtensionReloader  = require('webpack-extension-reloader');

const ASSET_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

const manifest_filename = path.join(__dirname, "src", "manifest.json")
const dist_folder = path.join(__dirname, "dist", "extension", "maoxian-web-clipper")

config = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    manifest: manifest_filename
  },
  output: {
    filename: (chunkData) => {
      if (chunkData.chunk.name == "manifest") {
        return "manifest.json";
      }
    },
    path: dist_folder
  },
  module: {
    rules: [
      {
        test: manifest_filename,
        use: [
          '@altairwei/collect-loader',
          'interpolate-loader'
        ]
      },
      {
        test: /\.html$/,
        use: [
          'file-loader?name=[name].[ext]',
          '@altairwei/collect-loader',
          {
            loader: 'html-loader',
            options: {
              esModule: true,
              attrs: [
                'link:href',
                'script:src',
                'img:src'
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'file-loader?outputPath=css',
          'extract-loader',
          'css-loader',
        ]
      },
      {
        test: /\.js$/,
        use: [
          'file-loader?name=[name]-[hash:8].[ext]&outputPath=js',
          'extract-loader',
          'raw-loader'
        ]
      },
      {
        test: new RegExp('\.(' + ASSET_EXTENSIONS.join('|') + ')$'),
        use: [
          'file-loader?outputPath=assets'
        ]
      },
    ]
  },
  plugins: [
    // This is required to use manifest.json as the entry point.
    new InertEntryPlugin(),
    // Clean dist/extension/maoxian-web-clipper before every build.
    new CleanWebpackPlugin(),
    new CopyPlugin([
      { from: 'src/_locales/en',    to: path.join(dist_folder, '_locales/en') },
      { from: 'src/_locales/zh-CN', to: path.join(dist_folder, '_locales/zh-CN') },
    ])
  ],
}

module.exports = config