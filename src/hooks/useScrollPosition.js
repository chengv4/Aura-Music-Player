import { useState, useRef, useCallback } from 'react';

/**
 * 自定义hook，用于保存和恢复滚动位置
 * @param {string} key - 用于标识滚动位置的唯一键名
 */
const useScrollPosition = (key) => {
  const [scrollPositions, setScrollPositions] = useState({});
  const containerRef = useRef(null);

  /**
   * 保存指定key的滚动位置
   * @param {number} position - 滚动位置
   */
  const saveScrollPosition = useCallback((position) => {
    setScrollPositions(prev => ({
      ...prev,
      [key]: position
    }));
  }, [key]);

  /**
   * 获取指定key的滚动位置
   * @returns {number} 滚动位置
   */
  const getScrollPosition = useCallback(() => {
    const position = scrollPositions[key] || 0;
    return position;
  }, [scrollPositions, key]);

  /**
   * 恢复滚动位置
   */
  const restoreScrollPosition = useCallback(() => {
    const position = getScrollPosition();
    if (containerRef.current) {
      containerRef.current.scrollTop = position;
    } else {
      console.log('无法恢复滚动位置，容器引用为空');
    }
  }, [getScrollPosition]);

  /**
   * 处理滚动事件
   */
  const handleScroll = useCallback((e) => {
    saveScrollPosition(e.target.scrollTop);
  }, [saveScrollPosition]);

  return {
    containerRef,
    saveScrollPosition,
    getScrollPosition,
    restoreScrollPosition,
    handleScroll
  };
};

export default useScrollPosition;