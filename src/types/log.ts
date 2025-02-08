export interface LogEntry {
  timestamp: string;
  level: string;
  traceId: string;
  content: string;
  rawContent: string;
  logger?: string;
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