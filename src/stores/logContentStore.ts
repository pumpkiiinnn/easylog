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
  setLogContent: (content: string) => set((state) => ({ ...state, content })),
  setCurrentFileName: (fileName: string) => set((state) => ({ ...state, currentFileName: fileName }))
})); 