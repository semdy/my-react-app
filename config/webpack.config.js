'use strict'

const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const resolve = require('resolve')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
// const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const getCSSModuleLocalIdent = require('../scripts/getCSSModuleLocalIdent')
const ESLintPlugin = require('eslint-webpack-plugin')
const AntDayJsWebpackPlugin = require('antd-dayjs-webpack-plugin')
// const nodeExternals = require('webpack-node-externals')
const paths = require('./paths')
const modules = require('./modules')
const getClientEnvironment = require('./env')
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
const ForkTsCheckerWebpackPlugin =
  process.env.TSC_COMPILE_ON_ERROR === 'true'
    ? require('react-dev-utils/ForkTsCheckerWarningWebpackPlugin')
    : require('react-dev-utils/ForkTsCheckerWebpackPlugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const chalk = require('react-dev-utils/chalk')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
// const pxtorem = require('postcss-pxtorem')
// const antDarkTheme = require('@ant-design/dark-theme')
// const { getThemeVariables } = require('antd/dist/theme')
const VendorsPrefetchPlugin = require('../scripts/VendorsPrefetchPlugin')
const getVendorsFiles = require('../scripts/getVendorsFiles')
const createEnvironmentHash = require('./webpack/persistentCache/createEnvironmentHash')

const { dependencies: externals } = require(paths.appPackageJson)
const themeConfig = require(paths.themeConfig)

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false'

const reactRefreshRuntimeEntry = require.resolve('react-refresh/runtime')
const reactRefreshWebpackPluginRuntimeEntry = require.resolve(
  '@pmmmwh/react-refresh-webpack-plugin'
)
const babelRuntimeEntry = require.resolve('babel-preset-react-app')
const babelRuntimeEntryHelpers = require.resolve(
  '@babel/runtime/helpers/esm/assertThisInitialized',
  { paths: [babelRuntimeEntry] }
)
const babelRuntimeRegenerator = require.resolve('@babel/runtime/regenerator', {
  paths: [babelRuntimeEntry]
})

// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false'
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true'
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true'
const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000')
const shouldPxToRem = process.env.PX_TO_REM === 'true'

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig)

// Check if Tailwind config exists
const useTailwind = fs.existsSync(path.join(paths.appPath, 'tailwind.config.js'))

// Get the path to the uncompiled service worker (if it exists).
const swSrc = paths.swSrc

