import { Stack, Text, Button, TextInput, ScrollArea, Box } from '@mantine/core';
import { IconFile, IconFolderOpen, IconSearch } from '@tabler/icons-react';

export default function FileList() {
  return (
    <Stack h="100%" spacing={0}>
      <Box p="xs">
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
      </Box>
      
      <ScrollArea.Autosize mah={600} type="hover">
        <Stack spacing={0}>
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