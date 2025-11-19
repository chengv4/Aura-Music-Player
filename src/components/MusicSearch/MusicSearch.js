import React, { useEffect, useState } from 'react';
import './MusicSearch.css';
import { useMusic } from '@/src/MusicContext'
// import usePlugins from '@/hooks/usePlugins'
import usePluginsWorker from '@/hooks/usePluginsWorker'

const MusicSearch = ({ onSearchResults }) => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const { activePlugin } = useMusic();
  // const { pluginModules } = usePlugins();
  const { loadPluginSearchMusicFromWorker } = usePluginsWorker();

  useEffect(() => {
    if (!keyword.trim()) {
      onSearchResults([], '');
    }
  }, [keyword]);
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!keyword.trim() || !activePlugin) return;

    setLoading(true);
    try {
      const result = await loadPluginSearchMusicFromWorker(keyword.trim(), 1, "music");
      // const plugin = pluginModules[activePlugin.id];
      // // 检查插件是否有search方法
      // if (plugin && typeof plugin.search === "function") {
      //   // 调用插件的search方法搜索音乐
      //   const result = await plugin.search(keyword.trim(), 1, "music");
      onSearchResults(result.data || [], keyword.trim());
      // }
    } catch (error) {
      console.error("搜索失败:", error);
      onSearchResults([], keyword.trim());
    } finally {
      setLoading(false);
    }
  };

  // 清空关键字
  const clearKeyword = () => {
    setKeyword('');
  };

  return (
    <div className="music-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入歌曲名、歌手或专辑进行搜索..."
            className="search-input"
            disabled={loading}
          />
          {keyword && (
            <button
              type="button"
              className="clear-button"
              onClick={clearKeyword}
              title="清空搜索内容"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MusicSearch;