import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <svg className="spinner" viewBox="0 0 50 50">
          <circle
            className="path"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
          ></circle>
        </svg>
        <p className="loading-text">加载中...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
