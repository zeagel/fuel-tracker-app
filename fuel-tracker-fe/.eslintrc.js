module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2021': true,
    'jest/globals': true ,
    'cypress/globals': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true
    },
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  'plugins': [
    'react', 'jest', 'cypress'
  ],
  'rules': {
    'indent': [
      'error',
      2, {
        'SwitchCase': 1
      }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'eqeqeq': 'error',
    'no-trailing-spaces': 'error',
    'object-curly-spacing': [
      'error', 'always'
    ],
    'arrow-spacing': [
      'error', { 'before': true, 'after': true }
    ],
    'no-console': 0,
    'react/prop-types': 0,
  },
  'settings': {
    'react': {
      'createClass': 'createReactClass',
      'pragma': 'React',
      'fragment': 'Fragment',
      'version': 'detect',
      'flowVersion': '0.53'
    },
    'propWrapperFunctions': [
      'forbidExtraProps',
      { 'property': 'freeze', 'object': 'Object' },
      { 'property': 'myFavoriteWrapper' }
    ],
    'linkComponents': [
      'Hyperlink',
      { 'name': 'Link', 'linkAttribute': 'to' }
    ]
  }
};
