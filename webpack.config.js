const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
  ...defaultConfig,
  entry: {
    configurator: path.resolve(__dirname, 'frontend/src/index.jsx'),
  },
  output: {
    path: path.resolve(__dirname, 'frontend/dist'),
    filename: '[name].js',
  },
  resolve: {
    ...defaultConfig.resolve,
    extensions: ['.js', '.jsx', '.json'],
  },
  externals: {
    '@wordpress/element': 'wp.element',
    '@wordpress/components': 'wp.components',
    '@wordpress/api-fetch': 'wp.apiFetch',
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};
