import React, { memo, useRef, useEffect } from "react";
import "./Category.css";

/* 子分类 */
const Category = memo(
  ({ subCategories, onSubCategorySelect, activeSubCategory }) => {
    // 如果没有子分类，不渲染任何内容
    if (!subCategories || subCategories.length === 0) {
      return null;
    }

    const containerRef = useRef(null);

    // 添加鼠标滚轮横向滚动功能
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e) => {
        // 阻止默认的垂直滚动
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          // 将垂直滚动转换为水平滚动
          container.scrollLeft += e.deltaY;
        }
      };

      // 添加事件监听器
      container.addEventListener("wheel", handleWheel, { passive: false });

      // 清理事件监听器
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }, []);

    const handleSubCategoryClick = (subCategory) => {
      // 只有当点击的不是当前激活的子分类时才触发选择
      if (!activeSubCategory || activeSubCategory.id !== subCategory.id) {
        // 调用父组件的处理函数
        if (onSubCategorySelect) {
          onSubCategorySelect(subCategory);
        }
      }
    };

    return (
      <div className="category-container" ref={containerRef}>
        <div className="category-tags">
          {subCategories.map((subCategory) => (
            <div
              key={subCategory.id}
              className={`category-tag ${
                activeSubCategory && activeSubCategory.id === subCategory.id
                  ? "active"
                  : ""
              }`}
              onClick={() => handleSubCategoryClick(subCategory)}
            >
              {subCategory.title}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default Category;
