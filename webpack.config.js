var path = require('path');

var webpack = require('webpack');

var packageData = require('./package.json');

var minify = process.argv.indexOf('--minify') != -1;

var filename = [packageData.name, packageData.version, 'js'];
var plugins = [];

if (minify) {
    filename.splice(filename.length - 1, 0, 'min');
    plugins.push(new webpack.optimize.UglifyJsPlugin());
}
module.exports = {
    entry: {
        javascript: path.resolve(__dirname, packageData.main),
        html: './index.html'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: filename.join('.'),
    },
    devtool: 'source-map',
    module: {
      loaders: [
        {
            test: /\.html$/,
            loader: 'file?name=[name].[ext]'
        },
        {
          test: /\.js?$/,
          exclude: /(node_modules)/,
          loader: 'babel'
        },
        {
          test: /\.css?$/,
          loader: 'style-loader!css-loader'
        }
      ]
    },
    plugins: plugins
}
