import { useState, useCallback } from "react";

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 2000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts(prevToasts => [...prevToasts, toast]);

    // 自动移除提示
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, "info", duration);
  }, [showToast]);

  const showSuccess = useCallback((message, duration) => {
    return showToast(message, "success", duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    return showToast(message, "warning", duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    return showToast(message, "error", duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showInfo,
    showSuccess,
    showWarning,
    showError
  };
};

export default useToast;