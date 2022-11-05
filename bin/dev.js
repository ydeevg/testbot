const webpack = require("webpack");
const webpackConfig = require("../webpack.config");
const nodemon = require("nodemon");
const path = require("path");


const compiler = webpack(webpackConfig);

compiler.run((err) => {
  if (err) console.error("Compilation failed:", err);

  compiler.watch({}, (err) => {
    if (err) console.error("Compilation failed:", err);
    console.log("_________________________________");
    console.log(">>> Compilation was successfully!");
  })

  nodemon({
    script: path.resolve(__dirname, "../dist/app.js"),
    watch: [
      path.resolve(__dirname, "../dist")
    ]
  })
})
