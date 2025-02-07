import { Store } from "@tauri-apps/plugin-store";
import { create } from 'zustand';

// @ts-ignore
const store = new Store('.settings.dat');

interface UserState {
  token: string | null;
  isLoggedIn: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  token: null,
  isLoggedIn: false,
  setToken: async (token: string) => {
    await store.set('user-token', token);
    await store.save();
    set({ token, isLoggedIn: true });
  },
  clearToken: async () => {
    await store.delete('user-token');
    await store.save();
    set({ token: null, isLoggedIn: false });
  },
}));

// 初始化时从存储加载 token
store.get('user-token').then((token) => {
  if (token) {
    useUserStore.getState().setToken(token as string);
  }
}); 