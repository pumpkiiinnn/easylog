import { create } from 'zustand';
import { LogLevel, LogStyle, LogFilter } from '../types/log';

interface LogSettingsState {
  styles: Record<string, LogStyle>;
  filter: LogFilter;
  searchText: string;
  autoRefresh: boolean;
  autoScroll: boolean;
  fontSize: number;
  setStyle: (level: LogLevel, style: LogStyle) => void;
  setFilter: (filter: Partial<LogFilter>) => void;
  setSearchText: (text: string) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setAutoScroll: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
}

export const useLogSettingsStore = create<LogSettingsState>((set) => ({
  styles: {
    error: {
      color: '#fa5252',
      fontWeight: 600
    },
    warn: {
      color: '#fd7e14',
      fontWeight: 500
    },
    info: {
      color: '#228be6',
      fontWeight: 400
    },
    debug: {
      color: '#868e96',
      fontWeight: 400
    }
  },
  filter: {
    levels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
  },
  searchText: '',
  autoRefresh: false,
  autoScroll: true,
  fontSize: 14,
  
  setStyle: (level, style) => 
    set(state => ({
      styles: { ...state.styles, [level]: style }
    })),
    
  setFilter: (filter) =>
    set(state => ({
      filter: { ...state.filter, ...filter }
    })),
    
  setSearchText: (text) =>
    set({ searchText: text }),
    
  setAutoRefresh: (enabled) =>
    set({ autoRefresh: enabled }),
    
  setAutoScroll: (enabled) =>
    set({ autoScroll: enabled }),
    
  setFontSize: (size) =>
    set({ fontSize: size })
})); 