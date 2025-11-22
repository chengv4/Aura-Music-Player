import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import PluginTabs from "./components/PluginTabs/PluginTabs";
import CategoryMenu from "./components/CategoryMenu/CategoryMenu";
import Category from "./components/Category/Category";
import SheetList from "./components/SheetList/SheetList";
import TrackList from "./components/TrackList/TrackList";
import Player from "./components/Player";
import MusicSearch from "./components/MusicSearch/MusicSearch";
import localforage from "localforage";
import useMusicSource from "@/hooks/useMusicSource";
import useScrollPosition from "@/hooks/useScrollPosition";
import { MusicProvider, useMusic } from "@/src/MusicContext";
import ToastContainer from "@/components/Toast/ToastContainer";
import useToast from "@/hooks/useToast";
import useDisableDevTools from "@/hooks/useDisableDevTools";
import usePluginsWorker from "@/hooks/usePluginsWorker";
import SetPluginsModal from "@/components/SetPluginsModal";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import LocalMusic from "@/components/LocalMusic/LocalMusic";
import "./App.css";

function App() {
  const {
    favorites,
    playlist,
    setPlaylist,
    activePlugin,
    loopMode,
    currentTrack,
    setCurrentTrack,
    setPluginModules,
    pluginModules,
    setCategories,
    setActiveCategory
  } = useMusic();
  // 使用自定义hook禁用开发者工具
  useDisableDevTools();

  const [musicList, setMusicList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // 歌单列表当前页
  const [hasMore, setHasMore] = useState(true);
  const [sheets, setSheets] = useState([]); // 歌单列表
  const [showTracks, setShowTracks] = useState(false); // 是否显示歌曲列表
  const [currentTrackPage, setCurrentTrackPage] = useState(1); // 歌曲列表当前页
  const [showPlayer, setShowPlayer] = useState(false); // 是否显示播放器
  const [duration, setDuration] = useState(0); // 音频总时长
  const [currentTime, setCurrentTime] = useState(0); // 当前播放时间
  const [isPlaying, setIsPlaying] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(null); // 防止重复请求歌单
  const [searchResults, setSearchResults] = useState([]); // 搜索结果
  const [searchKeyword, setSearchKeyword] = useState(""); // 搜索关键字
  // 插件设置相关状态
  const [showPluginModal, setShowPluginModal] = useState(false);
  const [pluginUrl, setPluginUrl] = useState("");
  // 插件加载状态
  const [pluginsLoading, setPluginsLoading] = useState(false);
  const audioRef = useRef(null);
  const { toasts, removeToast, showWarning } = useToast();
  const [showSetPluginBtn, setShowSetPluginBtn] = useState(false);

  const {
    workerRef,
    loadPluginsFromWorker,
    pluginsLoaded,
    plugins,
    categories,
    activeCategory,
    subCategories,
    activeSubCategory,
    setPlugins,
    switchPlugin,
    setActivePlugin,
    loadPluginSheetsFromWorder,
    loadPluginCategoriesFromWorder,
    handleCategorySelect: handleCategorySelectHook,
    handleSubCategorySelect: handleSubCategorySelectHook,
    loadPluginSheetMusicFromWorker,
  } = usePluginsWorker();

  // 管理滚动位置
  const {
    containerRef: sheetListContainerRef,
    restoreScrollPosition,
    handleScroll,
  } = useScrollPosition("sheetList");

  // 使用自定义hook获取音乐链接
  const { getMusicSource } = useMusicSource();

  // 初始化audio元素 - 只在组件挂载时执行一次
  useEffect(() => {
    console.log("初始化audio元素");
    audioRef.current = new Audio();

    // 加载保存的音量设置
    const loadSavedVolume = async () => {
      try {
        const savedVolume = await localforage.getItem("playerVolume");
        if (savedVolume !== null) {
          audioRef.current.volume = savedVolume;
        }
      } catch (error) {
        console.error("加载音量设置失败:", error);
      }
    };

    loadSavedVolume();

    // 添加元数据加载完成事件监听
    const loadedMetadataHandler = () => {
      setDuration(audioRef.current.duration);
    };

    // 添加时间更新事件监听
    let lastUpdateTime = 0;
    const timeUpdateHandler = () => {
      const currentTime = audioRef.current.currentTime;
      const now = Date.now();
      // 限制更新频率，最多每500毫秒更新一次
      if (now - lastUpdateTime > 500) {
        setCurrentTime(currentTime);
        lastUpdateTime = now;
      }
    };

    audioRef.current.addEventListener("loadedmetadata", loadedMetadataHandler);
    audioRef.current.addEventListener("timeupdate", timeUpdateHandler);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener(
          "loadedmetadata",
          loadedMetadataHandler
        );
        audioRef.current.removeEventListener("timeupdate", timeUpdateHandler);
      }
    };
  }, []);
  // 定义播放完成的处理函数
  const handleEnded = async () => {
    if (playlist?.length === 0) {
      // 如果播放列表为空，则停止播放
      setIsPlaying(false);
      return;
    }
    console.log("当前歌曲播放完成");
    setIsPlaying(false);

    // 查找当前播放歌曲在播放列表中的位置
    const currentIndex = playlist.findIndex(
      (track) => track.id === currentTrack?.id
    );

    let newPlaylist = [...playlist];
    let nextTrack = null;

    // 根据循环模式处理播放逻辑
    switch (loopMode) {
      case "repeat-one":
        // 单曲循环模式：重置播放时间并继续播放当前歌曲
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
          setTimeout(() => {
            audioRef.current?.play();
          }, 0);
        }
        return; // 直接返回，不执行下面的逻辑

      case "shuffle":
        // 删除当前歌曲，播放下一首
        newPlaylist = newPlaylist.filter((_, index) => index !== currentIndex);
        // 随机播放模式：从播放列表中随机选择下一首（排除当前歌曲）
        if (newPlaylist.length >= 1) {
          // 创建排除当前歌曲的播放列表
          const filteredPlaylist = newPlaylist.filter(
            (_, index) => index !== currentIndex
          );
          if (filteredPlaylist.length > 0) {
            // 从剩余歌曲中随机选择
            const randomIndex = Math.floor(
              Math.random() * filteredPlaylist.length
            );
            nextTrack = filteredPlaylist[randomIndex];
          }
        }
        break;

      case "repeat":
      default:
        // 删除当前歌曲，播放下一首
        newPlaylist = newPlaylist.filter((_, index) => index !== currentIndex);

        // 如果还有下一首歌曲，则自动播放
        if (newPlaylist.length > 0) {
          nextTrack = newPlaylist[0];
        }
        break;
    }

    // 更新播放列表（仅在非单曲循环模式下）
    if (loopMode !== "repeat-one") {
      await setPlaylist(newPlaylist);
    }
    // 播放下一首歌曲
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    }
  };
  // 处理播放完成事件 - 仅依赖currentTrack和loopMode
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.addEventListener("ended", handleEnded);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, [currentTrack, loopMode, playlist, setPlaylist]);
  // 应用启动时检查播放列表并继续播放
  useEffect(() => {
    if (pluginsLoaded) {
      try {
        // 恢复播放
        if (currentTrack?.id || currentTrack?.url) {
          setIsPlaying(true);
          setShowPlayer(true);
        }
        // 只在currentTrack为null时检查（即应用初始化时），避免播放列表变化影响当前播放
        if (playlist?.length > 0 && currentTrack === null) {
          setCurrentTrack(playlist[0]);
          setIsPlaying(true);
          setShowPlayer(true);
        }
      } catch (error) {
        console.error("检查播放列表时出错:", error);
      }
    }
  }, [playlist, currentTrack, pluginsLoaded]);

  // 处理插件切换
  const handlePluginChange = (plugin) => {
    // 只有当切换到不同插件时才执行切换逻辑
    if (!activePlugin || activePlugin.id !== plugin.id) {
      switchPlugin(plugin);
      // 切换插件时返回到歌单列表视图
      setShowTracks(false);
      console.log(`切换到插件: ${plugin.name}`);
    }
  };

  // 当插件改变时加载分类数据
  useEffect(() => {
    setCurrentTrackPage(1);
    if (activePlugin) {
      // 特殊处理"我的音乐"插件
      if (activePlugin.id === 'mymusic') {
        // 设置固定的分类：本地和收藏
        const myMusicCategories = [
          { title: "收藏", id: "favorites", isFavorites: true },
          { title: "本地", id: "local", isLocal: true },
        ];
        setCategories(myMusicCategories);
        setActiveCategory(myMusicCategories[0]);
      } else {
        loadPluginCategoriesFromWorder(activePlugin);
      }
      // 切换插件时返回到歌单列表视图
      setShowTracks(false);
    }
  }, [activePlugin?.id]);

  // 当激活的二级分类改变时，获取该分类下的歌单列表
  useEffect(() => {
    // 只有当不是收藏分类且有激活的子分类时才加载歌单
    if (activeCategory && !activeCategory.isFavorites && activeSubCategory) {
      setShowTracks(false);
      fetchSheetsByCategory(1);
    } else if (
      activeCategory &&
      !activeCategory.isFavorites &&
      !activeCategory.isLocal && // 添加对本地分类的判断
      subCategories &&
      subCategories.length > 0 &&
      !activeSubCategory
    ) {
      setCurrentTrackPage(1);
      // 如果有子分类但没有激活的子分类，则激活第一个
      handleSubCategorySelectHook(subCategories[0]);
    }
    // 特殊处理"我的音乐"插件中的"本地"和"收藏"分类
    else if (activeCategory && (activeCategory.isLocal || activeCategory.isFavorites) && activePlugin?.id === 'mymusic') {
      if (activeCategory.isLocal) {
        loadLocalTracks();
      } else if (activeCategory.isFavorites) {
        loadFavoriteTracks();
      }
    }
  }, [
    activeSubCategory?.id,
    activeCategory?.id,
    subCategories.length,
    handleSubCategorySelectHook,
  ]);

  // 获取歌单列表的函数
  const fetchSheetsByCategory = async (page = 1) => {
    if (!activeSubCategory || !activePlugin) return;
    // 防止重复请求相同的数据
    const requestKey = `${activePlugin.id}-${activeSubCategory.id}-${page}`;
    if (fetchingSheets === requestKey) {
      return;
    }
    setFetchingSheets(requestKey);
    // 如果是第一页，清空歌单列表
    if (page === 1) {
      setSheets([]);
    }
    setLoading(true);
    try {
      // 动态导入插件
      const result = await loadPluginSheetsFromWorder(page);
      // 如果result.data不存在但result.musicList存在，则直接显示歌曲列表
      if (!result.data?.length && result.musicList) {
        setMusicList(result.musicList || []);
        setShowTracks(true); // 直接显示歌曲列表
        setHasMore(false); // 不需要加载更多
      } else {
        if (page === 1) {
          setSheets(result.data || []);
        } else {
          setSheets((prev) => [...prev, ...(result.data || [])]);
        }
        setHasMore(!result.isEnd);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("获取分类歌单列表失败:", error);
      if (page === 1) {
        setSheets([]);
      }
    } finally {
      setLoading(false);
      setFetchingSheets(null);
    }
  };

  // 加载更多歌单（分页）
  const loadMoreSheets = () => {
    if (!hasMore || loading) return;
    fetchSheetsByCategory(currentPage + 1);
  };

  // 加载收藏的歌曲（当激活收藏分类时）
  useEffect(() => {
    // 特殊处理"收藏"分类
    if (activeCategory && activeCategory.isFavorites) {
      loadFavoriteTracks();
    }
    // 特殊处理"我的音乐"插件中的"本地"分类
    else if (activeCategory && activeCategory.isLocal) {
      loadLocalTracks();
    }
  }, [activeCategory]);

  // 加载收藏的歌曲
  const loadFavoriteTracks = async () => {
    try {
      // 创建一个虚拟的歌单来显示收藏的歌曲
      const favoritesSheet = {
        musicList: favorites,
        title: "我的收藏",
        id: "favorites",
      };
      setMusicList(favoritesSheet.musicList || []);
      setShowTracks(true);
    } catch (error) {
      console.error("加载收藏歌曲失败:", error);
      setMusicList([]);
      setShowTracks(true);
    }
  };

  // 加载本地歌曲
  const loadLocalTracks = async () => {
    try {
      // 从本地存储中获取本地歌曲列表
      const localTracks = await localforage.getItem("localTracks") || [];

      // 创建一个虚拟的歌单来显示本地歌曲
      const localSheet = {
        musicList: localTracks,
        title: "本地音乐",
        id: "local",
      };
      setMusicList(localSheet.musicList || []);
      setShowTracks(true);
    } catch (error) {
      console.error("加载本地歌曲失败:", error);
      setMusicList([]);
      setShowTracks(true);
    }
  };

  // 点击歌单时获取歌单中的歌曲
  const handlePlaySheet = async (sheet) => {
    try {
      const result = await loadPluginSheetMusicFromWorker(sheet, 1);

      setMusicList(result.musicList || []);
      setShowTracks(true); // 显示歌曲列表
    } catch (error) {
      console.error("获取歌单歌曲失败:", error);
    }
  };
  const rePlayForError = async (track) => {
    // 尝试重新获取音乐链接并播放
    const trackUrl = await getMusicSource({ ...track, url: null });
    audioRef.current.src = trackUrl;
    audioRef.current.play().catch(async () => {
      showWarning("播放失败，请检查网络");
      setTimeout(() => {
        // 结束当前歌曲播放，进入下一首
        handleEnded();
      }, 3000);
    });
  };

  // 当前播放曲目或播放状态改变时控制音频播放
  useEffect(() => {
    if (!audioRef.current) return;

    const playTrack = async () => {
      if (currentTrack && isPlaying) {
        console.log(`开始播放: `, currentTrack);
        // 使用自定义hook获取音乐链接
        const trackUrl = await getMusicSource(currentTrack);

        if (trackUrl) {
          if (audioRef.current.src !== trackUrl) {
            audioRef.current.src = trackUrl;
          }
          audioRef.current.play().catch(async () => {
            delete currentTrack.url; // 删除可能失效的url，强制重新获取
            rePlayForError(currentTrack);
          });
        } else {
          console.log("无法获取音乐播放链接");
        }
      } else {
        // 暂停音乐
        audioRef.current.pause();
      }
    };

    playTrack();
  }, [currentTrack, isPlaying]);

  const handlePlay = (track) => {
    // 如果点击的是当前正在播放的歌曲，则切换播放状态
    if (currentTrack && currentTrack.id === track.id) {
      handlePlayToggle();
    } else {
      // 否则播放新歌曲
      setCurrentTrack(track);
      setIsPlaying(true);
      setShowPlayer(true); // 显示播放器
    }
  };

  const handleTrackPageChange = (page) => {
    setCurrentTrackPage(page);
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setCurrentTrack(null);
    setShowPlayer(false);
    setIsPlaying(false);
  };

  // 处理进度条点击事件
  const handleSeek = (e) => {
    if (!audioRef.current) return;

    const progressBar = e.currentTarget;
    const clickPosition = e.nativeEvent.offsetX;
    const progressBarWidth = progressBar.offsetWidth;
    const seekTime = (clickPosition / progressBarWidth) * duration;

    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // 处理播放全部按钮点击事件
  const handlePlayAll = useCallback(async (list) => {
    if (!musicList || musicList.length === 0) {
      console.log("没有可播放的音乐");
      return;
    }
    try {
      // // 过滤掉已经在播放列表中的歌曲，避免重复
      // const filteredOldTracks = playlist.filter(
      //   (newTrack) =>
      //     !musicList.some((existingTrack) => existingTrack.id === newTrack.id)
      // );
      // 将新歌曲添加到现有播放列表的开头
      const newPlaylist = list || [...musicList];
      setPlaylist(newPlaylist);

      // 播放第一首新歌曲
      const firstTrack = musicList[0] || filteredOldTracks[0];
      setCurrentTrack(firstTrack);
      setIsPlaying(true);
      setShowPlayer(true);

      // 显示成功消息
      console.log(`已将歌曲添加到播放列表开头并开始播放`);
    } catch (error) {
      console.error("播放全部失败:", error);
      console.log("播放全部失败，请稍后重试");
    }
  }, [musicList]);

  // 返回歌单列表
  const handleBackToSheets = () => {
    setCurrentTrackPage(1);
    setSearchKeyword("");
    setSearchResults([]);
    setShowTracks(false);
  };

  // 处理一级分类选择
  const handleCategorySelect = (category) => {
    setSearchKeyword("");
    setCurrentTrackPage(1);
    handleCategorySelectHook(category);
    // 切换分类时返回到歌单列表视图（除非是收藏分类）
    if (!category.isFavorites) {
      setShowTracks(false);
    }
    console.log(`选择了分类: ${category.title}`);
  };

  // 处理二级分类选择
  const handleSubCategorySelect = (subCategory) => {
    setSearchKeyword("");
    setCurrentTrackPage(1);
    handleSubCategorySelectHook(subCategory);
    // 切换子分类时返回到歌单列表视图
    // setShowTracks(false);
    console.log(`选择了子分类: ${subCategory.title}`);
  };

  // 处理搜索结果
  const handleSearchResults = (results, keyword) => {
    if (keyword.trim() === "" && sheets?.length > 0) {
      handleBackToSheets();
      return;
    }
    setSearchResults(results);
    setSearchKeyword(keyword);
    setShowTracks(true);
  };

  // 判断当前是否为收藏分类
  const isFavoritesCategory = useMemo(() => {
    return activeCategory?.isFavorites;
  }, [activeCategory]);

  // 当从歌曲列表返回到歌单列表时恢复滚动位置
  useEffect(() => {
    if (!showTracks) {
      restoreScrollPosition();
    }
  }, [showTracks, restoreScrollPosition]);

  const currenMusicList = useMemo(() => {
    if (isFavoritesCategory) {
      return favorites;
    }
    if (searchKeyword) {
      return searchResults;
    }
    return musicList;
  }, [musicList, searchResults, searchKeyword, favorites, isFavoritesCategory]);

  useEffect(() => {
    const loadPlugins = async () => {
      setPluginsLoading(() => true);
      try {
        if (pluginModules?.ready !== false) {
          // 使用Web Worker处理插件代码执行
          const res = await loadPluginsFromWorker(pluginModules);
          if (res.success) {
            const plugins =
              Object.values(pluginModules)?.map((v) => ({
                ...v,
                code: null,
              })) || [];
            setPlugins(plugins);
          } else {
            setShowSetPluginBtn(true);
            console.log("插件加载失败");
          }
          setShowSetPluginBtn(true);
        }
      } catch (error) {
        setShowSetPluginBtn(true);
      }


      setPluginsLoading(() => false);
    }
    loadPlugins();
  }, [pluginModules]);


  // 校验插件版本 更新插件
  // useEffect(() => {
  //   console.log('校验插件版本', plugins);
  //   // const pluginUrl = await localforage.getItem(`pluginUrl`);
  //   // // 获取插件内容
  //   // const response = await fetch(pluginUrl).then((res) => res.json());
  //   // console.log(response.plugins, 'responseresponseresponseresponse')
  // }, [plugins]);

  // 导入插件的处理函数
  const handleImportPlugin = async () => {
    if (!pluginUrl.trim()) return;

    setPluginsLoading(true);
    try {
      // 获取插件内容
      const response = await fetch(pluginUrl);
      if (!response.ok) {
        showWarning("无法获取插件内容");
      };
      localforage.setItem('pluginUrl', pluginUrl);
      const loadedPlugins = await response.json();
      const pluginModulesCache = {};
      const loadeds = loadedPlugins?.plugins || [];
      for (const plugin of loadeds) {
        try {
          const code = await fetch(
            `${pluginUrl.replace("/config.json", "")}${plugin.url}`
          ).then((res) => res.text());
          pluginModulesCache[plugin.id] = { code, ...plugin };
        } catch (error) {
          console.error(`加载插件模块失败 (${plugin.name}):`, error);
        }
      }
      setPluginModules(pluginModulesCache);
      const plugins =
        Object.values(pluginModulesCache)?.map((v) => ({
          ...v,
          code: null,
        })) || [];
      setPlugins(plugins);

      console.log("插件导入成功");
    } catch (error) {
      console.error("插件导入失败:", error);
      showWarning("插件导入失败: " + error.message);
    } finally {
      setPluginsLoading(false);
    }
  };
  const handleCloseModal = () => {
    setShowPluginModal(false);
  };
  const customPlugins = useMemo(() => {
    return plugins.concat({ id: 'mymusic', name: '我的音乐' });
  }, [plugins]);
  useEffect(() => {
    if (customPlugins?.length) {
      setActivePlugin(customPlugins[0]);
    }
  }, [customPlugins]);
  return (
    <div className="App">
      {pluginsLoading && <LoadingSpinner loading={pluginsLoading} />}
      {showSetPluginBtn && (plugins.length === 0) && (
        <button
          className="plugin-settings-btn"
          onClick={() => setShowPluginModal(true)}
        >
          设置插件
        </button>
      )}
      {showPluginModal && (
        <SetPluginsModal
          pluginUrl={pluginUrl}
          importedPlugins={plugins}
          setPluginUrl={setPluginUrl}
          handleImportPlugin={handleImportPlugin}
          handleCloseModal={handleCloseModal}
          setShowSetPluginBtn={setShowSetPluginBtn}
        />
      )}
      <PluginTabs
        plugins={customPlugins}
        activePlugin={activePlugin}
        onPluginChange={handlePluginChange}
        onSetting={() => setShowPluginModal(true)}
      />
      <main className={`main-content ${showPlayer ? "with-player" : ""}`}>
        <div className="category-layout">
          <div className="category-sidebar">
            <CategoryMenu
              categories={categories}
              activeCategory={activeCategory}
              onCategorySelect={handleCategorySelect}
            />
          </div>
          <div className="category-main">
            <>
              {activeCategory?.isLocal ?
                <LocalMusic
                  onPlay={handlePlay}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  activePlugin={activePlugin} handlePlayAll={handlePlayAll} />
                : <>
                  {!isFavoritesCategory && (
                    <MusicSearch onSearchResults={handleSearchResults} />
                  )}
                  {subCategories.length > 0 &&
                    !(searchKeyword && searchResults?.length > 0) && (
                      <Category
                        subCategories={subCategories}
                        activeSubCategory={activeSubCategory}
                        onSubCategorySelect={handleSubCategorySelect}
                      />
                    )}
                  {!showTracks ? (
                    <SheetList
                      sheets={sheets}
                      onPlaySheet={handlePlaySheet}
                      loading={loading}
                      hasMore={hasMore}
                      onLoadMore={loadMoreSheets}
                      containerRef={sheetListContainerRef}
                      onScroll={handleScroll}
                    />
                  ) : (
                    <div className="track-list-container">
                      <div className="track-list-controls">
                        {!isFavoritesCategory && sheets?.length > 0 && (
                          <button
                            className="back-button"
                            onClick={() => {
                              handleBackToSheets();
                            }}
                          >
                            ← 返回歌单列表
                          </button>
                        )}
                        <button className="play-all-button" onClick={() => handlePlayAll(currenMusicList)}>
                          ▶ 播放全部
                        </button>
                      </div>
                      {isFavoritesCategory && musicList.length === 0 ? (
                        <div className="empty-favorites">
                          <p>暂无收藏歌曲</p>
                        </div>
                      ) : (
                        <TrackList
                          playlist={currenMusicList}
                          onPlay={handlePlay}
                          onPageChange={handleTrackPageChange}
                          currentPage={currentTrackPage}
                          currentTrack={currentTrack}
                          isPlaying={isPlaying}
                          activePlugin={activePlugin}
                        />
                      )}
                    </div>
                  )}
                </>}
            </>
          </div>
        </div>
      </main>
      {showPlayer && currentTrack && (
        <Player
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          audioRef={audioRef}
          activePlugin={activePlugin}
          onPlay={handlePlay}
          onClose={handleClosePlayer}
          setCurrentTime={setCurrentTime}
          onPageChange={handleTrackPageChange}
          currentPage={currentTrackPage}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <MusicProvider>
      <App />
    </MusicProvider>
  );
}
