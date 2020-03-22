const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ExtensionReloader  = require('webpack-extension-reloader');

const pkg = require('./package.json');

const ASSET_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

const manifest_filename = path.join(__dirname, "src", "manifest.json");
const pages_folder = path.join(__dirname, "src", "pages");
const dist_folder = path.join(__dirname, "dist", "extension", "maoxian-web-clipper");

const pages = [
  'popup', 'welcome', 'history', 'home', 'last-clipping-result', 
  'plan-subscription', 'reset-history', 'setting', 'support', 
  'ui-control', 'ui-selection']

const pageEntires = pages.reduce((entries, pageName) => {
  entries[pageName] = path.join(pages_folder, pageName + ".js")
  return entries;
}, {})

const pageHtmls = pages.reduce((htmls, pageName) => {
  htmls.push(
    new HtmlWebpackPlugin({
      template: path.join(pages_folder, pageName + ".html"),
      filename: path.join("pages", pageName + ".html"),
      chunks: [pageName]
    })
  )
  return htmls;
}, [])

const config = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    'content-frame': path.join(__dirname, "src", "js", "content-frame.js"),
    'content': path.join(__dirname, "src", "js", "content.js"),
    'background': path.join(__dirname, "src", "js", "background.js"),
    ...pageEntires
  },
  output: {
    filename: "js/[name].js",
    path: dist_folder
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                '@babel/plugin-transform-regenerator',
                "@babel/plugin-transform-runtime"]
            }
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          // This is necessary to ignore template syntax
          'raw-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
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
    // Clean dist/extension/maoxian-web-clipper before every build.
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      {
        from: "src/manifest.json",
        transform: function (content, path) {
          // generates the manifest file using the package.json informations
          const manifest = JSON.parse(content.toString())
          manifest.author = pkg.author;
          manifest.version = pkg.version;
          manifest.browser_action.default_title = pkg.name;
          return Buffer.from(JSON.stringify(manifest));
        }
      },
      { from: 'src/_locales/en',    to: path.join(dist_folder, '_locales/en') },
      { from: 'src/_locales/zh-CN', to: path.join(dist_folder, '_locales/zh-CN') },
      { from: 'src/icons',          to: path.join(dist_folder, 'icons')}
    ], { copyUnmodified: true }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash].css'
    }),
    new HtmlWebpackPlugin({
      template: path.join(pages_folder, "background.html"),
      filename: path.join("pages", "background.html"),
      chunks: ["background"]
    }),
    // Inset all page htmls
    ...pageHtmls
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
  );
  //TODO: remove it
  config.devtool = 'inline-source-map';
} else if (process.env.NODE_ENV == "development") {
  config.plugins.push(
    new ExtensionReloader({
      port: 9090,
      reloadPage: true,
      entries: {
        contentScript: ['content', 'content-frame'],
        background: 'background',
        extensionPage: 'popup',
      }
    }),
  )
  config.devtool = 'inline-source-map';
}

module.exports = config