// style files regexes
const cssRegex = /\.css$/
const cssModuleRegex = /\.module\.css$/
const sassRegex = /\.(scss|sass)$/
const sassModuleRegex = /\.module\.(scss|sass)$/
const lessRegex = /\.less$/
const lessModuleRegex = /\.module\.less$/

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false
  }

  try {
    require.resolve('react/jsx-runtime')
    return true
  } catch (e) {
    return false
  }
})()

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development'
  const isEnvProduction = webpackEnv === 'production'
  const isEnvElectron = process.env.REACT_APP_ENV === 'electron'

  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile')

  // We will provide `paths.publicUrlOrPath` to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1))

  const shouldUseReactRefresh = env.raw.FAST_REFRESH

  const getPxToRemOptions = () => {
    return (
      shouldPxToRem && [
        'postcss-pxtorem',
        {
          rootValue: 37.5,
          propList: [
            '*',
            '!border',
            '!border-top',
            '!border-right',
            '!border-bottom',
            '!border-left',
            '!border-width',
            '!border-top-width',
            '!border-right-width',
            '!border-bottom-width',
            '!border-left-width'
          ]
        }
      ]
    )
  }

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use '../../' to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {}
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            config: false,
            plugins: !useTailwind
              ? [
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009'
                      },
                      stage: 3
                    }
                  ],
                  // Adds PostCSS Normalize as the reset css with default options,
                  // so that it honors browserslist config in package.json
                  // which in turn let's users customize the target behavior as per their needs.
                  'postcss-normalize',
                  getPxToRemOptions()
                ].filter(Boolean)
              : [
                  'tailwindcss',
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009'
                      },
                      stage: 3
                    }
                  ],
                  getPxToRemOptions()
                ].filter(Boolean)
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment
        }
      }
    ].filter(Boolean)
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            root: paths.appSrc
          }
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: shouldUseSourceMap,
            lessOptions: {
              javascriptEnabled: true,
              // modifyVars: getThemeVariables({
              //   dark: true, // 开启暗黑模式
              //   compact: true, // 开启紧凑模式
              // }) // antDarkTheme // themeConfig || {}
              // modifyVars: antDarkTheme.default,
              modifyVars: themeConfig
            }
          }
        }
      )
    }
    return loaders
  }

  return {
    target: isEnvElectron ? 'electron-renderer' : ['browserslist'],
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    // Stop compilation early in production
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'nosources-source-map'
        : 'none'
      : isEnvDevelopment && 'cheap-module-source-map',
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: paths.appIndexJs,
    output: {
      // The build folder.
      path: isEnvProduction ? (isEnvElectron ? paths.appBuildRenderer : paths.appBuild) : undefined,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/bundle.js',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/images/[name].[hash][ext]',
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: paths.publicUrlOrPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        : isEnvDevelopment && (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'))
    },
    cache: {
      type: 'filesystem',
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter(f => fs.existsSync(f))
      }
    },
    infrastructureLogging: {
      level: 'none'
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2
            },
            mangle: {
              safari10: true
            },
            // Added for profiling in devtools
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true
            }
          }
        }),
        // This is only used in production mode
        new CssMinimizerPlugin()
      ]
      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      // splitChunks: {
      //   // chunks: 'all',
      //   // name: false,
      //   cacheGroups: {
      //     vendors: {
      //       name: 'vendors',
      //       test: /[\\/]node_modules[\\/]/,
      //       priority: 10,
      //       chunks: 'initial'
      //     },
      //     // alioss: {
      //     //   name: 'ali-oss',
      //     //   priority: 20,
      //     //   test: /[\\/]ali-oss[\\/]/
      //     // },
      //     // viewerjs: {
      //     //   name: 'viewerjs',
      //     //   priority: 30,
      //     //   test: /[\\/]viewerjs[\\/]/
      //     // },
      //     // nim: {
      //     //   name: 'nim',
      //     //   priority: 40,
      //     //   test: /NIM_Web_SDK_(.+)$/
      //     // },
      //     js: {
      //       name: 'commons',
      //       test: /\.js$/,
      //       chunks: 'all',
      //       minChunks: 2,
      //       minSize: 0,
      //       priority: 5,
      //       reuseExistingChunk: true
      //     },
      //     styles: {
      //       name: 'styles',
      //       test: /\.(css|less|scss|sass|styl)$/,
      //       chunks: 'all',
      //       minChunks: 2,
      //       minSize: 0
      //     }
      //   }
      // },
      // Keep the runtime chunk separated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      // https://github.com/facebook/create-react-app/issues/5358
      // runtimeChunk: {
      //   name: entrypoint => `runtime-${entrypoint.name}`
      // }
    },
    resolve: {
      // This allows you to set a fallback for where webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebook/create-react-app/issues/253
      modules: ['node_modules', paths.appNodeModules].concat(modules.additionalModulePaths || []),
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`)
        .filter(ext => useTypeScript || !ext.includes('ts')),
      alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
        // Allows for better profiling with ReactDevTools
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling'
        }),
        'moment-timezone': 'dayjs',
        'rc-picker/es/generate/moment': 'rc-picker/es/generate/dayjs',
        'rc-picker/lib/generate/moment': 'rc-picker/lib/generate/dayjs',
        '@': paths.appSrc,
        app: paths.appMain,
        ...(modules.webpackAliases || {})
      },
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.appSrc, [
          paths.appPackageJson,
          reactRefreshRuntimeEntry,
          reactRefreshWebpackPluginRuntimeEntry,
          babelRuntimeEntry,
          babelRuntimeEntryHelpers,
          babelRuntimeRegenerator
        ])
      ]
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Handle node_modules packages that contain sourcemaps
        shouldUseSourceMap && {
          enforce: 'pre',
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          loader: require.resolve('source-map-loader')
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // TODO: Merge this config once `image/avif` is in the mime-db
            // https://github.com/jshttp/mime-db
            {
              test: [/\.avif$/],
              type: 'asset',
              mimetype: 'image/avif',
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit
                }
              }
            },
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: /\.(png|jpe?g|gif|bmp|webp)(\?.*)?$/,
              type: 'asset',
              exclude: paths.appMindIcons,
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit
                }
              }
            },
            {
              test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
              loader: require.resolve('file-loader'),
              options: {
                name: 'static/fonts/[name].[hash:8].[ext]'
              }
            },
            {
              test: /\.svg$/,
              loader: require.resolve('@svgr/webpack'),
              include: paths.appIcons,
              options: {
                prettier: false,
                svgo: false,
                svgoConfig: {
                  plugins: [{ removeViewBox: false }]
                },
                titleProp: true,
                ref: true
              },
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/]
              }
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),
                presets: [
                  [
                    require.resolve('babel-preset-react-app'),
                    {
                      runtime: hasJsxRuntime ? 'automatic' : 'classic'
                    }
                  ]
                ],

                plugins: [
                  isEnvDevelopment &&
                    shouldUseReactRefresh &&
                    require.resolve('react-refresh/babel')
                ].filter(Boolean),
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                compact: isEnvProduction
              }
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [require.resolve('babel-preset-react-app/dependencies'), { helpers: true }]
                ],
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,

                // Babel sourcemaps are needed for debugging into node_modules
                // code.  Without the options below, debuggers like VSCode
                // show incorrect code and set breakpoints on the wrong lines.
                sourceMaps: shouldUseSourceMap,
                inputSourceMap: shouldUseSourceMap
              }
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                modules: {
                  mode: 'icss'
                }
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                modules: {
                  mode: 'local',
                  getLocalIdent: getCSSModuleLocalIdent
                }
              })
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: {
                    mode: 'icss'
                  }
                },
                'sass-loader'
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: {
                    mode: 'local',
                    getLocalIdent: getCSSModuleLocalIdent
                  }
                },
                'sass-loader'
              )
            },
            {
              test: lessRegex,
              exclude: lessModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: {
                    mode: 'icss'
                  }
                },
                'less-loader'
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: lessModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: {
                    mode: 'local',
                    getLocalIdent: getCSSModuleLocalIdent
                  }
                },
                'less-loader'
              )
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: 'asset/resource'
            }
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ]
        }
      ].filter(Boolean)
    },
    plugins: [
      // Replace Moment.js with day.js
      new AntDayJsWebpackPlugin({
        plugins: [
          'isSameOrBefore',
          'isSameOrAfter',
          'isLeapYear',
          'isBetween',
          'advancedFormat',
          'customParseFormat',
          'arraySupport',
          'weekday',
          'weekYear',
          'weekOfYear',
          'dayOfYear',
          'quarterOfYear',
          'isMoment',
          'localeData',
          'localizedFormat',
          'utc',
          'timezone',
          'duration'
        ],
        replaceMoment: true
      }),
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml
          },
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true
                }
              }
            : undefined
        )
      ),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      isEnvProduction &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // It will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // Experimental hot reloading for React .
      // https://github.com/facebook/react/tree/main/packages/react-refresh
      isEnvDevelopment &&
        shouldUseReactRefresh &&
        new ReactRefreshWebpackPlugin({
          overlay: false
        }),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvProduction && new VendorsPrefetchPlugin({ injectFiles: ['index.html'] }),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          ignoreOrder: true,
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].css'
        }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path
            return manifest
          }, seed)
          const vendorFiles = getVendorsFiles().reduce((manifest, file) => {
            manifest[file.replace('./', '')] = file
            return manifest
          }, {})
          const entrypointFiles = entrypoints.main.filter(fileName => !fileName.endsWith('.map'))

          return {
            vendorFiles,
            files: manifestFiles,
            entrypoints: entrypointFiles
          }
        }
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      }),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the webpack build.
      isEnvProduction &&
        fs.existsSync(swSrc) &&
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc,
          swDest: 'service-worker.js',
          importWorkboxFrom: 'local',
          dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
          exclude: [/\.map$/, /\.html?$/, /asset-manifest\.json$/, /LICENSE/],
          // Bump up the default maximum size (2mb) that's precached,
          // to make lazy-loading failure scenarios less likely.
          // See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        }),
      // TypeScript type checking
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync('typescript', {
              basedir: paths.appNodeModules
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: paths.appTsBuildInfoFile
              }
            },
            context: paths.appPath,
            diagnosticOptions: {
              syntactic: true
            },
            mode: 'write-references'
            // profile: true,
          },
          issue: {
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            // otherwise.
            include: [{ file: '../**/src/**/*.{ts,tsx}' }, { file: '**/src/**/*.{ts,tsx}' }],
            exclude: [
              { file: '**/src/**/__tests__/**' },
              { file: '**/src/**/?(*.){spec|test}.*' },
              { file: '**/src/setupProxy.*' },
              { file: '**/src/setupTests.*' }
            ]
          },
          logger: {
            infrastructure: 'silent'
          }
        }),
      !disableESLintPlugin &&
        new ESLintPlugin({
          // Plugin options
          extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
          formatter: require.resolve('react-dev-utils/eslintFormatter'),
          eslintPath: require.resolve('eslint'),
          context: paths.appSrc,
          cache: true,
          emitError: true,
          emitWarning: true,
          failOnWarning: false,
          failOnError: false, // !(isEnvDevelopment && emitErrorsAsWarnings),
          // if enable ESLint autofix feature
          // fix: true,
          cacheLocation: path.resolve(paths.appNodeModules, '.cache/.eslintcache'),
          // ESLint class options
          cwd: paths.appPath,
          resolvePluginsRelativeTo: __dirname,
          baseConfig: {
            extends: [require.resolve('eslint-config-react-app/base')],
            rules: {
              ...(!hasJsxRuntime && {
                'react/react-in-jsx-scope': 'error'
              })
            }
          }
        }),
      new ProgressBarPlugin({
        format: '  Compiling [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
        clear: false,
        width: 60
      }),
      isEnvProduction &&
        new BundleAnalyzerPlugin({
          analyzerMode: process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
          openAnalyzer: process.env.OPEN_ANALYZER === 'true'
        })
    ].filter(Boolean),
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false
  }
}
