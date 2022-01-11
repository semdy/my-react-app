module.exports = {
  parser: '@babel/eslint-parser',
  extends: ['react-app', 'react-app/jest', 'airbnb', 'prettier', 'plugin:compat/recommended'],
  plugins: ['formatjs'],
  parserOptions: {
    sourceType: 'module',
    allowImportExportEverywhere: false,
    ecmaFeatures: {
      legacyDecorators: true,
      globalReturn: false
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
    jest: true,
    jasmine: true
  },
  globals: {
    G6: true,
    SDK: true,
    WebRTC: true,
    OSS: true
  },
  rules: {
    strict: 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js'] }],
    'react/jsx-wrap-multilines': 0,
    'react/state-in-constructor': 0,
    'react/no-array-index-key': 1,
    'react/no-danger': 0,
    'react/require-default-props': 0,
    'react/prefer-stateless-function': 0,
    'react/prop-types': 0,
    'react/static-property-placement': 0,
    'react/forbid-prop-types': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/destructuring-assignment': 0,
    'react/jsx-props-no-spreading': 0,
    'import/no-dynamic-require': 0,
    'import/no-extraneous-dependencies': 0,
    'import/prefer-default-export': 0,
    'import/no-unresolved': [2, { ignore: ['^@/'] }],
    // 'import/no-extraneous-dependencies': [
    //   2,
    //   {
    //     optionalDependencies: true,
    //     devDependencies: ['**/tests/**.js', '/mock/**.js', '**/**.test.js']
    //   }
    // ],
    'jsx-a11y/no-noninteractive-element-interactions': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'jsx-a11y/no-autofocus': 0,
    'import/extensions': 0,
    'compat/compat': 0,
    'linebreak-style': 0,
    'arrow-body-style': 0,
    'consistent-return': 0,
    'no-shadow': 0,
    'no-plusplus': 0,
    'no-console': 0,
    'no-bitwise': 0,
    'no-nested-ternary': 0,
    'no-use-before-define': 0,
    'no-param-reassign': 0,
    'no-case-declarations': 0,
    'global-require': 0,
    'prefer-spread': 0,
    'prefer-object-spread': 0,
    'class-methods-use-this': 0,
    'func-names': ['error', 'never'],
    'comma-dangle': [1, 'never'],
    'formatjs/no-offset': 'error',
    'formatjs/enforce-default-message': ['error', 'literal'],
    'formatjs/enforce-placeholders': ['error'],
    'formatjs/enforce-id': ['error'],
    quotes: [1, 'single'],
    semi: [1, 'never']
  },
  settings: {
    polyfills: ['fetch', 'promises', 'url'],
    'import/resolver': {
      alias: {
        map: [['moment', 'dayjs']],
        extensions: ['.ts', '.js', '.jsx', '.json']
      }
    }
  }
}
