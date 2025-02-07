import { load, Store } from "@tauri-apps/plugin-store";
import { create } from 'zustand';
import { join } from '@tauri-apps/api/path';
import { appConfigDir } from '@tauri-apps/api/path';

export interface UserInfo {
  name: string;
  avatar: string;
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
}

let store: Store | null = null;

// 修改初始化函数
async function initStore() {
  try {
    if (store) return; // 防止重复初始化
    
    const configDir = await appConfigDir();
    const storePath = await join(configDir, 'settings.json');
    console.log('Initializing store at:', storePath);
    
    store = await load(storePath);
    
    const token = await store.get('user-token') as string | null;
    const userInfo = await store.get('user-info') as UserInfo | null;
    console.log('Loaded from store:', { token, userInfo });
    
    if (token && userInfo) {
      useUserStore.getState().setUserData(token, userInfo);
    }
  } catch (error) {
    console.error('Error initializing store:', error);
  }
}

// 确保 store 初始化完成的函数
async function ensureStore() {
  if (!store) {
    await initStore();
  }
  return store;
}

interface UserState {
  token: string | null;
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  setUserData: (token: string, userInfo: UserInfo) => Promise<void>;
  clearUserData: () => Promise<void>;
}

const defaultUserInfo: UserInfo = {
  name: "游客",
  avatar: "",
  email: "",
  subscription: 'free'
};

export const useUserStore = create<UserState>((set, get) => ({
  token: null,
  isLoggedIn: false,
  userInfo: null,
  setUserData: async (token: string, userInfo: UserInfo) => {
    console.log('Setting user data in store:', { token, userInfo });
    const storeInstance = await ensureStore();
    if (!storeInstance) {
      console.error('Failed to initialize store!');
      return;
    }
    
    try {
      await storeInstance.set('user-token', token);
      await storeInstance.set('user-info', userInfo);
      await storeInstance.save();
      set({ token, userInfo, isLoggedIn: true });
      console.log('Current store state:', get());
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },
  clearUserData: async () => {
    const storeInstance = await ensureStore();
    if (!storeInstance) {
      console.error('Failed to initialize store!');
      return;
    }
    
    try {
      await storeInstance.delete('user-token');
      await storeInstance.delete('user-info');
      await storeInstance.save();
      set({ token: null, userInfo: null, isLoggedIn: false });
      console.log('User data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },
}));

// 初始化 store
initStore().catch(console.error); 