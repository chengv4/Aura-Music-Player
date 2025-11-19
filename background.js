// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Music Player extension installed");
});

// 存储已创建的窗口ID
let playerWindowId = null;

// 当扩展图标被点击时打开播放器窗口
chrome.action.onClicked.addListener((tab) => {
  // 如果已经存在播放器窗口，则聚焦到该窗口
  if (playerWindowId !== null) {
    chrome.windows.update(playerWindowId, { focused: true });
  } else {
    // 创建新的播放器窗口
    chrome.windows.create({
      url: chrome.runtime.getURL("index.html"),
      type: "popup",
      width: 500,
      height: 600
    }, (window) => {
      // 保存窗口ID
      playerWindowId = window.id;

      // 监听窗口关闭事件，清除保存的窗口ID
      chrome.windows.onRemoved.addListener(function onRemoved(windowId) {
        if (windowId === playerWindowId) {
          playerWindowId = null;
          chrome.windows.onRemoved.removeListener(onRemoved);
        }
      });
    });
  }
});