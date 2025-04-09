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