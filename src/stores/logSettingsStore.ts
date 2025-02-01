import { create } from 'zustand';
import { LogLevel, LogStyle, LogFilter } from '../types/log';

interface LogSettingsState {
  styles: Record<LogLevel, LogStyle>;
  filter: LogFilter;
  autoRefresh: boolean;
  autoScroll: boolean;
  fontSize: number;
  setStyle: (level: LogLevel, style: LogStyle) => void;
  setFilter: (filter: Partial<LogFilter>) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setAutoScroll: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
}

export const useLogSettingsStore = create<LogSettingsState>((set) => ({
  styles: {
    ERROR: { color: '#ff0000', fontWeight: 600 },
    WARN: { color: '#ffa500' },
    INFO: { color: '#0000ff' },
    DEBUG: { color: '#666666' }
  },
  filter: {
    levels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
  },
  autoRefresh: false,
  autoScroll: true,
  fontSize: 13,
  
  setStyle: (level, style) => 
    set(state => ({
      styles: { ...state.styles, [level]: style }
    })),
    
  setFilter: (filter) =>
    set(state => ({
      filter: { ...state.filter, ...filter }
    })),
    
  setAutoRefresh: (enabled) =>
    set({ autoRefresh: enabled }),
    
  setAutoScroll: (enabled) =>
    set({ autoScroll: enabled }),
    
  setFontSize: (size) =>
    set({ fontSize: size })
})); 