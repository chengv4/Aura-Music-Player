import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import localforage, { ready } from "localforage";

// 初始状态
const initialState = {
  playlist: [],
  favorites: [],
  currentTrack: {},
  isPlaying: false,
  // 插件相关状态
  activePlugin: null,
  // 循环模式状态
  loopMode: "repeat", // 默认为列表循环  "repeat", "shuffle", "repeat-one"
  pluginModules: { ready: false },
  plugins: [],
  categories: [],
  activeCategory: null,
  subCategories: [],
  activeSubCategory: null,
  // Toast状态
  toasts: [],
};

// Action 类型
const actionTypes = {
  SET_PLAYLIST: "SET_PLAYLIST",
  SET_FAVORITES: "SET_FAVORITES",
  ADD_TO_FAVORITES: "ADD_TO_FAVORITES",
  REMOVE_FROM_FAVORITES: "REMOVE_FROM_FAVORITES",
  SET_CURRENT_TRACK: "SET_CURRENT_TRACK",
  SET_IS_PLAYING: "SET_IS_PLAYING",
  // 插件相关 actions
  SET_ACTIVE_PLUGIN: "SET_ACTIVE_PLUGIN",
  // 循环模式 action
  SET_LOOP_MODE: "SET_LOOP_MODE",
  SET_PLUGIN_MODULES: "SET_PLUGIN_MODULES",
  SET_PLUGINS: "SET_PLUGINS",
  SET_CATEGORIES: "SET_CATEGORIES",
  SET_SUB_CATEGORIES: "SET_SUB_CATEGORIES",
  SET_ACTIVE_CATEGORY: "SET_ACTIVE_CATEGORY",
  SET_ACTIVE_SUB_CATEGORY: "SET_ACTIVE_SUB_CATEGORY",
  // Toast相关actions
  ADD_TOAST: "ADD_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

// Reducer
const musicReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_PLAYLIST:
      return {
        ...state,
        playlist: action.payload || [],
      };

    case actionTypes.SET_FAVORITES:
      return {
        ...state,
        favorites: action.payload || [],
      };

    case actionTypes.ADD_TO_FAVORITES:
      // 检查歌曲是否已经在收藏列表中
      const isAlreadyFavorited = state.favorites.some(
        (track) => track.id === action.payload.id
      );

      if (isAlreadyFavorited) {
        return state; // 如果已经收藏，则不更改状态
      }

      const newFavorites = [...state.favorites, action.payload];
      // 同时保存到localforage
      localforage.setItem("favorites", newFavorites).catch((error) => {
        console.error("保存收藏列表失败:", error);
      });

      return {
        ...state,
        favorites: newFavorites || [],
      };

    case actionTypes.REMOVE_FROM_FAVORITES:
      const updatedFavorites = state.favorites.filter(
        (track) => track.id !== action.payload
      );
      // 同时保存到localforage
      localforage.setItem("favorites", updatedFavorites).catch((error) => {
        console.error("保存收藏列表失败:", error);
      });

      return {
        ...state,
        favorites: updatedFavorites || [],
      };

    case actionTypes.SET_CURRENT_TRACK:
      // 保存到本地存储
      localforage
        .setItem("currentTrack", action.payload || {})
        .catch((error) => {
          console.error("保存当前播放歌曲失败:", error);
        });
      return {
        ...state,
        currentTrack: action.payload,
      };

    case actionTypes.SET_IS_PLAYING:
      return {
        ...state,
        isPlaying: action.payload,
      };

    // 插件相关 reducers
    case actionTypes.SET_ACTIVE_PLUGIN:
      return {
        ...state,
        activePlugin: action.payload,
      };

    // 循环模式 reducer
    case actionTypes.SET_LOOP_MODE:
      // 保存到本地存储
      localforage
        .setItem("loopMode", action.payload || "repeat")
        .catch((error) => {
          console.error("保存循环模式失败:", error);
        });
      return {
        ...state,
        loopMode: action.payload,
      };
    case actionTypes.SET_PLUGINS:
      return {
        ...state,
        plugins: action.payload,
      };
    case actionTypes.SET_PLUGIN_MODULES:
      // 保存到本地存储
      localforage
        .setItem("pluginModules", action.payload || {})
        .catch((error) => {
          console.error("保存插件失败:", error);
        });
      return {
        ...state,
        pluginModules: action.payload,
      };
    case actionTypes.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
      };
    case actionTypes.SET_SUB_CATEGORIES:
      return {
        ...state,
        subCategories: action.payload,
      };
    case actionTypes.SET_ACTIVE_CATEGORY:
      return {
        ...state,
        activeCategory: action.payload,
      };
    case actionTypes.SET_ACTIVE_SUB_CATEGORY:
      return {
        ...state,
        activeSubCategory: action.payload,
      };

    // Toast相关reducers
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };

    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };

    default:
      return state;
  }
};

