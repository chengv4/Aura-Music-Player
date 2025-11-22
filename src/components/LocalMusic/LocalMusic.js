import React, { useState, useRef, useCallback, useEffect } from "react";
import TrackList from "@/components/TrackList/TrackList";
import useToast from "@/hooks/useToast";
import localforage from "localforage";
import "./LocalMusic.css";

const LocalMusic = (props) => {
  const { onPlay, isPlaying, currentTrack, handlePlayAll } = props;
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { showWarning } = useToast();
  // 检查浏览器是否支持 File System Access API
  const supportFileSystemAccess = 'showDirectoryPicker' in window;

  // 加载保存的本地音乐信息
  useEffect(() => {
    const loadSavedTracks = async () => {
      try {
        const savedTracks = await localforage.getItem("localTracks") || [];
        setTracks(savedTracks);
      } catch (error) {
        console.error("加载本地音乐信息失败:", error);
      }
    };
    loadSavedTracks();
  }, []);
  useEffect(() => {
    if (tracks?.length) {
      const handle = tracks[0]?.handle;
      if (handle) {
        // 查询权限状态
        handle.queryPermission({ mode: 'read' }).then((status) => {
          if (status === 'granted') {
            console.log('权限已授予');
          } else {
            console.log('权限未授予, 请求权限');
            handle.requestPermission({ mode: 'read' })
          }
        });
      }
    }
  }, [tracks]);

  const saveLocalFiles = async (newTracks) => {
    const filterOldTracks = tracks.filter(t => !newTracks.find(nt => nt.id === t.id));
    const currentTracks = [...newTracks, ...filterOldTracks];
    setTracks(() => currentTracks);

    // 保存到本地存储
    try {
      await localforage.setItem("localTracks", currentTracks);
    } catch (error) {
      console.error("保存本地音乐信息失败:", error);
    }
  };
  const getTrackData = (file, entry) => {
    return {
      id: `local-${file.name}-${file?.size}`,
      artist: "-",
      title: file.name?.replace(/\.[^/.]+$/, ""),
      fileSize: file.size,
      lastModified: file.lastModified,
      handle: entry,
    }
  };
  // 处理文件夹选择 (使用File System Access API)
  const handleFolderSelect = async () => {
    if (!supportFileSystemAccess) {
      showWarning('您的浏览器不支持文件系统访问API，请使用最新版Chrome浏览器');
      return;
    }
    try {
      setIsLoading(true);
      const dirHandle = await window.showDirectoryPicker();
      await dirHandle.requestPermission({ mode: 'read' });
      // 遍历目录中的所有文件
      const fileHandles = dirHandle.entries() || [];
      const newTracks = [];
      for await (const item of fileHandles) {
        const entry = item[1] || {};
        // 检查是否为音频文件
        if (entry.kind === 'file' &&
          (entry.name.endsWith('.mp3') ||
            entry.name.endsWith('.wav') ||
            entry.name.endsWith('.ogg') ||
            entry.name.endsWith('.flac') ||
            entry.name.endsWith('.m4a'))) {

          const file = await entry?.getFile();
          const track = getTrackData(file, entry);
          newTracks.push(track);
        }
      }
      saveLocalFiles(newTracks);

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("选择文件夹时出错:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件选择 (使用File System Access API)
  const handleFileSelect = async () => {
    if (!supportFileSystemAccess) {
      showWarning('您的浏览器不支持文件系统访问API，请使用最新版Chrome浏览器');
      return;
    }
    try {
      setIsLoading(true);
      const fileHandles = await window.showOpenFilePicker({
        types: [{
          description: '音频文件',
          accept: {
            'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a']
          }
        }],
        multiple: true
      });

      // 处理选中的文件
      const newTracks = [];

      for (const entry of fileHandles) {
        const file = await entry.getFile();
        const track = getTrackData(file, entry);

        newTracks.push(track);
      }
      saveLocalFiles(newTracks);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("选择文件时出错:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // 移除选定的音乐
  const removeTrack = async (track) => {
    const updatedTracks = tracks.filter(({ id }) => track.id !== id);

    setTracks(updatedTracks);

    // 更新本地存储
    try {
      await localforage.setItem("localTracks", updatedTracks);
    } catch (error) {
      console.error("更新本地音乐信息失败:", error);
    }
  };

  return (
    <div className="local-music">
      <div className="local-music-header">
        <div className="local-music-controls">
          <button className="btn select-files-btn" onClick={handleFileSelect}>
            选择文件
          </button>
          <button className="btn select-folder-btn" onClick={handleFolderSelect}>
            选择文件夹
          </button>
          <button className="play-all-button" onClick={handlePlayAll}>
            ▶ 播放全部
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          正在扫描音乐文件...
        </div>
      )}

      <div className="local-music-list">
        {tracks.length === 0 ? (
          <div className="empty-state">
            <p>暂无本地音乐</p>
            <p>点击上方按钮添加音乐文件</p>
            {!supportFileSystemAccess && (
              <p className="warning">当前浏览器不支持文件系统访问API，请使用最新版Chrome浏览器以获得最佳体验</p>
            )}
          </div>
        ) : (
          <TrackList
            playlist={tracks}
            onPlay={onPlay}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            removeTrack={removeTrack}
          />
        )}
      </div>
    </div>
  );
};

export default LocalMusic;