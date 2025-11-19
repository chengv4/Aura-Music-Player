import React, { useState, useEffect, useRef, useMemo } from "react";
import localforage from "localforage";
import useMusicOperations from "@/hooks/useMusicOperations";
import { useMusic } from "@/src/MusicContext";
import useKeyboardControls from "@/hooks/useKeyboardControls"; // 导入键盘控制hook
import TrackList from "./TrackList/TrackList"; // 导入TrackList组件
import "./Player.css";
import {
  PlayIcon,
  PauseIcon,
  DownloadIcon,
  FavoriteIcon,
  VolumeIcon,
  LoopIcon,
  NextIcon,
  PrevIcon,
} from "@/assets/svg";

const Player = ({
  track,
  isPlaying,
  onPlay,
  onClose,
  currentTime,
  duration,
  onSeek,
  onVolumeChange,
  audioRef,
  activePlugin,
  setCurrentTime: propSetCurrentTime, // 重命名属性以避免冲突
}) => {
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(false); // 添加播放列表显示状态
  const volumeControlRef = useRef(null);
  const [currentTrackPage, setCurrentTrackPage] = useState(1); // 歌曲列表当前页

  // 使用新的音乐状态管理
  const { isFavorite, playlist, loopMode, setLoopMode } = useMusic();

  // 使用自定义hook处理音乐操作功能
  const { isDownloading, downloadMusic, toggleFavorite } =
    useMusicOperations();

  // 格式化时间显示
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // 计算播放进度百分比
  const progressPercentage = useMemo(() => {
    return duration ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);


  // 加载保存的音量设置
  useEffect(() => {
    const loadVolume = async () => {
      try {
        const savedVolume = await localforage.getItem("playerVolume");
        if (savedVolume !== null) {
          setVolume(savedVolume);
          // 加载后立即应用音量
          if (onVolumeChange) {
            onVolumeChange(savedVolume);
          }
        }
      } catch (error) {
        console.error("加载音量设置失败:", error);
      }
    };

    loadVolume();
  }, []);

  // 保存音量设置
  useEffect(() => {
    const saveVolume = async () => {
      try {
        await localforage.setItem("playerVolume", volume);
      } catch (error) {
        console.error("保存音量设置失败:", error);
      }
    };

    saveVolume();

    // 当音量变化时应用到audio元素
    if (audioRef && audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  // 当音量变化时通知父组件
  useEffect(() => {
    if (onVolumeChange) {
      onVolumeChange(volume);
    }
  }, [volume, onVolumeChange]);

  // 点击音量按钮切换音量控制面板显示
  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };
  // 切换循环模式
  const toggleLoopMode = () => {
    const modes = ["repeat", "shuffle", "repeat-one"];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLoopMode(modes[nextIndex]);
  };

  // 播放上一首
  const playPrevTrack = () => {
    if (!playlist || playlist.length === 0) return;

    let prevTrack = null;

    if (loopMode === "shuffle") {
      // 随机播放模式
      const otherTracks = playlist.filter(t => t.id !== track?.id);
      if (otherTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherTracks.length);
        prevTrack = otherTracks[randomIndex];
      }
    } else {
      // 普通模式和单曲循环模式
      const currentIndex = playlist.findIndex(t => t.id === track?.id);
      // 如果是第一首，则播放最后一首，否则播放前一首
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
      prevTrack = playlist[prevIndex];
    }

    if (prevTrack) {
      onPlay(prevTrack);
    }
  };

  // 播放下一首
  const playNextTrack = () => {
    if (!playlist || playlist.length === 0) return;

    let nextTrack = null;

    if (loopMode === "shuffle") {
      // 随机播放模式
      const otherTracks = playlist.filter(t => t.id !== track?.id);
      if (otherTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherTracks.length);
        nextTrack = otherTracks[randomIndex];
      }
    } else {
      // 普通模式和单曲循环模式
      const currentIndex = playlist.findIndex(t => t.id === track?.id);
      const nextIndex = (currentIndex + 1) % playlist.length;
      nextTrack = playlist[nextIndex];
    }
    if (nextTrack) {
      onPlay(nextTrack);
    }
  };

  // 处理音量变化
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // 点击其他地方关闭音量控制面板
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target)
      ) {
        setShowVolumeControl(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 使用键盘控制hook
  useKeyboardControls({
    onSeek: (seconds) => {
      // 快进/快退指定秒数
      if (audioRef && audioRef.current && duration && currentTime !== undefined) {
        const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        audioRef.current.currentTime = newTime;
        // 直接更新当前时间状态，而不是调用onSeek（避免DOM事件相关错误）
        if (propSetCurrentTime) {
          propSetCurrentTime(newTime);
        }
      }
    },
    onNextTrack: playNextTrack,
    onPrevTrack: playPrevTrack,
    onTogglePlay: () => {
      // 切换播放/暂停状态，直接调用onPlay来切换当前歌曲的播放状态
      if (onPlay && track) {
        onPlay(track);
      }
    },
    isPlaying,
    seekStep: 5, // 设置快进步长为5秒
  });

  if (!track) {
    return null;
  }

  return (
    <div className="player">
      <div className="player-content">
        {/* 专辑封面 */}
        <div className="album-art">
          {track?.artwork ? (
            <img src={track.artwork} alt={track.title} />
          ) : (
            <div className="placeholder-art"></div>
          )}
        </div>

        {/* 音乐信息 */}
        <div className="track-info">
          <div className="track-title">{track?.title || "暂无播放"}</div>
          <div className="track-artist">{track?.artist || "未知艺术家"}</div>
        </div>

        {/* 进度条 */}
        <div className="progress-wrapper">
          <div className="progress-bar" onClick={onSeek}>
            <div
              className="progress-filled"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* 时间显示和控制按钮 */}
        <div className="time-and-controls">
          <button className="control-button last-button" onClick={playPrevTrack} title="上一首 【快捷键 ↑】">
            <PrevIcon />
          </button>
          <button className="control-button" onClick={() => onPlay(track)} title="播放/暂停 【快捷键 space】">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="control-button next-button" onClick={playNextTrack} title="下一首  【快捷键 ↓】">
            <NextIcon />
          </button>
          <button className="control-button loop-button" onClick={toggleLoopMode} title={`循环模式: ${loopMode}`}>
            <LoopIcon mode={loopMode} />
          </button>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="controls">
            {/* 音量控制按钮 */}
            <div className="volume-control-container" ref={volumeControlRef}>
              <button
                className="control-button"
                title="音量控制"
                onClick={toggleVolumeControl}
              >
                <VolumeIcon />
              </button>
              {showVolumeControl && (
                <div className="volume-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    style={{
                      background: `linear-gradient(to right, #3498db 0%, #3498db ${volume * 100
                        }%, #7f8c8d ${volume * 100}%, #7f8c8d 100%)`,
                    }}
                  />
                </div>
              )}
            </div>

            <button
              className="control-button"
              onClick={() => downloadMusic(track)}
              title="下载音乐"
              disabled={isDownloading}
            >
              {isDownloading ? <DownloadIcon /> : <DownloadIcon />}
            </button>
            <button
              className="control-button"
              onClick={() => toggleFavorite(track)}
              title={isFavorite(track.id) ? "取消收藏" : "收藏歌曲"}
            >
              <FavoriteIcon isFavorited={isFavorite(track.id)} />
            </button>
            <button
              className="control-button"
              onClick={() => setShowPlaylist(!showPlaylist)}
              title="播放列表"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M3 5h10v1H3zM3 8h10v1H3zM3 11h10v1H3z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* 播放列表浮层 */}
      {showPlaylist && (
        <div className="playlist-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="playlist-header">
            <h3>播放列表</h3>
            <button
              className="close-playlist-button"
              onClick={() => setShowPlaylist(false)}
            >
              ✕
            </button>
          </div>
          <div className="playlist-content">
            <TrackList
              playlist={playlist}
              onPlay={onPlay}
              currentTrack={track}
              isPlaying={isPlaying}
              activePlugin={activePlugin}
              pageSize={10}
              currentPage={currentTrackPage}
              onPageChange={(page) => setCurrentTrackPage(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;