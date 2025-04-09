import { Text, ScrollArea, Stack, Group, Button, Box, Center, Loader, TextInput } from '@mantine/core';
import { IconRefresh, IconDownload, IconFileImport, IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useFileHandler } from '../hooks/useFileHandler';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { isTauri } from '../utils/environment';
import { useLogContentStore } from '../stores/logContentStore';
import { LogParser } from '../utils/logParser';
import { useLogSettingsStore } from '../stores/logSettingsStore';
import { useLogFormatStore } from '../stores/logFormatStore';
import { LogEntry } from '../types/log';
import { highlightText } from '../utils/textHighlight';
import SearchNavigation from './SearchNavigation';
import { useViewportSize } from '@mantine/hooks';
import TextSelectionPopover from './TextSelectionPopover';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from 'react-i18next';

export default function LogContent() {
  const [isDragging, setIsDragging] = useState(false);
  const { isLoading, currentFile, readFile } = useFileHandler();
  const { currentFileName, content: storeContent, setLogContent, setCurrentFileName } = useLogContentStore();
  const { styles, fontSize, searchText, setSearchText, autoScroll } = useLogSettingsStore();
  const { formats, activeFormatId } = useLogFormatStore();
  const [parsedLogs, setParsedLogs] = useState<LogEntry[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousContentLength = useRef<number>(0);
  const isScrolledToBottom = useRef<boolean>(true);
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

  // 监听滚动事件，检测是否滚动到底部
  useEffect(() => {
    if (!viewportRef.current) return;
    
    const handleScroll = () => {
      if (!viewportRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      // 如果滚动位置距离底部小于 20px，认为已滚动到底部
      const isBottom = scrollHeight - scrollTop - clientHeight < 20;
      isScrolledToBottom.current = isBottom;
      
    };
    
    const viewport = viewportRef.current;
    viewport.addEventListener('scroll', handleScroll);
    
    // 初始化时检查一次滚动状态
    handleScroll();
    
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 监听 storeContent 和 activeFormatId 变化，解析日志
  useEffect(() => {
    if (storeContent) {
      // 将格式信息传递给解析器
      const logs = LogParser.parseLogContent(storeContent, formats, activeFormatId);
      setParsedLogs(logs);
      console.log('解析日志:', {
        totalLogs: logs.length,
        formatId: activeFormatId,
        formatCount: formats.length
      });
      
      // 记录当前内容长度，用于后续判断内容是否有更新
      const currentLength = storeContent.length;
      
      // 如果内容有更新（长度增加），并且启用了自动滚动或者用户已经滚动到底部，则滚动到底部
      if (currentLength > previousContentLength.current && (autoScroll || isScrolledToBottom.current)) {
        scrollToBottom();
      }
      
      previousContentLength.current = currentLength;
    }
  }, [storeContent, autoScroll, activeFormatId, formats]);

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (!viewportRef.current) return;
    
    // 使用 requestAnimationFrame 确保在 DOM 更新后执行滚动
    requestAnimationFrame(() => {
      if (viewportRef.current) {
        console.log('执行滚动到底部', {
          scrollHeight: viewportRef.current.scrollHeight
        });
        
        viewportRef.current.scrollTo({
          top: viewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  };

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
  const handleFiles = async (files: string[] | File[]) => {
    try {
      if (files.length === 0) return;
      
      if (typeof files[0] === 'string') {
        // Tauri 环境，文件路径是字符串
        await readFile({ path: files[0] });
      } else {
        // Web 环境，文件是 File 对象
        const file = files[0] as File;
        // 读取文件内容并更新到 store
        const content = await file.text();
        console.log('Web environment file read:', {
          name: file.name,
          contentLength: content.length,
          preview: content.substring(0, 100)
        });
        // 更新到全局状态
        setLogContent(content);
        setCurrentFileName(file.name);
        // 显示单个成功通知
        notifications.show({
          message: file.name,
          color: 'green',
        });
      }
    } catch (error: any) {
      console.error('处理文件失败:', error);
      notifications.show({
        title: t('logContent.errors.fileLoadFailed'),
        message: error.message || String(error),
        color: 'red',
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
    const styles = useLogSettingsStore.getState().styles;
    const fontSize = useLogSettingsStore.getState().fontSize;
    const searchText = useLogSettingsStore.getState().searchText;
    const getStyleForLevel = useLogSettingsStore.getState().getStyleForLevel;
    
    // 使用 getStyleForLevel 函数获取样式，确保处理 JSON 日志中的各种日志等级
    const style = getStyleForLevel(entry.level);
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
            viewportRef={viewportRef}
            h={`calc(${height}px - 190px)`}
            type="hover"
            data-log-content="true"
            onScrollPositionChange={({ y }) => {
              if (!viewportRef.current) return;
              const { scrollHeight, clientHeight } = viewportRef.current;
              // 如果滚动位置距离底部小于 20px，认为已滚动到底部
              isScrolledToBottom.current = scrollHeight - y - clientHeight < 20;
            }}
          >
            <Stack gap={0} p="md" pb="xl">
              {parsedLogs.map(renderLogEntry)}
            </Stack>
          </ScrollArea>
        )}
      </Box>

      <TextSelectionPopover onSubmit={handleAIInteraction} />
    </Stack>
  );
}