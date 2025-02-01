import { LogEntry, LogLevel } from '../types/log';

export class LogParser {
  // 日志正则表达式
  private static LOG_PATTERN = /\[(2K)?(\S+)\s+\|\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+(ERROR|WARN|INFO|DEBUG)\s+\|\s+\[([^\]]+)\]\s+([^\s\[]+)(?:\s+\[(\d+)\])?\s+\|\s+(?:\[([^\]]+)\])?\s+\|\s+(.+)/;

  static parseLogLine(line: string): LogEntry | null {
    const match = line.match(this.LOG_PATTERN);
    if (!match) return null;

    const [
      ,
      ,
      service,
      timestamp,
      level,
      thread,
      className,
      lineNumber,
      traceId,
      message
    ] = match;

    return {
      timestamp,
      level: level as LogLevel,
      thread,
      className,
      lineNumber,
      traceId,
      message,
      rawContent: line
    };
  }

  static parseLogContent(content: string): LogEntry[] {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => this.parseLogLine(line))
      .filter((entry): entry is LogEntry => entry !== null);
  }
} 