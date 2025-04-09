import { create } from 'zustand';
import { LogLevel, LogStyle, LogFilter } from '../types/log';

// 日志等级映射函数，将各种格式的日志等级规范化为标准形式
export const normalizeLogLevel = (level: string): LogLevel => {
  const lowerLevel = level.toLowerCase();
  
  // 错误级别
  if (['error', 'fatal', 'severe', 'critical', 'emergency', 'alert'].includes(lowerLevel)) {
    return 'error';
  }
  
  // 警告级别
  if (['warn', 'warning'].includes(lowerLevel)) {
    return 'warn';
  }
  
  // 信息级别
  if (['info', 'information', 'notice'].includes(lowerLevel)) {
    return 'info';
  }
  
  // 调试级别
  if (['debug', 'trace', 'verbose', 'fine', 'finer', 'finest'].includes(lowerLevel)) {
    return 'debug';
  }
  
  // 默认为 info
  return 'info';
};

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
  getStyleForLevel: (level: string) => LogStyle;
}

export const useLogSettingsStore = create<LogSettingsState>((set, get) => ({
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
    },
    trace: {
      color: '#868e96',
      fontWeight: 400
    }
  },
  filter: {
    levels: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'],
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
    set({ fontSize: size }),
    
  // 根据日志等级获取对应的样式
  getStyleForLevel: (level: string) => {
    const state = get();
    const normalizedLevel = normalizeLogLevel(level);
    return state.styles[normalizedLevel] || state.styles.info;
  }
})); 