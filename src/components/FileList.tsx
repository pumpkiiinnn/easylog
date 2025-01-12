import { Stack, Text, Button, TextInput, ScrollArea, Box } from '@mantine/core';
import { IconFile, IconFolderOpen, IconSearch, IconFileImport } from '@tabler/icons-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useFileHandler } from '../hooks/useFileHandler';
import { isTauri } from '../utils/environment';

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
    <Stack h="100%" spacing={0}>
      <Box>
        <TextInput
          placeholder="搜索文件..."
          leftSection={<IconSearch size={16} />}
          mb="sm"
          styles={{
            input: {
              backgroundColor: '#f1f3f5',
              border: 'none',
              '&:focus': {
                border: '1px solid #228be6',
              }
            }
          }}
        />
        
        <Stack>
          <Button 
            variant="light" 
            leftSection={<IconFileImport size={16} />}
            fullWidth
            onClick={handleOpenFile}
            styles={{
              root: {
                border: '1px solid #e9ecef',
              }
            }}
          >
            打开文件
          </Button>
          
          <Button 
            variant="light" 
            leftSection={<IconFolderOpen size={16} />}
            fullWidth
            styles={{
              root: {
                border: '1px solid #e9ecef',
              }
            }}
          >
            打开文件夹
          </Button>
        </Stack>
      </Box>
      
      <ScrollArea.Autosize mah={600} type="hover">
        <Stack>
          {['app.log', 'error.log', 'access.log', 'debug.log'].map((file) => (
            <Button
              key={file}
              variant="subtle"
              leftSection={<IconFile size={16} />}
              styles={{
                root: {
                  borderRadius: 0,
                  justifyContent: 'flex-start',
                  height: 36,
                  padding: '0 12px',
                  '&:hover': {
                    backgroundColor: '#f1f3f5',
                  }
                },
                label: {
                  fontSize: '13px',
                }
              }}
            >
              {file}
            </Button>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
} 