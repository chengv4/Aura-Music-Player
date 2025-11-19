import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/utils'; // 导入通用防抖hook

/**
 * 自定义Hook，用于处理播放器的键盘控制
 * 功能包括：
 * 1. 按住右方向键快进（持续快进）
 * 2. 点击右方向键快进（单次快进）
 * 3. 按住左方向键快退（持续快退）
 * 4. 点击左方向键快退（单次快退）
 * 5. 按下方向键播放下一首
 * 6. 空格键暂停/播放
 * 
 * 快进快退时会暂停播放，停止操作后检查播放状态，如果暂停则恢复播放
 * 恢复播放方法添加防抖，防止频繁设置
 * 
 * @param {Object} options - 配置选项
 * @param {Function} options.onSeek - 快进回调函数
 * @param {Function} options.onNextTrack - 播放下一首回调函数
 * @param {Function} options.onTogglePlay - 播放/暂停切换回调函数
 * @param {Boolean} options.isPlaying - 当前播放状态
 * @param {Number} options.seekStep - 快进步长（秒）
 */
const useKeyboardControls = ({
  onSeek,
  onNextTrack,
  onPrevTrack,
  onTogglePlay,
  isPlaying,
  seekStep = 10
}) => {
  // 引用计时器和快进检测相关状态
  const seekIntervalRef = useRef(null);
  const lastRightKeyPressRef = useRef(0);
  const lastLeftKeyPressRef = useRef(0);
  const isSeekingRef = useRef(false);

  // 创建防抖的恢复播放函数
  const restorePlayWithDebounce = useDebounce(() => {
    // 快进/快退完成后，检查当前是否为播放状态，如果不是则恢复播放
    if (!isPlaying && onTogglePlay) {
      onTogglePlay();
    }
  }, 100);

  // 快进处理函数
  const handleSeekForward = useCallback(() => {
    if (onSeek) {
      onSeek(seekStep);
    }
  }, [onSeek, seekStep]);

  // 快退处理函数
  const handleSeekBackward = useCallback(() => {
    if (onSeek) {
      onSeek(-seekStep);
    }
  }, [onSeek, seekStep]);

  // 开始持续快进
  const startSeekingForward = useCallback(() => {
    if (!isSeekingRef.current) {
      isSeekingRef.current = true;
      // 暂停播放
      if (isPlaying && onTogglePlay) {
        onTogglePlay();
      }
      handleSeekForward();

      // 设置持续快进的间隔（每100毫秒快进一次）
      seekIntervalRef.current = setInterval(() => {
        handleSeekForward();
      }, 100);
    }
  }, [handleSeekForward, isPlaying, onTogglePlay]);

  // 开始持续快退
  const startSeekingBackward = useCallback(() => {
    if (!isSeekingRef.current) {
      isSeekingRef.current = true;
      // 暂停播放
      if (isPlaying && onTogglePlay) {
        onTogglePlay();
      }
      handleSeekBackward();

      // 设置持续快退的间隔（每100毫秒快退一次）
      seekIntervalRef.current = setInterval(() => {
        handleSeekBackward();
      }, 100);
    }
  }, [handleSeekBackward, isPlaying, onTogglePlay]);


  // 停止快进/快退
  const stopSeeking = useCallback(() => {
    if (seekIntervalRef.current) {
      clearInterval(seekIntervalRef.current);
      seekIntervalRef.current = null;
    }
    isSeekingRef.current = false;

    // 快进/快退完成后，检查播放状态，如果暂停则恢复播放（带防抖）
    restorePlayWithDebounce();
  }, [restorePlayWithDebounce]);

  // 处理按键按下事件
  const handleKeyDown = useCallback((event) => {
    // 防止在输入框中触发这些快捷键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
        // 检测快速连续按键（300ms内）实现单次快进
        const nowRight = Date.now();
        if (nowRight - lastRightKeyPressRef.current < 300) {
          // 快速按键，执行单次快进
          event.preventDefault();
          // 暂停播放
          if (isPlaying && onTogglePlay) {
            onTogglePlay();
          }
          handleSeekForward();
          // 快进完成后检查播放状态，如果不是播放状态则恢复播放（带防抖）
          restorePlayWithDebounce();
        } else {
          // 首次按键或间隔较长，开始持续快进
          event.preventDefault();
          startSeekingForward();
        }
        lastRightKeyPressRef.current = nowRight;
        break;

      case 'ArrowLeft':
        // 检测快速连续按键（300ms内）实现单次快退
        const nowLeft = Date.now();
        if (nowLeft - lastLeftKeyPressRef.current < 300) {
          // 快速按键，执行单次快退
          event.preventDefault();
          // 暂停播放
          if (isPlaying && onTogglePlay) {
            onTogglePlay();
          }
          handleSeekBackward();
          // 快退完成后检查播放状态，如果不是播放状态则恢复播放（带防抖）
          restorePlayWithDebounce();
        } else {
          // 首次按键或间隔较长，开始持续快退
          event.preventDefault();
          startSeekingBackward();
        }
        lastLeftKeyPressRef.current = nowLeft;
        break;

      case 'ArrowUp':
        // 上方向键播放上一首
        event.preventDefault();
        if (onPrevTrack) {
          onPrevTrack();
        }
        break;

      case 'ArrowDown':
        // 下方向键播放下一首
        event.preventDefault();
        if (onNextTrack) {
          onNextTrack();
        }
        break;

      case ' ':
        // 空格键切换播放/暂停
        event.preventDefault();
        if (onTogglePlay) {
          onTogglePlay();
        }
        break;

      default:
        break;
    }
  }, [onNextTrack, onPrevTrack, onTogglePlay, startSeekingForward, startSeekingBackward,
    handleSeekForward, handleSeekBackward, isPlaying, restorePlayWithDebounce]);

  // 处理按键释放事件
  const handleKeyUp = useCallback((event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      stopSeeking();
    }
  }, [stopSeeking]);

  // 设置事件监听器
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (seekIntervalRef.current) {
        clearInterval(seekIntervalRef.current);
        seekIntervalRef.current = null;
      }

      // 清除快进定时器
      if (seekIntervalRef.current) {
        clearInterval(seekIntervalRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, stopSeeking]);

  // 返回一些可能有用的函数，例如手动停止快进
  return {
    stopSeeking
  };
};

export default useKeyboardControls;