import React from 'react';
import { useMusic } from "@/src/MusicContext";

export default function SetPlugins(props) {
    const { setShowSetPluginBtn, setPluginUrl, pluginUrl, handleCloseModal, handleImportPlugin } = props;
    const { plugins, setPluginModules, pluginModules, setPlugins } = useMusic();
    const handleRemovePlugin = (plugin) => {
        delete pluginModules[plugin.id];
        setPluginModules(pluginModules);
        const plugins =
            Object.values(pluginModules)?.map((v) => ({
                ...v,
                code: null,
            })) || [];
        setPlugins(plugins);
        if (plugins.length === 0) {
            setShowSetPluginBtn(true);
        }
    };
    return (
        <div className="modal-overlay">
            <div className="plugin-modal">
                <div className="modal-header">
                    <h3>插件设置</h3>
                    <button className="close-btn" onClick={handleCloseModal}>×</button>
                </div>
                <div className="modal-body">
                    <i style={{ color: '#999' }}>示例：https://chengv4.github.io/web-music-plugins/config.json</i>
                    <div className="url-input-section">
                        <input
                            type="text"
                            value={pluginUrl}
                            onChange={(e) => setPluginUrl(e.target.value)}
                            placeholder="请输入插件URL"
                            className="plugin-url-input"
                        />
                        <button
                            onClick={handleImportPlugin}
                            className="import-plugin-btn"
                            disabled={!pluginUrl.trim()}
                        >
                            导入插件
                        </button>
                    </div>
                    <div className="imported-plugins-section">
                        <h4>已导入插件:</h4>
                        {plugins.length > 0 ? (
                            <ul className="plugins-list">
                                {plugins.map((plugin, index) => (
                                    <li key={index} className="plugin-item">
                                        <span>{plugin.name}</span>
                                        <span>{plugin.version}</span>
                                        {/* <button
                                            className="update-plugin-btn"
                                        >
                                            更新
                                        </button> */}
                                        <button
                                            onClick={() => handleRemovePlugin(plugin)}
                                            className="remove-plugin-btn"
                                        >
                                            删除
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-plugins">暂无导入插件</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}