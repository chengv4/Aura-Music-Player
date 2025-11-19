import React from 'react';
import './MusicPlayer.css';

const MusicPlayer = ({ track, isPlaying, onPlayToggle }) => {
  return (
    <div className="music-player">
      <div className="album-art">
        {track?.cover ? (
          <img src={track.cover} alt={track.title} />
        ) : (
          <div className="placeholder-art">
            <span className="note-symbol">♪</span>
          </div>
        )}
      </div>
      <div className="track-info">
        <h2 className="track-title">{track?.title || '暂无播放'}</h2>
        <p className="track-artist">{track?.artist || '未知艺术家'}</p>
      </div>
      <div className="controls">
        <button className="control-button" onClick={onPlayToggle}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
      <div className="progress-bar">
        <div className="progress"></div>
      </div>
    </div>
  );
};

export default MusicPlayer;