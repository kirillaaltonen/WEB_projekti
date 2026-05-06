const { merge } = require("webpack-merge");
const common = require("./webpack.common.cjs");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    new CopyPlugin({
      patterns: [
        // HTML pages
        {
          from: "*.html",
          to: "[name][ext]",
          context: "Html",
        },

        // CSS
        {
          from: "Html/css",
          to: "css",
        },

        // Frontend JS files that are loaded directly by HTML
        {
          from: "Html/js",
          to: "js",
        },

        // Static assets
        {
          from: "img",
          to: "img",
          noErrorOnMissing: true,
        },
        {
          from: "icon.svg",
          to: "icon.svg",
          noErrorOnMissing: true,
        },
        {
          from: "favicon.ico",
          to: "favicon.ico",
          noErrorOnMissing: true,
        },
        {
          from: "robots.txt",
          to: "robots.txt",
          noErrorOnMissing: true,
        },
        {
          from: "icon.png",
          to: "icon.png",
          noErrorOnMissing: true,
        },
        {
          from: "site.webmanifest",
          to: "site.webmanifest",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
});
