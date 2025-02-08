import { LogEntry, LogLevel } from '../types/log';

export class LogParser {
  // Spring Boot 日志格式的正则表达式
  private static springBootLogPattern = /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\w+)\s+(\d+)\s+---\s+\[(.*?)\]\s+(.*?)\s*:\s+(.*)$/;

  // 原有的日志格式正则表达式
  private static standardLogPattern = /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\s+\[(\w+)\]\s+(.*)$/;

  // 检查是否为堆栈跟踪行
  private static isStackTraceLine(line: string): boolean {
    return line.startsWith('\t') || // 以制表符开头
           line.startsWith('at ') || // 以"at "开头
           line.startsWith('Caused by: ') || // 以"Caused by: "开头
           /^[a-z]+\.[a-z]+\.[a-zA-Z.]*Exception:/.test(line); // 异常类名开头
  }

  static parseLogContent(content: string): LogEntry[] {
    if (!content) return [];

    const lines = content.split('\n');
    const entries: LogEntry[] = [];
    let currentLevel: string | null = null;

    for (const line of lines) {
      if (!line.trim()) continue;

      // 尝试匹配 Spring Boot 格式
      const springBootMatch = line.match(this.springBootLogPattern);
      if (springBootMatch) {
        const [, timestamp, level, pid, thread, logger, message] = springBootMatch;
        currentLevel = level.toLowerCase();
        entries.push({
          timestamp,
          level: currentLevel,
          traceId: thread,
          content: message,
          rawContent: line,
          logger: logger
        });
        continue;
      }

      // 检查是否为堆栈跟踪行
      if (currentLevel && this.isStackTraceLine(line)) {
        entries.push({
          timestamp: '',
          level: currentLevel, // 使用前一个日志的级别
          traceId: '',
          content: line,
          rawContent: line
        });
        continue;
      }

      // 尝试匹配标准格式
      const standardMatch = line.match(this.standardLogPattern);
      if (standardMatch) {
        const [, timestamp, level, message] = standardMatch;
        currentLevel = level.toLowerCase();
        entries.push({
          timestamp,
          level: currentLevel,
          traceId: '',
          content: message,
          rawContent: line
        });
        continue;
      }

      // 如果都不匹配，作为普通文本处理
      entries.push({
        timestamp: '',
        level: currentLevel || 'info',
        traceId: '',
        content: line,
        rawContent: line
      });
    }

    return entries;
  }
} 