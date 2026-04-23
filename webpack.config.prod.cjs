const { merge }     = require('webpack-merge');
const common         = require('./webpack.common.cjs');
const HtmlPlugin     = require('html-webpack-plugin');
const CopyPlugin     = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new HtmlPlugin({ template: './Html/index.html', filename: 'Html/index.html' }),

    new CopyPlugin({
      patterns: [
        { from: 'Html/css',              to: 'Html/css'      },
        { from: 'Html/img',              to: 'Html/img'      },
        // Copy all HTML pages
        { from: 'Html/*.html',           to: '[name][ext]',  context: 'Html' },
        // Static assets
        { from: 'img',                   to: 'img'           },
        { from: 'icon.svg',              to: 'icon.svg'      },
        { from: 'favicon.ico',           to: 'favicon.ico'   },
        { from: 'robots.txt',            to: 'robots.txt'    },
        { from: 'icon.png',              to: 'icon.png'      },
        { from: 'site.webmanifest',      to: 'site.webmanifest' },
      ],
    }),
  ],
});
