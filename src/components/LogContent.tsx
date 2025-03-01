import { Paper, Text, ScrollArea, Stack, Group, Button, Box, Center, Loader, TextInput, ActionIcon } from '@mantine/core';
import { IconRefresh, IconDownload, IconFileImport, IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useFileHandler } from '../hooks/useFileHandler';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { isTauri } from '../utils/environment';
import { useLogContentStore } from '../stores/logContentStore';
import { LogParser } from '../utils/logParser';
import { useLogSettingsStore } from '../stores/logSettingsStore';
import { LogEntry } from '../types/log';
import { highlightText } from '../utils/textHighlight';
import SearchNavigation from './SearchNavigation';
import { useViewportSize } from '@mantine/hooks';
import TextSelectionPopover from './TextSelectionPopover';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from 'react-i18next';

export default function LogContent() {
  const [isDragging, setIsDragging] = useState(false);
  const { isLoading, currentFile, content: hookContent } = useFileHandler();
  const { currentFileName, content: storeContent } = useLogContentStore();
  const { styles, fontSize, searchText, setSearchText } = useLogSettingsStore();
  const [parsedLogs, setParsedLogs] = useState<LogEntry[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { height } = useViewportSize();
  const { isDark } = useThemeStore();
  const { t } = useTranslation();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    background: isDark ? '#1A1B1E' : '#f8f9fa',
    text: isDark ? '#C1C2C5' : '#495057',
    textDimmed: isDark ? '#909296' : '#868e96',
  };

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

  // 计算搜索匹配项
  useEffect(() => {
    if (!searchText || !parsedLogs.length) {
      setSearchMatches([]);
      setCurrentSearchIndex(0);
      return;
    }

    const matches: number[] = [];
    parsedLogs.forEach((log, index) => {
      if (log.rawContent.toLowerCase().includes(searchText.toLowerCase())) {
        matches.push(index);
      }
    });
    setSearchMatches(matches);
    setCurrentSearchIndex(matches.length > 0 ? 0 : -1);
  }, [searchText, parsedLogs]);

  // 滚动到当前匹配项
  const scrollToMatch = useCallback((index: number) => {
    if (!scrollAreaRef.current || searchMatches.length === 0) return;
    
    const matchElement = scrollAreaRef.current.querySelector(
      `[data-log-index="${searchMatches[index]}"]`
    );
    
    if (matchElement) {
      matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchMatches]);

  // 导航到下一个匹配项
  const navigateToNext = () => {
    const nextIndex = (currentSearchIndex + 1) % searchMatches.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMatch(nextIndex);
  };

  // 导航到上一个匹配项
  const navigateToPrevious = () => {
    const prevIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchMatches.length - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToMatch(prevIndex);
  };

  // 处理文件的通用函数
  const handleFiles = async (files: File[] | string[]) => {
    console.log('Handling files:', files);
    let logFiles;
    
    try {
      if (typeof files[0] === 'string') {
        console.log('Tauri environment detected');
        logFiles = (files as string[]).filter(file => 
          file.toLowerCase().endsWith('.log') || 
          file.toLowerCase().endsWith('.txt') ||
          file.toLowerCase().endsWith('.json')
        );
        console.log('Filtered log files:', logFiles);
        if (logFiles.length > 0) {
          await readFile({ path: logFiles[0] }).catch(error => {
            throw new Error(`${t('logContent.errors.readError')}: ${error.message}`);
          });
        }
      } else {
        // 网页环境
        logFiles = (files as File[]).filter(file => 
          file.name.toLowerCase().endsWith('.log') || 
          file.name.toLowerCase().endsWith('.txt') ||
          file.name.toLowerCase().endsWith('.json')
        );
        if (logFiles.length > 0) {
          await readFile({ path: URL.createObjectURL(logFiles[0]) }).catch(error => {
            throw new Error(`${t('logContent.errors.readError')}: ${error.message}`);
          });
        }
      }

      if (logFiles.length === 0) {
        console.log('No valid files found');
        notifications.show({
          title: t('logContent.errors.invalidType'),
          message: t('logContent.errors.validFileTypes'),
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error handling files:', error);
      notifications.show({
        title: t('logContent.errors.uploadError'),
        message: error instanceof Error ? error.message : t('logContent.errors.unknownError'),
        color: 'red',
        autoClose: 5000
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
  const renderLogEntry = (entry: LogEntry, index: number) => {
    const style = styles[entry.level.toLowerCase()] || styles.info;
    const segments = highlightText(entry.rawContent, searchText);
    const isCurrentMatch = searchMatches[currentSearchIndex] === index;
    
    // 检查是否为堆栈跟踪行
    const isStackTrace = !entry.timestamp && entry.content.startsWith('\t');
    
    return (
      <Text
        key={`${entry.timestamp}-${entry.traceId}-${index}`}
        data-log-index={index}
        style={{
          color: style.color,
          fontWeight: style.fontWeight,
          fontSize: `${fontSize}px`,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          padding: '4px 8px',
          paddingLeft: isStackTrace ? '24px' : '8px', // 为堆栈跟踪添加缩进
          borderRadius: 4,
          backgroundColor: isCurrentMatch ? '#1a1b1e15' : 'transparent',
          transition: 'background-color 0.2s ease',
          fontFamily: isStackTrace ? 'monospace' : undefined, // 堆栈跟踪使用等宽字体
        }}
      >
        {segments.map((segment, idx) => (
          <span
            key={idx}
            style={{
              backgroundColor: segment.isHighlight ? '#fff3bf' : 'transparent',
              color: segment.isHighlight ? '#1a1b1e' : undefined,
              padding: segment.isHighlight ? '0 2px' : undefined,
              borderRadius: segment.isHighlight ? 2 : undefined,
            }}
          >
            {segment.text}
          </span>
        ))}
      </Text>
    );
  };

  const handleAIInteraction = (text: string) => {
    // 这里处理与 AI 的交互
    console.log('AI交互:', {
      selectedText: text,
      // 后续可以添加更多上下文信息
    });
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
            border: `2px dashed ${isDragging ? '#228be6' : colors.border}`,
            borderRadius: 8,
            backgroundColor: isDragging ? '#e7f5ff' : 'transparent',
            transition: 'all 0.2s ease',
            margin: 12,
            position: 'relative',
            zIndex: 100
          }}
        >
          <Stack align="center" gap="xs">
            <IconFileImport 
              size={48} 
              color={isDragging ? '#228be6' : '#adb5bd'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <Text size="lg" fw={500} color={isDragging ? '#228be6' : colors.text}>
              {isDragging ? t('logContent.dropToOpen') : t('logContent.dragToStart')}
            </Text>
            <Text size="sm" c="dimmed">
              {t('logContent.supportedFiles')}
            </Text>
          </Stack>
        </Center>
      </Stack>
    );
  }

  return (
    <Stack h="100%" gap={0} style={{ 
      backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa' 
    }}>
      <Box p="md" style={{ 
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: isDark ? '#25262B' : '#fff',
        boxShadow: isDark 
          ? '0 1px 3px rgba(0,0,0,0.15)' 
          : '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={600} c={colors.textDimmed}>{currentFileName}</Text>
          <Group gap="xs">
            <Button 
              variant="light" 
              size="xs"
              leftSection={<IconRefresh size={14} />}
              loading={isLoading}
              onClick={() => currentFile && readFile({ path: currentFile })}
            >
              {t('logContent.refresh')}
            </Button>
            <Button 
              variant="light"
              size="xs"
              leftSection={<IconDownload size={14} />}
            >
              {t('logContent.export')}
            </Button>
          </Group>
        </Group>
        
        <Box style={{ position: 'relative' }}>
          <TextInput
            placeholder={t('logContent.searchPlaceholder')}
            value={searchText}
            onChange={(event) => setSearchText(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            styles={{
              input: {
                backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa',
                border: `1px solid ${colors.border}`,
                '&:focus': {
                  borderColor: '#228be6',
                  boxShadow: '0 0 0 2px rgba(34,139,230,0.1)'
                }
              }
            }}
          />
          <SearchNavigation
            totalMatches={searchMatches.length}
            currentMatch={currentSearchIndex + 1}
            onPrevious={navigateToPrevious}
            onNext={navigateToNext}
          />
        </Box>
      </Box>

      <Box style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#25262B' : '#fff',
        margin: '12px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <Center h="100%">
            <Loader color="blue" />
          </Center>
        ) : (
          <ScrollArea 
            ref={scrollAreaRef}
            h={`calc(${height}px - 180px)`}
            type="hover"
            data-log-content="true"
          >
            <Stack gap={0} p="md">
              {parsedLogs.map(renderLogEntry)}
            </Stack>
          </ScrollArea>
        )}
      </Box>

      <TextSelectionPopover onSubmit={handleAIInteraction} />
    </Stack>
  );
} 