// 创建Context
const MusicContext = createContext();

// Provider组件
export const MusicProvider = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);
  const workerRef = useRef(null);
  const timeout = 15000;

  // 初始化时从localforage加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [playlist, favorites, loopMode, currentTrack, pluginModules] = await Promise.all(
          [
            localforage.getItem("playlist") || [],
            localforage.getItem("favorites") || [],
            localforage.getItem("loopMode") || "repeat",
            localforage.getItem("currentTrack") || {},
            localforage.getItem("pluginModules") || { ready: true },
          ]
        );

        dispatch({ type: actionTypes.SET_PLAYLIST, payload: playlist });
        dispatch({ type: actionTypes.SET_FAVORITES, payload: favorites });
        dispatch({ type: actionTypes.SET_LOOP_MODE, payload: loopMode });
        dispatch({
          type: actionTypes.SET_CURRENT_TRACK,
          payload: currentTrack,
        });
        dispatch({
          type: actionTypes.SET_PLUGIN_MODULES,
          payload: pluginModules,
        });
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };

    loadData();
    setTimeout(() => {
      if (!workerRef.current) {
        workerRef.current = new Worker("/js/pluginLoaderWorker.js");
        workerRef.current.onerror = (e) => {
          console.log("worker erorr", e);
        };
        workerRef.current.onmessage = (e) => {
          console.log("worker message", e);
        };
      }
    }, 0);
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Action creators
  const setPlaylist = async (playlist) => {
    // 为播放列表中的每首歌曲添加插件ID
    const playlistWithPluginId = Array.isArray(playlist)
      ? playlist.map((track) => ({
        ...track,
        pluginId: track?.pluginId || state.activePlugin?.id || null,
      }))
      : [];

    localforage.setItem("playlist", playlistWithPluginId).catch((error) => {
      console.error("保存播放列表失败:", error);
    });
    return dispatch({
      type: actionTypes.SET_PLAYLIST,
      payload: playlistWithPluginId,
    });
  };

  const addToFavorites = (track) => {
    // 为添加到收藏的歌曲添加插件ID
    const trackWithPluginId = {
      ...track,
      pluginId: state.activePlugin?.id || null,
    };

    dispatch({
      type: actionTypes.ADD_TO_FAVORITES,
      payload: trackWithPluginId,
    });
  };

  const removeFromFavorites = (trackId) => {
    dispatch({ type: actionTypes.REMOVE_FROM_FAVORITES, payload: trackId });
  };

  const setCurrentTrack = (track) => {
    if (!track?.pluginId && track) {
      track.pluginId = state.activePlugin?.id;
    }
    dispatch({ type: actionTypes.SET_CURRENT_TRACK, payload: track });
  };

  const setIsPlaying = (isPlaying) => {
    dispatch({ type: actionTypes.SET_IS_PLAYING, payload: isPlaying });
  };

  // 循环模式 action creator
  const setLoopMode = (mode) => {
    dispatch({ type: actionTypes.SET_LOOP_MODE, payload: mode });
  };

  // 检查歌曲是否已收藏
  const isFavorite = (trackId) => {
    return state.favorites.some((track) => track.id === trackId);
  };

  // 检查歌曲是否已在播放列表中
  const isInPlaylist = (trackId) => {
    return state.playlist.some((track) => track.id === trackId);
  };

  // 添加歌曲到播放列表
  const addToPlaylist = useCallback(
    async (track) => {
      try {
        const playlist = state.playlist || [];
        // 检查歌曲是否已经在播放列表中
        const isAlreadyInPlaylist = playlist.some(
          (existingTrack) => existingTrack.id === track.id
        );

        if (!isAlreadyInPlaylist) {
          // 为添加到播放列表的歌曲添加插件ID
          const trackWithPluginId = {
            ...track,
            pluginId: state.activePlugin?.id || null,
          };

          const newPlaylist = [...playlist, trackWithPluginId];
          setPlaylist(newPlaylist);
          return true;
        }
        return false;
      } catch (error) {
        console.error("添加到播放列表失败1:", error);
        return false;
      }
    },
    [setPlaylist, state.playlist, state.activePlugin]
  );

  // 从播放列表删除
  const delToPlaylist = useCallback(
    async (track) => {
      try {
        const playlist = state.playlist || [];
        // 检查歌曲是否已经在播放列表中
        const isAlreadyInPlaylist = playlist.some(
          (existingTrack) => existingTrack.id === track.id
        );

        if (isAlreadyInPlaylist) {
          setPlaylist(playlist.filter((item) => item.id !== track.id));
          return true;
        }
        return false;
      } catch (error) {
        console.error("删除播放列表歌曲失败:", error);
        return false;
      }
    },
    [setPlaylist, state.playlist]
  );

  // 插件相关 action creators
  const setActivePlugin = (plugin) => {
    console.log("Setting active plugin in context:", plugin);
    dispatch({ type: actionTypes.SET_ACTIVE_PLUGIN, payload: plugin });
  };
  const setPluginModules = (modules) => {
    dispatch({ type: actionTypes.SET_PLUGIN_MODULES, payload: modules });
  };
  const setPlugins = (plugins) => {
    dispatch({ type: actionTypes.SET_PLUGINS, payload: plugins });
  };
  const setCategories = (categories) => {
    dispatch({ type: actionTypes.SET_CATEGORIES, payload: categories });
  };
  const setActiveCategory = (category) => {
    dispatch({ type: actionTypes.SET_ACTIVE_CATEGORY, payload: category });
  };
  const setSubCategories = (subCategories) => {
    dispatch({ type: actionTypes.SET_SUB_CATEGORIES, payload: subCategories });
  };
  const setActiveSubCategory = (subCategory) => {
    dispatch({
      type: actionTypes.SET_ACTIVE_SUB_CATEGORY,
      payload: subCategory,
    });
  };
  const fetchDataFromWorker = async (data) => {
    return new Promise((resolve, reject) => {
      // 生成唯一标识
      const requestId = `${data.functionName}_${Date.now()}_${Math.random()}`;

      // 创建一次性的消息处理器
      const handler = (e) => {
        // 检查是否是当前请求的响应
        if (e.data.requestId === requestId) {
          // 立即移除监听器，避免影响其他请求
          workerRef.current.removeEventListener("message", handler);

          // 根据 type 判断成功或失败
          if (e.data.type === data.functionName) {
            resolve(e.data);
          } else {
            reject(e.data);
          }
        }
      };

      //  使用 addEventListener 而不是 onmessage
      workerRef.current.addEventListener("message", handler);

      // 发送消息时带上 requestId
      workerRef.current.postMessage({
        requestId, // 关键：带上唯一 ID
        type: data.functionName,
        params: {
          pluginId: data.pluginId || state.activePlugin?.id,
          functionName: data.functionName,
          fetchData: data.fetchData,
        },
      });

      // 添加超时保护
      setTimeout(() => {
        workerRef.current.removeEventListener("message", handler);
        reject(new Error("Request timeout"));
      }, timeout);
    });
  };

  // Toast相关方法
  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    dispatch({ type: actionTypes.ADD_TOAST, payload: toast });

    // 自动移除提示
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: actionTypes.REMOVE_TOAST, payload: id });
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: actionTypes.REMOVE_TOAST, payload: id });
  }, []);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, "info", duration);
  }, [showToast]);

  const showSuccess = useCallback((message, duration) => {
    return showToast(message, "success", duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    return showToast(message, "warning", duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    return showToast(message, "error", duration);
  }, [showToast]);

  return (
    <MusicContext.Provider
      value={{
        ...state,
        setPlaylist,
        addToPlaylist,
        delToPlaylist,
        addToFavorites,
        removeFromFavorites,
        setCurrentTrack,
        setIsPlaying,
        isFavorite,
        isInPlaylist,
        setActivePlugin,
        setLoopMode,
        setPluginModules,
        setPlugins,
        setCategories,
        setActiveCategory,
        setSubCategories,
        setActiveSubCategory,
        workerRef,
        fetchDataFromWorker,
        // Toast相关方法
        showToast,
        removeToast,
        showInfo,
        showSuccess,
        showWarning,
        showError
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

// 自定义hook，用于在组件中访问音乐状态
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
};
