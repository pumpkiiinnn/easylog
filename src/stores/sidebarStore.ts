import { create } from 'zustand';

type SidebarType = 'settings' | 'notifications' | 'user' | 'app-settings' | 'chat-history' | null;

interface SidebarState {
  activeSidebar: SidebarType;
  setActiveSidebar: (type: SidebarType) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  activeSidebar: null,
  setActiveSidebar: (type) => set({ activeSidebar: type }),
})); 