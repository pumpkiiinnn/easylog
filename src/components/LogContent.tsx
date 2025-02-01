import { Paper, Text, ScrollArea, Stack, Group, Button, Box, Center, Loader, TextInput } from '@mantine/core';
import { IconRefresh, IconDownload, IconFileImport, IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useFileHandler } from '../hooks/useFileHandler';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { isTauri } from '../utils/environment';
import { useLogContentStore } from '../stores/logContentStore';
import { LogParser } from '../utils/logParser';
import { useLogSettingsStore } from '../stores/logSettingsStore';
import { LogEntry } from '../types/log';
import { highlightText } from '../utils/textHighlight';

export default function LogContent() {
  const [isDragging, setIsDragging] = useState(false);
  const { isLoading, currentFile, content: hookContent } = useFileHandler();
  const { currentFileName, content: storeContent } = useLogContentStore();
  const { styles, fontSize, searchText, setSearchText } = useLogSettingsStore();
  const [parsedLogs, setParsedLogs] = useState<LogEntry[]>([]);

  // 添加 useEffect 来监控 store 内容变化
  useEffect(() => {
    console.log('Store content updated:', {
      contentLength: storeContent?.length || 0,
      preview: storeContent?.substring(0, 100) || '',
      currentFileName
    });
  }, [storeContent, currentFileName]);

  // 检查 currentFile 是否存在
  console.log('Current file state:', {
    currentFile,
    hasStoreContent: Boolean(storeContent),
    isLoading
  });

  // 监听 storeContent 变化，解析日志
  useEffect(() => {
    if (storeContent) {
      const logs = LogParser.parseLogContent(storeContent);
      setParsedLogs(logs);
    }
  }, [storeContent]);

  // 处理文件的通用函数
  const handleFiles = async (files: File[] | string[]) => {
    console.log('Handling files:', files);
    let logFiles;
    
    if (typeof files[0] === 'string') {
      console.log('Tauri environment detected');
      logFiles = (files as string[]).filter(file => 
        file.toLowerCase().endsWith('.log') || 
        file.toLowerCase().endsWith('.txt') ||
        file.toLowerCase().endsWith('.json')
      );
      console.log('Filtered log files:', logFiles);
      if (logFiles.length > 0) {
        await readFile({ path: logFiles[0] });
      }
    } else {
      // 网页环境
      logFiles = (files as File[]).filter(file => 
        file.name.toLowerCase().endsWith('.log') || 
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.json')
      );
      if (logFiles.length > 0) {
        await readFile({ path: URL.createObjectURL(logFiles[0]) });
      }
    }

    if (logFiles.length === 0) {
      console.log('No valid files found');
      notifications.show({
        title: '无效的文件类型',
        message: '请拖入 .log、.txt 或 .json 文件',
        color: 'red'
      });
    }
  };

  // 统一的拖拽状态处理
  const updateDragState = (isDragging: boolean) => {
    setIsDragging(isDragging);
  };

  useEffect(() => {
    if (!isTauri()) return;

    const setupTauriEvents = async () => {
      try {
        const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
          console.log('Drag event:', event.payload.type);
          
          switch(event.payload.type) {
            case 'drop':
              console.log('Dropped files:', event.payload.paths);
              updateDragState(false);
              handleFiles(event.payload.paths);
              break;
            case 'over':
              console.log('File hovering at:', event.payload.position);
              updateDragState(true);
              break;
            case 'leave':
              console.log('File drag cancelled');
              updateDragState(false);
              break;
          }
        });

        return () => {
          unlisten();
        };
      } catch (err) {
        console.error('Error setting up Tauri events:', err);
      }
    };

    setupTauriEvents();
  }, []);

  // 渲染单条日志
  const renderLogEntry = (entry: LogEntry) => {
    const style = styles[entry.level];
    const segments = highlightText(entry.rawContent, searchText);
    
    return (
      <Text
        key={`${entry.timestamp}-${entry.traceId}`}
        style={{
          color: style.color,
          fontWeight: style.fontWeight,
          fontSize: `${fontSize}px`,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {segments.map((segment, index) => (
          <span
            key={index}
            style={{
              backgroundColor: segment.isHighlight ? '#fff3bf' : 'transparent',
              color: segment.isHighlight ? '#1a1b1e' : undefined,
            }}
          >
            {segment.text}
          </span>
        ))}
      </Text>
    );
  };

  if (!currentFile && !storeContent) {
    return (
      <Stack h="100%" gap={0}>
        <Center 
          h="100%"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTauri()) {
              updateDragState(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTauri()) {
              updateDragState(false);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTauri()) {
              updateDragState(false);
              const files = Array.from(e.dataTransfer.files);
              await handleFiles(files);
            }
          }}
          style={{
            border: `2px dashed ${isDragging ? '#228be6' : '#e9ecef'}`,
            borderRadius: 8,
            backgroundColor: isDragging ? '#e7f5ff' : 'transparent',
            transition: 'all 0.2s ease',
            margin: 12,
            position: 'relative',
            zIndex: 1000
          }}
        >
          <Stack align="center" gap="xs">
            <IconFileImport 
              size={48} 
              color={isDragging ? '#228be6' : '#adb5bd'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <Text size="lg" fw={500} color={isDragging ? '#228be6' : '#495057'}>
              {isDragging ? '释放以打开文件' : '拖入日志文件以开始'}
            </Text>
            <Text size="sm" color="dimmed">
              支持 .log 和 .txt 文件
            </Text>
          </Stack>
        </Center>
      </Stack>
    );
  }

  return (
    <Stack h="100%" gap={0}>
      <Box p="xs" style={{ 
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#fff'
      }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>{currentFileName}</Text>
          <Group gap="xs">
            <Button 
              variant="subtle" 
              size="sm"
              leftSection={<IconRefresh size={16} />}
              loading={isLoading}
              onClick={() => currentFile && readFile({ path: currentFile })}
              styles={{
                root: {
                  color: '#228be6',
                  '&:hover': {
                    backgroundColor: '#e7f5ff',
                  }
                }
              }}
            >
              刷新
            </Button>
            <Button 
              variant="subtle" 
              size="sm"
              leftSection={<IconDownload size={16} />}
              styles={{
                root: {
                  color: '#228be6',
                  '&:hover': {
                    backgroundColor: '#e7f5ff',
                  }
                }
              }}
            >
              导出
            </Button>
          </Group>
        </Group>
        
        <TextInput
          placeholder="搜索日志内容..."
          value={searchText}
          onChange={(event) => setSearchText(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          styles={{
            input: {
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              '&:focus': {
                borderColor: '#228be6',
                boxShadow: '0 0 0 2px rgba(34,139,230,0.1)'
              }
            }
          }}
        />
      </Box>

      <Box style={{ flex: 1, backgroundColor: '#1e1e1e', padding: '12px' }}>
        {isLoading ? (
          <Center h="100%">
            <Loader color="blue" />
          </Center>
        ) : (
          <ScrollArea h="100%" type="auto">
            <Stack gap="xs">
              {parsedLogs.map(renderLogEntry)}
            </Stack>
          </ScrollArea>
        )}
      </Box>
    </Stack>
  );
} 