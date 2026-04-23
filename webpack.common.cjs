const path = require('path');

module.exports = {
  entry: {
    'Html/js/hsl':  './Html/js/hsl.js',
    'Html/js/auth': './Html/js/auth.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: '[name].js',
  },
};
