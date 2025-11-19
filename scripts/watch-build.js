const webpack = require("webpack");
const path = require("path");
const config = require("../webpack.config.js")({}, { mode: "development" });

// 创建 webpack compiler 实例
const compiler = webpack(config);

console.log("正在监听文件变化，实时构建到 build 目录...\n");

// 使用 watch 模式
compiler.watch(
  {
    // watch 选项
    aggregateTimeout: 100,
    poll: false,
    ignored: /node_modules/,
    followSymlinks: false, // 不跟踪符号链接提高性能
  },
  (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }

    // 输出构建统计信息
    console.log(
      stats.toString({
        colors: true,
        modules: false,
        chunks: false,
        assets: true,
      })
    );

    console.log("\n[构建完成] 文件已更新到 build 目录\n");
  }
);
