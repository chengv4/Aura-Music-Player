import { useState, useCallback } from "react";
import { useMusic } from "@/src/MusicContext";

const useToast = () => {
  const { 
    toasts, 
    showToast, 
    removeToast, 
    showInfo, 
    showSuccess, 
    showWarning, 
    showError 
  } = useMusic();

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