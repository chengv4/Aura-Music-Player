import React, { memo } from 'react';
import { SetIcon } from '@/assets/svg';
import './PluginTabs.css';

const PluginTabs = memo(({ plugins, activePlugin, onPluginChange, onSetting }) => {
  const handlePluginClick = (plugin) => {
    // 只有当点击的不是当前激活的插件时才触发切换
    if (!activePlugin || activePlugin.id !== plugin.id) {
      // 调用父组件的处理函数
      if (onPluginChange) {
        onPluginChange(plugin);
      }
    }
  };

  return (
    <div className="plugin-tabs-container">
      <div className="plugin-tabs">
        <div className='plugin-btns'>
          {plugins.map((plugin) => (
            <button
              key={plugin.id}
              className={`plugin-tab ${activePlugin && activePlugin.id === plugin.id ? 'active' : ''}`}
              onClick={() => handlePluginClick(plugin)}
            >
              {plugin.name}
            </button>
          ))}
        </div>
        {plugins.length > 0 && <button className='plugin-svg-btn' onClick={onSetting}><SetIcon /></button>}
      </div>
    </div>
  );
});

export default PluginTabs;