import { Paper, Text, ScrollArea, Stack, Group, Button, Box, Center, Loader } from '@mantine/core';
import { IconRefresh, IconDownload, IconFileImport } from '@tabler/icons-react';
import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useFileHandler } from '../hooks/useFileHandler';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { isTauri } from '../utils/environment';

export default function LogContent() {
  const [isDragging, setIsDragging] = useState(false);
  const { isLoading, currentFile, content, readFile } = useFileHandler();

  // 处理文件的通用函数
  const handleFiles = async (files: File[] | string[]) => {
    console.log('Handling files:', files);
    let logFiles;
    
    if (typeof files[0] === 'string') {
      console.log('Tauri environment detected');
      logFiles = (files as string[]).filter(file => 
        file.toLowerCase().endsWith('.log') || 
        file.toLowerCase().endsWith('.txt')
      );
      console.log('Filtered log files:', logFiles);
      if (logFiles.length > 0) {
        await readFile({ path: logFiles[0] });
      }
    } else {
      // 网页环境
      logFiles = (files as File[]).filter(file => 
        file.name.toLowerCase().endsWith('.log') || 
        file.name.toLowerCase().endsWith('.txt')
      );
      if (logFiles.length > 0) {
        await readFile({ path: URL.createObjectURL(logFiles[0]) });
      }
    }

    if (logFiles.length === 0) {
      console.log('No valid files found');
      notifications.show({
        title: '无效的文件类型',
        message: '请拖入 .log 或 .txt 文件',
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
        // 使用 onDragDropEvent 监听拖放事件
        const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
          console.log('Drag event:', event.payload.type);
          
          switch(event.payload.type) {
            case 'drop':
              // 文件被拖放时
              console.log('Dropped files:', event.payload.paths);
              handleFiles(event.payload.paths);
              break;
            case 'over':
              // 文件悬停时
              console.log('File hovering at:', event.payload.position);
              break;
            case 'leave':
              // 文件拖离时
              console.log('File drag cancelled');
              break;
          }
        });

        // 清理函数
        return () => {
          unlisten();
        };
      } catch (err) {
        console.error('Error setting up Tauri events:', err);
      }
    };

    setupTauriEvents();
  }, []);

  if (!currentFile) {
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
        <Group justify="space-between">
          <Text size="sm" weight={500}>{currentFile}</Text>
          <Group spacing="xs">
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
      </Box>

      <Box style={{ flex: 1, backgroundColor: '#1e1e1e', padding: '12px' }}>
        {isLoading ? (
          <Center h="100%">
            <Loader color="blue" />
          </Center>
        ) : (
          <ScrollArea h="100%" type="auto">
            <Text 
              style={{ 
                fontFamily: 'Menlo, Monaco, Consolas, monospace',
                fontSize: '13px',
                lineHeight: 1.6,
              }} 
              color="gray.3"
            >
              {content}
            </Text>
          </ScrollArea>
        )}
      </Box>
    </Stack>
  );
} 