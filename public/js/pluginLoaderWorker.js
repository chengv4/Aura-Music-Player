self.importScripts("/js/common.js");
self.importScripts("/js/eval5.js");
// WorkerGlobalScope
// 创建evalCore实例

self.window = self;
const evil = evalCore.getEvalInstance(self);
const pluginModules = {};
self.addEventListener("message", async function (e) {
  const { data, type, params, requestId } = e.data;
  // 加载插件
  if (type === "loadPlugins") {
    try {
      for (const key in data) {
        const plugin = data[key];
        evil(plugin.code);
        pluginModules[plugin.id] = self[`${plugin.id}Plugin`] || {};
      }
      // 返回结果
      self.postMessage({
        requestId,
        success: true,
        type,
      });
    } catch (error) {
      // 返回结果
      self.postMessage({
        requestId,
        success: false,
        type,
      });
      console.log("加载插件失败：", error);
    }
  }
  // 获取数据
  if (params?.functionName) {
    const { pluginId, functionName, fetchData = [] } = params;

    const func = pluginModules[pluginId][functionName];
    const data = await func(...fetchData);
    self.postMessage({
      requestId,
      success: true,
      type: functionName,
      data,
    });
  }
});
