import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { isTauri } from '../utils/environment';

interface FileContent {
  content: string;
  file_name: string;
}

interface FileReadOptions {
  path: string;
  max_lines?: number;
}

export function useFileHandler() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | undefined>();
  const [content, setContent] = useState<string | undefined>();

  const readFile = async (options: FileReadOptions) => {
    try {
      setIsLoading(true);
      console.log('Reading file with options:', options);

      if (isTauri()) {
        const path = options.path.replace(/\\/g, '/');
        console.log('Reading file in Tauri:', path);
        
        const result = await invoke<FileContent>('read_file', { 
          options: { ...options, path } 
        });
        console.log('File read result:', result);
        setCurrentFile(result.file_name);
        setContent(result.content);
      } else {
        console.log('Reading file in web:', options.path);
        // 网页环境下使用 fetch 读取文件
        const response = await fetch(options.path);
        const text = await response.text();
        setCurrentFile(options.path.split('/').pop() || 'unknown');
        setContent(text);
      }
    } catch (error) {
      console.error('Detailed file read error:', error);
      notifications.show({
        title: '读取文件失败',
        message: error instanceof Error ? error.message : '未知错误',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    currentFile,
    content,
    readFile,
  };
} 