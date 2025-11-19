import { useRef, useCallback, useEffect } from 'react';


/**
 * 通用防抖hook
 * @param {Function} func - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const useDebounce = (func, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 组件卸载时清理定时器
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      func(...args);
      timeoutRef.current = null;
    }, delay);
  }, [func, delay]);
};

export default {
  useDebounce
};