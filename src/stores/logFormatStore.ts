import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogFormat } from '../types/log';

interface LogFormatState {
  formats: CustomLogFormat[];
  activeFormatId: string | null;
  
  // 操作方法
  addFormat: (format: Omit<CustomLogFormat, 'id'>) => string;
  updateFormat: (id: string, format: Partial<Omit<CustomLogFormat, 'id'>>) => void;
  deleteFormat: (id: string) => void;
  setActiveFormat: (id: string | null) => void;
  getFormatById: (id: string) => CustomLogFormat | undefined;
}

// 预定义的默认格式
const defaultFormats: CustomLogFormat[] = [
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    pattern: '^(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+(\\w+)\\s+(\\d+)\\s+---\\s+\\[(.*?)\\]\\s+(.*?)\\s*:\\s+(.*)$',
    groups: {
      timestamp: 1,
      level: 2,
      traceId: 4,
      logger: 5,
      message: 6
    },
    sample: '2023-04-08 16:40:01.279 INFO 17017 --- [thread-1] org.example.Class: This is a sample log message',
    isDefault: true
  },
  {
    id: 'standard-log',
    name: '标准日志格式',
    pattern: '^(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?)\\s+\\[(\\w+)\\]\\s+(.*)$',
    groups: {
      timestamp: 1,
      level: 2,
      message: 3
    },
    sample: '2023-04-08 16:40:01.279 [INFO] This is a sample log message',
    isDefault: true
  }
];

export const useLogFormatStore = create<LogFormatState>()(
  persist(
    (set, get) => ({
      formats: defaultFormats,
      activeFormatId: null,
      
      addFormat: (format) => {
        const id = uuidv4();
        set((state) => ({
          formats: [...state.formats, { ...format, id }]
        }));
        return id;
      },
      
      updateFormat: (id, format) => {
        set((state) => ({
          formats: state.formats.map((item) => 
            item.id === id ? { ...item, ...format } : item
          )
        }));
      },
      
      deleteFormat: (id) => {
        // 不允许删除默认格式
        const format = get().formats.find(f => f.id === id);
        if (format?.isDefault) return;
        
        set((state) => ({
          formats: state.formats.filter((item) => item.id !== id),
          // 如果删除的是当前激活的格式，重置激活的格式ID
          activeFormatId: state.activeFormatId === id ? null : state.activeFormatId
        }));
      },
      
      setActiveFormat: (id) => {
        set({ activeFormatId: id });
      },
      
      getFormatById: (id) => {
        return get().formats.find((format) => format.id === id);
      }
    }),
    {
      name: 'log-format-storage',
      partialize: (state) => ({ 
        formats: state.formats.filter(format => !format.isDefault),
        activeFormatId: state.activeFormatId
      })
    }
  )
); 