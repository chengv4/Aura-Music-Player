import { useState, useCallback, useEffect } from 'react';
import useMusicSource from './useMusicSource';
import { useMusic } from '@/src/MusicContext';

// 存储收藏状态更新的监听器
let favoriteListeners = [];

// 添加收藏状态更新监听器
const addFavoriteListener = (listener) => {
  favoriteListeners.push(listener);
};

// 移除收藏状态更新监听器
const removeFavoriteListener = (listener) => {
  favoriteListeners = favoriteListeners.filter(l => l !== listener);
};

// 通知所有监听器收藏状态已更新
const notifyFavoriteUpdate = (trackId, isFavorited) => {
  favoriteListeners.forEach(listener => {
    try {
      listener(trackId, isFavorited);
    } catch (error) {
      console.error('Error in favorite listener:', error);
    }
  });
};

/**
 * 自定义hook，用于封装音乐操作功能，如下载、收藏等
 */
const useMusicOperations = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToFavorites, removeFromFavorites, isFavorite } = useMusic();
  const { getMusicSource } = useMusicSource();

  // 用于跟踪当前检查收藏状态的歌曲ID
  const [currentTrackId, setCurrentTrackId] = useState(null);

  /**
   * 下载音乐
   * @param {Object} track - 音乐track对象
   * @returns {Promise<void>}
   */
  const downloadMusic = useCallback(async (track) => {
    if (!track) {
      console.log('没有可下载的音乐');
      return;
    }

    try {
      // 设置下载状态
      setIsDownloading(true);

      // 使用自定义hook获取音乐链接
      const trackUrl = await getMusicSource(track);

      if (!trackUrl) {
        console.log('没有可下载的音乐');
        setIsDownloading(false);
        return;
      }

      // 获取音乐文件
      const response = await fetch(trackUrl);
      const blob = await response.blob();

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${track.title || 'music'}.mp3`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      console.log('下载失败，请稍后重试');
    } finally {
      // 恢复下载状态
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    }
  }, [getMusicSource]);

  /**
   * 切换收藏状态
   * @param {Object} track - 音乐track对象
   * @returns {Promise<boolean>} 返回操作是否成功
   */
  const toggleFavorite = useCallback(async (track) => {
    if (!track) {
      console.log('没有可收藏的音乐');
      return false;
    }

    try {
      // 检查歌曲是否已经在收藏列表中
      const isAlreadyFavorited = isFavorite(track.id);

      if (isAlreadyFavorited) {
        // 如果已收藏，则取消收藏
        removeFromFavorites(track.id);
        console.log(`已取消收藏"${track.title}"`);
        // 通知所有监听器
        notifyFavoriteUpdate(track.id, false);
      } else {
        // 如果未收藏，则添加到收藏列表
        // 如果track里没有url，则需要使用getMusicSource获取url后放入track里
        let trackWithUrl = { ...track };
        if (!track.url) {
          const url = await getMusicSource(track);
          if (url) {
            trackWithUrl = { ...track, url };
          }
        }
        addToFavorites(trackWithUrl);
        console.log(`已收藏"${track.title}"`);
        // 通知所有监听器
        notifyFavoriteUpdate(track.id, true);
      }

      return true;
    } catch (error) {
      console.error('收藏操作失败:', error);
      console.log('收藏操作失败，请稍后重试');
      return false;
    }
  }, [isFavorite, removeFromFavorites, addToFavorites, getMusicSource]);

  /**
   * 检查当前歌曲是否已被收藏
   * @param {Object} track - 音乐track对象
   */
  const checkIfFavorited = useCallback(async (track) => {
    if (!track) return;

    setCurrentTrackId(track.id);
  }, []);

  // 添加监听器以响应其他组件的收藏状态变化
  useEffect(() => {
    const handleFavoriteUpdate = (trackId, favorited) => {
      // 如果当前正在检查的歌曲ID与更新的歌曲ID相同，则更新状态
      if (currentTrackId === trackId) {
        // 不再需要设置状态，因为使用了context
      }
    };

    addFavoriteListener(handleFavoriteUpdate);

    return () => {
      removeFavoriteListener(handleFavoriteUpdate);
    };
  }, [currentTrackId]);

  return {
    isDownloading,
    downloadMusic,
    toggleFavorite,
    checkIfFavorited
  };
};

// 暴露监听器管理函数
useMusicOperations.addFavoriteListener = addFavoriteListener;
useMusicOperations.removeFavoriteListener = removeFavoriteListener;

export default useMusicOperations;