const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const chalk = require('react-dev-utils/chalk')
const nodeExternals = require('webpack-node-externals')
const DeleteSourceMaps = require('../scripts/internals/DeleteSourceMaps')
const paths = require('./paths')
const { dependencies: externals } = require(paths.appPackageJson)

DeleteSourceMaps()

const isEnvProduction = process.env.NODE_ENV === 'production'
const isEnvDevelopment = process.env.NODE_ENV === 'development'
const isOpenAnalyzer = process.env.OPEN_ANALYZER === 'true'

module.exports = {
  devtool: process.env.DEBUG_PROD === 'true' ? 'source-map' : false,
  mode: process.env.NODE_ENV,
  watch: isEnvDevelopment,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000
  },
  externals: [...Object.keys(externals || {})],
  target: 'electron-main',
  entry: paths.appMainIndexJs,
  output: {
    path: paths.appBuildMain,
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },

  optimization: {
    minimize: isEnvProduction,
    minimizer: process.env.E2E_BUILD
      ? []
      : [
          new TerserPlugin({
            parallel: true,
            sourceMap: true,
            cache: true
          })
        ]
  },

  plugins: [
    new webpack.NamedModulesPlugin(),
    isEnvProduction &&
      new BundleAnalyzerPlugin({
        analyzerMode: isOpenAnalyzer ? 'server' : 'disabled',
        openAnalyzer: isOpenAnalyzer
      }),
    new ESLintPlugin({
      // Plugin options
      extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
      formatter: require.resolve('react-dev-utils/eslintFormatter'),
      eslintPath: require.resolve('eslint'),
      context: paths.appMain,
      cache: true,
      emitWarning: true,
      // if enable ESLint autofix feature
      // fix: true,
      // ESLint class options
      cwd: paths.appPath,
      resolvePluginsRelativeTo: __dirname
    }),
    new ProgressBarPlugin({
      format: '  Compiling [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
      clear: false,
      width: 60
    })
  ].filter(Boolean),

  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, '..', 'electron'), 'node_modules']
  },

  node: {
    __dirname: false,
    __filename: false
  }
}
