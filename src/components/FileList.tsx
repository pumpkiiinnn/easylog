import { Stack, Text, Button, TextInput, ScrollArea, Box, Divider } from '@mantine/core';
import { 
  IconFile, 
  IconFolderOpen, 
  IconSearch, 
  IconFileImport,
  IconClock,
  IconFileText,
  IconFileSpreadsheet,
  IconFileZip 
} from '@tabler/icons-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useFileHandler } from '../hooks/useFileHandler';
import { isTauri } from '../utils/environment';

// 文件类型图标映射
const fileTypeIcons: { [key: string]: any } = {
  log: { icon: IconFileText, color: '#40C057' },
  txt: { icon: IconFile, color: '#228BE6' },
  json: { icon: IconFileSpreadsheet, color: '#F59F00' },
  zip: { icon: IconFileZip, color: '#BE4BDB' }
};

// 获取文件图标
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop() || '';
  return fileTypeIcons[ext] || { icon: IconFile, color: '#868E96' };
};

// 添加一个格式化文件大小的工具函数
const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default function FileList() {
  const { readFile } = useFileHandler();

  const handleOpenFile = async () => {
    try {
      console.log('Opening file dialog');
      const selected = await openDialog({
        multiple: false,
        filters: [{
          name: 'Log Files',
          extensions: ['log', 'txt', 'json']
        }]
      });

      console.log('Selected file:', selected);

      if (selected === null) {
        console.log('No file selected');
        return;
      }

      if (typeof selected === 'string') {
        console.log('Reading file:', selected);
        const content = await readTextFile(selected);
        console.log('File content:', content);
      } else {
        console.warn('Unexpected selected file format:', selected);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  };

  return (
    <Stack h="100%" spacing="xs">
      <Box p="xs">
        <TextInput
          placeholder="搜索文件..."
          leftSection={<IconSearch size={16} color="#868E96" />}
          mb="md"
          styles={{
            input: {
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '14px',
              '&:focus': {
                borderColor: '#228be6',
                boxShadow: '0 0 0 2px rgba(34,139,230,0.1)'
              }
            }
          }}
        />
        
        <Stack spacing="xs">
          <Button 
            variant="light" 
            leftSection={<IconFileImport size={18} />}
            fullWidth
            onClick={handleOpenFile}
            styles={{
              root: {
                border: '1px solid #e9ecef',
                backgroundColor: '#fff',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                }
              }
            }}
          >
            打开文件
          </Button>
          
          <Button 
            variant="light" 
            leftSection={<IconFolderOpen size={18} />}
            fullWidth
            styles={{
              root: {
                border: '1px solid #e9ecef',
                backgroundColor: '#fff',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                }
              }
            }}
          >
            打开文件夹
          </Button>
        </Stack>
      </Box>

      <Divider />
      
      <Box px="xs">
        <Text size="sm" fw={500} color="dimmed" mb="xs" style={{ display: 'flex', alignItems: 'center' }}>
          <IconClock size={16} style={{ marginRight: 6 }} />
          最近打开
        </Text>
      </Box>
      
      <ScrollArea.Autosize mah={600} type="hover" offsetScrollbars>
        <Stack spacing={0}>
          {[
            { name: 'app.log', size: 2.5 * 1024 * 1024 },
            { name: 'error-log.log', size: 1.8 * 1024 * 1024 },
            { name: 'data.json', size: 856 * 1024 },
            { name: 'debug.log', size: 3.2 * 1024 * 1024 },
            { name: 'archive.zip', size: 15.7 * 1024 * 1024 }
          ].map((file) => {
            const { icon: FileIcon, color } = getFileIcon(file.name);
            return (
              <Button
                key={file.name}
                variant="subtle"
                leftSection={<FileIcon size={18} color={color} />}
                styles={{
                  root: {
                    borderRadius: 0,
                    justifyContent: 'flex-start',
                    height: 36,
                    padding: '0 12px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#f1f3f5',
                      transform: 'translateX(4px)'
                    }
                  },
                  label: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0 4px'
                  },
                  inner: {
                    justifyContent: 'flex-start'
                  }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  width: '100%',
                  alignItems: 'center'
                }}>
                  <Text 
                    size="sm" 
                    style={{
                      maxWidth: 'calc(100% - 70px)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {file.name}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ 
                    flexShrink: 0, 
                    marginLeft: 8,
                    minWidth: '60px',
                    textAlign: 'right'
                  }}>
                    {formatFileSize(file.size)}
                  </Text>
                </div>
              </Button>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
} 