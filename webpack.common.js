const path = require('path');

module.exports = {
  entry: {
    app: './Html/js/hsl.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './Html/js/hsl.js',
  },
};
