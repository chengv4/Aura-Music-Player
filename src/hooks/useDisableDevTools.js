import { useEffect } from 'react';

/**
 * 自定义Hook，用于禁用右键菜单和F12开发者工具
 * 可用于防止用户查看或修改应用代码
 * 仅在生产环境中生效
 */
const useDisableDevTools = () => {
  useEffect(() => {
    // 使用webpack定义的全局变量判断是否为开发环境
    // 在开发环境中不执行禁用操作
    if (typeof __IS_DEVELOPMENT__ !== 'undefined' && __IS_DEVELOPMENT__) {
      return;
    }

    // 禁用右键菜单
    const disableRightClick = (e) => {
      e.preventDefault();
    };

    // 禁用F12和其他开发者工具快捷键
    const disableDevTools = (e) => {
      // F12键
      if (e.keyCode === 123) {
        e.preventDefault();
      }
      // Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
      }
      // Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
      }
      // Ctrl+U (查看源代码)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
      }
      // Ctrl+S (保存页面)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
      }
    };

    // 添加事件监听器
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableDevTools);

    // 清理函数
    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableDevTools);
    };
  }, []);
};

export default useDisableDevTools;