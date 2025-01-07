interface Window {
  __TAURI__?: {
    [key: string]: any;
  };
}

declare global {
  interface Window {
    __TAURI__?: {
      [key: string]: any;
    };
  }
}

export const isTauri = () => {
  return !!window.__TAURI__;
}; 