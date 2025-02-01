import { create } from 'zustand';

interface LogContentState {
  content: string;
  currentFileName: string;
  setLogContent: (content: string) => void;
  setCurrentFileName: (fileName: string) => void;
}

export const useLogContentStore = create<LogContentState>((set) => ({
  content: '',
  currentFileName: '',
  setLogContent: (content: string) => {
    console.log('Store setLogContent called:', {
      contentLength: content.length,
      preview: content.substring(0, 100)
    });
    set((state) => ({ ...state, content }));
  },
  setCurrentFileName: (fileName: string) => {
    console.log('Store setCurrentFileName called:', fileName);
    set((state) => ({ ...state, currentFileName: fileName }));
  }
})); 