export interface LogEntry {
  timestamp: string;
  level: string;
  traceId: string;
  content: string;
  rawContent: string;
  logger?: string;
}

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 
                        'error' | 'warn' | 'info' | 'debug' | 'trace' | 
                        'FATAL' | 'fatal' | 'SEVERE' | 'severe' | 
                        'WARNING' | 'warning';

export interface LogStyle {
  color: string;
  backgroundColor?: string;
  fontWeight?: number;
}

export interface LogFilter {
  levels: LogLevel[];
  search?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// 自定义日志格式配置
export interface CustomLogFormat {
  id: string;
  name: string;
  // 正则表达式模式
  pattern: string;
  // 捕获组索引
  groups: {
    timestamp?: number;
    level: number;
    message: number;
    traceId?: number;
    logger?: number;
  };
  // 示例日志，用于测试正则表达式
  sample?: string;
  // 是否为默认格式
  isDefault?: boolean;
} 