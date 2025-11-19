const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.js",

    // Webpack 5 持久化缓存配置
    cache: {
      type: "filesystem", // 使用文件系统缓存
      cacheDirectory: path.resolve(__dirname, "node_modules/.cache/webpack"), // 缓存目录
      buildDependencies: {
        config: [__filename], // 当配置文件改变时，缓存失效
      },
      // 缓存名称，区分不同模式
      name: isProduction ? "production-cache" : "development-cache",
    },

    output: {
      path: path.resolve(__dirname, "build"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].bundle.js",
      chunkFilename: isProduction
        ? "[name].[contenthash].chunk.js"
        : "[name].chunk.js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: [
            /node_modules/,
            /plugins/, // 排除 plugins 目录
          ],
          use: [
            // 多线程编译（只在生产模式下启用，开发模式反而会变慢）
            ...(isProduction
              ? [
                  {
                    loader: "thread-loader",
                    options: {
                      workers: 2, // 使用 2 个 worker 线程
                      workerParallelJobs: 50,
                      poolTimeout: isProduction ? Infinity : 2000,
                    },
                  },
                ]
              : []),
            {
              loader: "babel-loader",
              options: {
                // 启用缓存，大幅提升二次构建速度
                cacheDirectory: true,
                // 压缩缓存文件
                cacheCompression: false,
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      // 指定目标浏览器，减少不必要的转换
                      targets: {
                        chrome: "88",
                        edge: "88",
                      },
                      // 移除 polyfill 配置，避免需要安装 core-js
                      // useBuiltIns: "usage",
                      // corejs: 3,
                      // 不转换模块语法，让 webpack 处理 tree shaking
                      modules: false,
                    },
                  ],
                  [
                    "@babel/preset-react",
                    {
                      // 使用新的 JSX 转换（React 17+）
                      runtime: "automatic",
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        filename: "index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "manifest.json", to: "." },
          { from: "icons", to: "icons" },
          { from: "background.js", to: "." },
          { from: "public/js", to: "js" },
        ],
      }),
      new webpack.DefinePlugin({
        __IS_DEVELOPMENT__: JSON.stringify(!isProduction),
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "build"),
      },
      compress: true,
      port: 3000,
      hot: true,
      devMiddleware: {
        writeToDisk: true,
      },
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@/plugins": path.resolve(__dirname, "plugins"),
        "@/src": path.resolve(__dirname, "src"),
        "@/hooks": path.resolve(__dirname, "src/hooks"),
        "@/assets": path.resolve(__dirname, "src/assets"),
        "@/components": path.resolve(__dirname, "src/components"),
        "@/utils": path.resolve(__dirname, "src/utils"),
      },
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    performance: {
      maxAssetSize: 300000, // 300 KiB
      maxEntrypointSize: 300000, // 300 KiB
      hints: isProduction ? "warning" : false,
    },
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            chunks: "all",
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: -10,
          },
        },
      },
      runtimeChunk: {
        name: "runtime",
      },
    },
  };
};
