import React, { useEffect, useRef } from "react";
import "./SheetList.css";

const SheetList = ({ 
  sheets, 
  onPlaySheet, 
  loading, 
  hasMore, 
  onLoadMore,
  containerRef,
  onScroll
}) => {
  const loaderRef = useRef();
  const internalContainerRef = useRef();

  // 使用外部传入的ref或内部ref
  const scrollContainerRef = containerRef || internalContainerRef;

  // 设置观察器以实现无限滚动
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [onLoadMore, hasMore, loading]);

  // 处理滚动事件
  const handleScroll = (e) => {
    if (onScroll) {
      onScroll(e);
    }
  };

  return (
    <div 
      className="sheet-list" 
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      {sheets && sheets.length > 0 ? (
        <>
          <div className="sheets-container">
            {sheets.map((sheet) => (
              <div
                key={sheet.id}
                className="sheet-card"
                onClick={() => onPlaySheet(sheet)}
              >
                <div className="sheet-cover">
                  {sheet.artwork ? (
                    <img src={sheet.artwork} alt={sheet.title} />
                  ) : (
                    <div className="placeholder-cover"></div>
                  )}
                </div>
                <div className="sheet-info">
                  <div className="sheet-title" title={sheet?.title || "-"}>
                    {sheet.title || "-"}
                  </div>
                  <div className="sheet-author" title={sheet?.artist || "-"}>
                    {sheet?.artist || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 加载更多指示器 */}
          {hasMore && (
            <div ref={loaderRef} className="loading-indicator">
              {loading ? <div>加载中...</div> : <div>滚动加载更多</div>}
            </div>
          )}

          {!hasMore && (
            <div className="end-indicator">没有更多歌单了</div>
          )}
        </>
      ) : loading ? (
        <div className="loading-indicator">加载中...</div>
      ) : (
        <div className="empty-sheets">
          <p>暂无歌单</p>
        </div>
      )}
    </div>
  );
};

export default SheetList;