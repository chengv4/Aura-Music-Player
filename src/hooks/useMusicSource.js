import { useCallback, useEffect } from "react";
import { useMusic } from "@/src/MusicContext";
import usePluginsWorker from "@/hooks/usePluginsWorker";

/**
 * 自定义hook，用于获取音乐资源链接
 * @param {Object} activePlugin - 当前激活的插件对象
 */
const useMusicSource = () => {
  /**
   * 获取音乐播放/下载链接
   * @param {Object} track - 音乐track对象
   * @param {string} quality - 音质要求，默认为"standard"
   * @returns {Promise<string|undefined>} 音乐链接或undefined
   */

  const { activePlugin, pluginModules, fetchDataFromWorker } = useMusic();


  const getMusicSource = useCallback(
    async (track, quality = "standard") => {
      if (!track) {
        console.log("没有提供音乐信息");
        return undefined;
      }
      // 如果track已经有url属性，直接返回
      if (track.url) {
        return track.url;
      }

      // 如果没有url属性且没有插件，无法获取链接
      if (!activePlugin) {
        console.log("没有可用的插件来获取音乐链接");
        return undefined;
      }
      try {
        const mediaSource = await fetchDataFromWorker({
          pluginId: track.pluginId || activePlugin.id,
          functionName: "getMediaSource",
          fetchData: [track, quality],
        }).then((res) => res?.data || {});
        if (mediaSource && mediaSource.url) {
          track.url = mediaSource.url; // 缓存url到track对象
          return mediaSource.url;
        } else {
          console.log("插件未能返回有效的音乐链接");
          return undefined;
        }
      } catch (error) {
        console.error("获取音乐链接时出错:", error);
        return undefined;
      }
    },
    [activePlugin, pluginModules]
  );

  return {
    getMusicSource,
  };
};

export default useMusicSource;
