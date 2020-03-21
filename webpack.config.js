const path = require('path');
const webpack = require('webpack');
const InertEntryPlugin = require('inert-entry-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

const pkg = require('./package.json')

const ASSET_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

const manifest_filename = path.join(__dirname, "src", "manifest.json")
const dist_folder = path.join(__dirname, "dist", "extension", "maoxian-web-clipper")

config = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    manifest: manifest_filename,
    background: path.join(__dirname, "src", "js", "background.js")
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
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "pages","background.html"),
      filename: "background.html",
      chunks: ["background"]
    }),
    // Clean dist/extension/maoxian-web-clipper before every build.
    new CleanWebpackPlugin(),
    new CopyPlugin([
      { from: 'src/_locales/en',    to: path.join(dist_folder, '_locales/en') },
      { from: 'src/_locales/zh-CN', to: path.join(dist_folder, '_locales/zh-CN') },
    ]),
    new webpack.ProvidePlugin({
      browser: 'webextension-polyfill'
    }),
  ],
}

if (process.env.NODE_ENV == "production") {
  const zipfile = `${pkg.name}-${pkg.version}.zip`
  config.plugins.push(
    // Remove last zip files
    new RemovePlugin({
      before: {
        root: path.resolve('dist', 'extension'),
        include: [
          zipfile
        ]
      }
    }),
    // Compress dist/extension/maoxian-web-clipper
    // Both .xpi and .crx are zip file, so we only need to create one file
    new ZipPlugin({
      // Relative to Webpack output path
      path: '../',
      filename: zipfile,
    })
  )
}

module.exports = config