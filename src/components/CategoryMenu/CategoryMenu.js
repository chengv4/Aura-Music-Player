import React, { memo } from "react";
import "./CategoryMenu.css";

const CategoryMenu = memo(
  ({ categories, activeCategory, onCategorySelect }) => {
    const handleCategoryClick = (category) => {
      // 只有当点击的不是当前激活的分类时才触发选择
      if (!activeCategory || activeCategory.title !== category.title) {
        // 调用父组件的处理函数
        if (onCategorySelect) {
          onCategorySelect(category);
        }
      }
    };
    return (
      <div className="category-menu">
        <h3 className="category-menu-title">分类</h3>
        <ul className="category-menu-list">
          {categories.map((category) => (
            <li
              key={category.title}
              className={`category-menu-item ${
                activeCategory && activeCategory.title === category.title
                  ? "active"
                  : ""
              } ${category.isFavorites ? "favorites" : ""}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category.title}
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

export default CategoryMenu;
