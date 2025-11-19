import { useState, useEffect, useCallback, useRef } from "react";
import pluginConfig from "@/plugins/config.json";
import { useMusic } from '@/src/MusicContext';

/**
 * 自定义hook，用于管理插件状态
 * @returns {Object} 包含插件相关状态和方法的对象
 */
const usePlugins = () => {
  const [plugins, setPlugins] = useState([]);
  const [categories, setCategories] = useState([]); // 第一层分类（菜单）
  const [activeCategory, setActiveCategory] = useState(null); // 激活的一级分类
  const [subCategories, setSubCategories] = useState([]); // 第二层分类（标签）
  const [activeSubCategory, setActiveSubCategory] = useState(null); // 激活的二级分类
  // const [pluginModules, setPluginModules] = useState({}); // 存储已加载的插件模块
  const { activePlugin, setActivePlugin, pluginModules, setPluginModules } = useMusic();

  // 加载所有插件配置和模块
  useEffect(() => {
    const loadAllPlugins = async () => {
      // 从plugins/config.json加载插件配置
      const loadedPlugins = pluginConfig.plugins || [];
      setPlugins(loadedPlugins);

      // 预加载所有插件模块
      const modules = {};
      for (const plugin of loadedPlugins) {
        try {
          const pluginModule = await import(`../../plugins${plugin.url}`);
          modules[plugin.id] = pluginModule.default;
        } catch (error) {
          console.error(`加载插件模块失败 (${plugin.name}):`, error);
        }
      }
      modules.ready = true;
      setPluginModules(modules);
      // 默认激活第一个插件
      if (loadedPlugins.length > 0 && !activePlugin?.id) {
        setActivePlugin(loadedPlugins[0]);
      }
    };
    if (!pluginModules?.ready) {
      // loadAllPlugins();
    }
  }, []);

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

  /**
   * 动态加载插件模块（现在直接从已存储的模块中获取）
   * @param {Object} plugin - 插件对象
   * @returns {Promise<Object|null>} 插件模块的默认导出
   */
  const loadPluginModule = useCallback(
    async (plugin) => {
      if (!plugin) return null;

      // 直接从已加载的模块中获取
      return pluginModules[plugin.id] || null;
    },
    [pluginModules]
  );

  // 根据插件获取分类数据（使用已存储的模块）
  const loadPluginCategories = useCallback(
    async (plugin) => {
      if (!plugin) return;

      try {
        // 从已加载的模块中获取插件实例
        const pluginInstance = pluginModules[plugin.id];

        if (
          pluginInstance &&
          typeof pluginInstance.getRecommendSheetTags === "function"
        ) {
          // 调用插件的getRecommendSheetTags方法获取分类数据
          try {
            const tagData = await pluginInstance.getRecommendSheetTags();

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
          } catch (apiError) {
            console.error("调用插件API时出错:", apiError);
          }
        }
      } catch (error) {
        console.error("加载插件时出错:", error);
      }
    },
    [pluginModules]
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
    // 插件状态
    plugins,
    activePlugin,
    categories,
    activeCategory,
    subCategories,
    activeSubCategory,
    pluginModules, // 导出已加载的插件模块

    // 方法
    setPlugins,
    switchPlugin,
    loadPluginModule,
    loadPluginCategories,
    handlePluginChange,
    handleCategorySelect,
    handleSubCategorySelect,
    setCategories,
    setActiveCategory,
    setSubCategories,
    setActiveSubCategory,
    setPluginModules,
    setActivePlugin
  };
};

export default usePlugins;
