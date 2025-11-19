import React from 'react';
import './Playlist.css';

const Playlist = ({ playlist, onPlay }) => {
  // 示例数据
  const sampleTracks = [
    { id: 1, title: '示例歌曲 1', artist: '艺术家 1', cover: '' },
    { id: 2, title: '示例歌曲 2', artist: '艺术家 2', cover: '' },
    { id: 3, title: '示例歌曲 3', artist: '艺术家 3', cover: '' },
  ];

  const handlePlayTrack = (track) => {
    onPlay(track);
  };

  return (
    <div className="playlist">
      <h3>播放列表</h3>
      <ul>
        {(playlist.length > 0 ? playlist : sampleTracks).map((track) => (
          <li key={track.id} onClick={() => handlePlayTrack(track)}>
            <div className="track-cover">
              {track.cover ? (
                <img src={track.cover} alt={track.title} />
              ) : (
                <div className="placeholder-cover"></div>
              )}
            </div>
            <div className="track-details">
              <div className="track-title">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playlist;