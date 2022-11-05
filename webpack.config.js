const path = require("path");
const nodeExternals = require("webpack-node-externals");

const NODE_ENV = process.env.NODE_ENV;
const IS_PROD = NODE_ENV === "production"

module.exports = {
  target: "node",
  mode: NODE_ENV ? NODE_ENV : "development",
  watchOptions: {
    ignored: /dist/,
  },
  resolve: {
    extensions: [".js", ".ts", ".json"]
  },
  entry: [
    path.resolve(__dirname, "./src/app.ts")
  ],
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "app.js",
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /.[tj]s$/,
        use: ["ts-loader"]
      }
    ]
  },
  optimization: {
    minimize: IS_PROD,
  }
}
