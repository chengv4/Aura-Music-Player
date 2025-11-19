import { useCallback, useEffect, useRef, useState } from "react";
import { useMusic } from "@/src/MusicContext";

const usePluginsWorker = () => {
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const {
    plugins,
    categories,
    activeCategory,
    activeSubCategory,
    setPlugins,
    setCategories,
    setActiveCategory,
    subCategories,
    setActiveSubCategory,
    setSubCategories,
    activePlugin,
    setActivePlugin,
    workerRef,
    fetchDataFromWorker
  } = useMusic();
  // 加载插件到worker
  const loadPluginsFromWorker = (data) => {
    workerRef.current.postMessage({
      type: "loadPlugins",
      data,
    });
    return new Promise((resolve, reject) => {
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "loadPlugins") {
          setPluginsLoaded(true);
          resolve(e.data);
        } else {
          setPluginsLoaded(false);
          reject(e.data);
        }
      };
    });
  };

  // 插件获取分类数据
  const loadPluginCategoriesFromWorder = async (plugin) => {
    if (!plugin) return;

    try {
      const result = await fetchDataFromWorker({
        functionName: "getRecommendSheetTags",
      });
      const tagData = result.data;
      // 处理获取到的分类数据
      let categoryList = [];

      // 如果返回的是数组格式（直接是分类列表）
      if (Array.isArray(tagData)) {
        categoryList = tagData;
      }
      // 如果返回的是对象格式（包含pinned和data字段）
      else if (tagData.data) {
        categoryList = tagData.data;
      }

      // 设置第一层分类数据，并添加固定的"收藏"分类
      const categoriesWithFavorites = [
        ...categoryList,
        { title: "收藏", id: "favorites", isFavorites: true },
      ];

      setCategories(categoriesWithFavorites);

      // 默认激活第一个分类
      if (categoriesWithFavorites.length > 0) {
        setActiveCategory(categoriesWithFavorites[0]);
      }
      return result.data;
    } catch (error) {
      console.error("加载插件时出错:", error);
    }
  };
  // 插件获取歌单
  const loadPluginSheetsFromWorder = async (page) => {
    try {
      return fetchDataFromWorker({
        functionName: "getRecommendSheetsByTag",
        fetchData: [activeSubCategory, page],
      }).then((res) => res?.data || {});
    } catch (error) {
      console.error("加载歌单时出错:", error);
    }
  };

  // 获取歌单歌曲
  const loadPluginSheetMusicFromWorker = async (sheet, page) => {
    try {
      return fetchDataFromWorker({
        functionName: "getMusicSheetInfo",
        fetchData: [sheet, page],
      }).then((res) => res?.data || {});
    } catch (error) {
      console.error("加载歌单时出错:", error);
    }
  };
  // 获取搜索歌曲
  const loadPluginSearchMusicFromWorker = async (keyword, page, type) => {
    try {
      return fetchDataFromWorker({
        functionName: "search",
        fetchData: [keyword, page, type],
      }).then((res) => res?.data || {});
    } catch (error) {
      console.error("加载搜索时出错:", error);
    }
  };
  /**
   * 切换插件
   * @param {Object} plugin - 要切换到的插件对象
   */
  const switchPlugin = useCallback(
    (plugin) => {
      // 只有当切换到不同插件时才执行切换逻辑
      if (!activePlugin || (activePlugin && activePlugin.id !== plugin.id)) {
        setActivePlugin(plugin);
        // 切换插件时重置分类选择
        setActiveCategory(null);
        setSubCategories([]);
        setActiveSubCategory(null);
      }
    },
    [activePlugin]
  );
  // 处理插件切换
  const handlePluginChange = useCallback(
    (plugin) => {
      // 只有当切换到不同插件时才执行切换逻辑
      if (!activePlugin || (activePlugin && activePlugin.id !== plugin.id)) {
        switchPlugin(plugin);
      }
    },
    [activePlugin, switchPlugin]
  );

  // 处理一级分类选择
  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category);
    // 切换分类时重置子分类
    setSubCategories([]);
    setActiveSubCategory(null);
  }, []);

  // 处理二级分类选择
  const handleSubCategorySelect = useCallback((subCategory) => {
    setActiveSubCategory(subCategory);
  }, []);

  // 当激活的一级分类改变时，更新二级分类
  useEffect(() => {
    // 特殊处理"收藏"分类
    if (activeCategory && activeCategory.isFavorites) {
      // 对于"收藏"分类，我们不需要子分类
      setSubCategories([]);
      setActiveSubCategory(null);
    }
    // 处理普通分类
    else if (activeCategory) {
      const newSubCategories = activeCategory.data || [];
      setSubCategories(newSubCategories);

      // 默认激活第一个子分类
      if (newSubCategories.length > 0) {
        setActiveSubCategory(newSubCategories[0]);
      } else {
        setActiveSubCategory(null);
      }
    } else {
      setSubCategories([]);
      setActiveSubCategory(null);
    }
  }, [activeCategory]);
  return {
    workerRef,
    loadPluginsFromWorker,
    pluginsLoaded,
    plugins,
    categories,
    subCategories,
    activeCategory,
    activeSubCategory,
    setPlugins,
    switchPlugin,
    setActivePlugin,
    loadPluginSheetsFromWorder,
    loadPluginCategoriesFromWorder,
    loadPluginSheetMusicFromWorker,
    handlePluginChange,
    handleCategorySelect,
    handleSubCategorySelect,
    fetchDataFromWorker,
    loadPluginSearchMusicFromWorker
  };
};

export default usePluginsWorker;
