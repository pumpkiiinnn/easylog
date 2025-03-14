import { load, Store } from "@tauri-apps/plugin-store";
import { create } from 'zustand';
import { join } from '@tauri-apps/api/path';
import { appConfigDir } from '@tauri-apps/api/path';
import { RemoteLog } from '../hooks/useRemoteLogHandler';

let store: Store | null = null;

// 初始化存储
async function initStore() {
  try {
    if (store) return; // 防止重复初始化
    
    const configDir = await appConfigDir();
    const storePath = await join(configDir, 'settings.json'); // 使用相同的存储文件
    console.log('初始化远程日志存储:', storePath);
    
    store = await load(storePath);
    
    const savedLogs = await store.get('remote-logs') as RemoteLog[] | null;
    console.log('从存储加载的远程日志:', savedLogs);
    
    if (savedLogs && Array.isArray(savedLogs)) {
      useRemoteLogStore.getState().setLogs(savedLogs);
    }
  } catch (error) {
    console.error('初始化远程日志存储错误:', error);
  }
}

// 确保 store 初始化完成的函数
async function ensureStore() {
  if (!store) {
    await initStore();
  }
  return store;
}

interface RemoteLogState {
  logs: RemoteLog[];
  setLogs: (logs: RemoteLog[]) => Promise<void>;
  addLog: (log: RemoteLog) => Promise<void>;
  updateLog: (log: RemoteLog) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
}

export const useRemoteLogStore = create<RemoteLogState>((set, get) => ({
  logs: [],
  
  setLogs: async (logs: RemoteLog[]) => {
    const storeInstance = await ensureStore();
    if (!storeInstance) {
      console.error('无法初始化存储!');
      return;
    }
    
    try {
      await storeInstance.set('remote-logs', logs);
      await storeInstance.save();
      set({ logs });
      console.log('远程日志已保存到存储:', logs);
    } catch (error) {
      console.error('保存远程日志错误:', error);
    }
  },
  
  addLog: async (log: RemoteLog) => {
    const { logs, setLogs } = get();
    const newLogs = [...logs, log];
    await setLogs(newLogs);
  },
  
  updateLog: async (log: RemoteLog) => {
    const { logs, setLogs } = get();
    const newLogs = logs.map(l => l.id === log.id ? log : l);
    await setLogs(newLogs);
  },
  
  deleteLog: async (id: string) => {
    const { logs, setLogs } = get();
    const newLogs = logs.filter(l => l.id !== id);
    await setLogs(newLogs);
  }
}));

// 初始化 store
initStore().catch(console.error);
