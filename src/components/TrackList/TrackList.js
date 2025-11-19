import React, { useState, useCallback, memo, useEffect } from "react";
import useMusicOperations from "@/hooks/useMusicOperations";
import { useMusic } from "@/src/MusicContext";
import "./TrackList.css";
import {
  PlayIcon,
  PauseIcon,
  AddToPlaylistIcon,
  DownloadIcon,
  FavoriteIcon,
} from "@/assets/svg";

const TrackList = ({
  playlist = [],
  onPlay,
  onPageChange,
  currentPage = 1,
  pageSize = 10,
  currentTrack,
  isPlaying,
}) => {
  const total = (playlist || []).length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentTracks = (playlist || []).slice(
    startIndex,
    startIndex + pageSize
  );

  // 使用新的音乐操作hook
  const { downloadMusic, toggleFavorite } = useMusicOperations();

  // 使用新的音乐状态管理
  const { addToPlaylist, delToPlaylist, isFavorite, isInPlaylist } = useMusic();

  const handlePlayTrack = useCallback(
    (track, e) => {
      e.stopPropagation();

      // 调用onPlay回调，让父组件处理播放逻辑
      if (onPlay) {
        onPlay(track);
      }
    },
    [onPlay]
  );

  // 添加到播放列表的处理函数
  const handleAddToPlaylist = useCallback(
    async (track, e) => {
      e.stopPropagation();

      try {
        if (isInPlaylist(track.id)) {
          await delToPlaylist(track);
          console.log("已从播放列表移除");
          return;
        }
        const added = await addToPlaylist(track);
        if (added) {
          console.log("已添加到播放列表");
        } else {
          console.log("歌曲已经在播放列表中");
        }
      } catch (error) {
        console.error("添加到播放列表失败:", error);
      }
    },
    [addToPlaylist]
  );

  // 收藏/取消收藏音乐
  const handleFavorite = useCallback(
    async (track, e) => {
      e.stopPropagation();

      try {
        // 使用新的hook处理收藏操作
        await toggleFavorite(track);
      } catch (error) {
        console.error("收藏操作失败:", error);
      }
    },
    [toggleFavorite]
  );

  // 下载音乐
  const handleDownload = useCallback(
    async (track, e) => {
      e.stopPropagation();

      if (!track) {
        console.log("没有可下载的音乐");
        return;
      }

      try {
        // 使用新的hook处理下载操作
        await downloadMusic(track);
      } catch (error) {
        console.error("下载失败:", error);
      }
    },
    [downloadMusic]
  );

  // 处理分页变化
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages && onPageChange) {
        onPageChange(newPage);
      }
    },
    [totalPages, onPageChange]
  );

  // 如果播放列表为空，显示空状态
  if (!playlist || (playlist || []).length === 0) {
    return (
      <div className="track-list-empty">
        <p>暂无歌曲</p>
      </div>
    );
  }

  return (
    <div className="track-list">
      <div className="tracks-container">
        {(currentTracks || []).map((track, index) => (
          <div
            key={track.id}
            className={`track-item ${currentTrack && currentTrack.id === track.id ? "playing" : ""
              }`}

          >
            <div className="track-cover">
              {track.artwork ? (
                <img src={track.artwork} alt={track.title} />
              ) : (
                <div className="placeholder-cover"></div>
              )}
            </div>
            <div className="track-details">
              <div className="track-title">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
            <div className="track-actions">
              <button
                className="track-action-style"
                title={isFavorite(track.id) ? "取消收藏" : "收藏"}
                onClick={(e) => handleFavorite(track, e)}
              >
                <FavoriteIcon isFavorited={isFavorite(track.id)} />
              </button>
              <button
                className="track-action-style"
                title={isInPlaylist(track.id) ? "已在播放列表" : "添加到播放列表"}
                onClick={(e) => handleAddToPlaylist(track, e)}
              >
                {isInPlaylist(track.id) ? (
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M2.5 8.5l3 3l6.5-6.5" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                ) : (
                  <AddToPlaylistIcon />
                )}
              </button>
              <button
                className="track-action-style"
                onClick={(e) => handleDownload(track, e)}
                disabled={!!downloadMusic.isDownloading}
              >
                <DownloadIcon />
              </button>
              {currentTrack && currentTrack.id === track.id && isPlaying ? (
                <button
                  className="track-action-style"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPlay) onPlay(track);
                  }}
                >
                  <PauseIcon />
                </button>
              ) : (
                <button
                  className="track-action-style"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPlay) onPlay(track);
                  }}
                >
                  <PlayIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            上一页
          </button>
          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(TrackList);
