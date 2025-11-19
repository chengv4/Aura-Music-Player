import React from "react";
import "./Toast.css";

const Toast = ({ toast, onRemove }) => {
  const { message, type } = toast;

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "toast-success";
      case "warning":
        return "toast-warning";
      case "error":
        return "toast-error";
      default:
        return "toast-info";
    }
  };

  return (
    <div className={`toast ${getTypeClass()}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        &times;
      </button>
    </div>
  );
};

export default Toast;