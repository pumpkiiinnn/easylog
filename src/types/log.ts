export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  thread: string;
  className: string;
  lineNumber: string;
  traceId: string;
  message: string;
  rawContent: string;
}

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

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