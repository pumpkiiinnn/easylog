import { LogEntry, CustomLogFormat } from '../types/log';

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

  // 检查字符串是否为 JSON 格式
  private static isJsonString(str: string): boolean {
    try {
      const json = JSON.parse(str);
      return typeof json === 'object' && json !== null;
    } catch (e) {
      return false;
    }
  }

  // 从 JSON 对象中提取日志等级
  private static extractLevelFromJson(json: any): string {
    // 常见的日志等级字段名称
    const levelFieldNames = ['level', 'severity', 'loglevel', 'log_level', 'logLevel'];
    
    for (const field of levelFieldNames) {
      if (json[field] !== undefined) {
        return json[field].toLowerCase();
      }
    }

    return 'info'; // 默认返回 info 级别
  }

  // 从 JSON 对象中提取时间戳
  private static extractTimestampFromJson(json: any): string {
    // 常见的时间戳字段名称
    const timestampFieldNames = ['timestamp', '@timestamp', 'time', 'date', 'datetime', 'ts'];
    
    for (const field of timestampFieldNames) {
      if (json[field] !== undefined) {
        return json[field];
      }
    }

    return '';
  }

  // 从 JSON 对象中提取日志消息内容
  private static extractContentFromJson(json: any): string {
    // 常见的消息内容字段名称
    const contentFieldNames = ['message', 'msg', 'content', 'text', 'log', 'rest'];
    
    for (const field of contentFieldNames) {
      if (json[field] !== undefined) {
        return typeof json[field] === 'string' ? 
          json[field] : 
          JSON.stringify(json[field]);
      }
    }

    // 如果找不到明确的消息字段，返回整个 JSON 字符串（排除已知的元数据字段）
    const knownMetaFields = [
      'timestamp', '@timestamp', 'time', 'date', 'datetime', 'ts',
      'level', 'severity', 'loglevel', 'log_level', 'logLevel',
      'logger', 'class', 'service'
    ];
    
    const contentObj = Object.fromEntries(
      Object.entries(json).filter(([key]) => !knownMetaFields.includes(key))
    );
    
    return Object.keys(contentObj).length > 0 ? 
      JSON.stringify(contentObj) : 
      JSON.stringify(json);
  }

  // 尝试使用自定义格式解析日志行
  private static parseWithCustomFormat(line: string, format: CustomLogFormat): LogEntry | null {
    try {
      const regex = new RegExp(format.pattern);
      const match = line.match(regex);
      
      if (!match) return null;
      
      const { groups } = format;
      const level = match[groups.level] || 'info';
      const content = match[groups.message] || '';
      const timestamp = groups.timestamp !== undefined ? match[groups.timestamp] || '' : '';
      const traceId = groups.traceId !== undefined ? match[groups.traceId] || '' : '';
      const logger = groups.logger !== undefined ? match[groups.logger] || '' : '';
      
      return {
        timestamp,
        level: level.toLowerCase(),
        traceId,
        content,
        rawContent: line,
        logger
      };
    } catch (e) {
      console.error('Error parsing with custom format:', e);
      return null;
    }
  }

  static parseLogContent(content: string, customFormats: CustomLogFormat[] = [], activeFormatId: string | null = null): LogEntry[] {
    if (!content) return [];

    const lines = content.split('\n');
    const entries: LogEntry[] = [];
    let currentLevel: string | null = null;
    
    // 如果有激活的格式，优先使用该格式
    const activeFormat = activeFormatId 
      ? customFormats.find(f => f.id === activeFormatId) 
      : undefined;

    for (const line of lines) {
      if (!line.trim()) continue;

      // 检查是否为 JSON 格式的日志
      if (line.trim().startsWith('{') && line.trim().endsWith('}') && this.isJsonString(line)) {
        try {
          const jsonData = JSON.parse(line);
          const level = this.extractLevelFromJson(jsonData);
          const timestamp = this.extractTimestampFromJson(jsonData);
          const content = this.extractContentFromJson(jsonData);
          const logger = jsonData.logger || jsonData.class || jsonData.service || '';
          
          currentLevel = level;
          entries.push({
            timestamp,
            level,
            traceId: jsonData.trace || jsonData.traceId || jsonData.span || '',
            content,
            rawContent: line,
            logger
          });
          continue;
        } catch (e) {
          // JSON 解析失败，按照普通文本处理
        }
      }

      // 如果有激活的自定义格式，优先尝试使用该格式解析
      if (activeFormat) {
        const entry = this.parseWithCustomFormat(line, activeFormat);
        if (entry) {
          currentLevel = entry.level;
          entries.push(entry);
          continue;
        }
      }

      // 如果没有激活的格式或激活的格式解析失败，尝试所有其他自定义格式
      let parsedWithCustomFormat = false;
      for (const format of customFormats) {
        // 跳过已尝试的激活格式
        if (format.id === activeFormatId) continue;
        
        const entry = this.parseWithCustomFormat(line, format);
        if (entry) {
          currentLevel = entry.level;
          entries.push(entry);
          parsedWithCustomFormat = true;
          break;
        }
      }
      
      if (parsedWithCustomFormat) continue;

      // 尝试匹配 Spring Boot 格式
      const springBootMatch = line.match(this.springBootLogPattern);
      if (springBootMatch) {
        //@ts-ignore
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
  
  // 测试自定义格式是否能正确解析示例日志
  static testCustomFormat(format: CustomLogFormat): { success: boolean; result?: LogEntry; error?: string } {
    try {
      if (!format.sample) {
        return { success: false, error: '未提供示例日志' };
      }
      
      const entry = this.parseWithCustomFormat(format.sample, format);
      
      if (!entry) {
        return { success: false, error: '正则表达式无法匹配示例日志' };
      }
      
      return { success: true, result: entry };
    } catch (e: any) {
      return { success: false, error: e.message || '解析失败' };
    }
  }
}