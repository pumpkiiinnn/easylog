import { Group, Text, Box } from '@mantine/core';

interface BottomMenuProps {
  fileFormat?: string;
  fileSize?: string;
  lineCount?: number;
  encoding?: string;
}

export default function BottomMenu({ 
  fileFormat = '-',
  fileSize = '-',
  lineCount = 0,
  encoding = 'UTF-8'
}: BottomMenuProps) {
  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '22px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        fontSize: '12px',
        zIndex: 1000, // 添加 z-index
      }}
    >
      <Group 
        h="100%" 
        px="xs" 
        gap="lg"
        justify="flex-start"
      >
        <Text size="xs" c="dimmed">格式: {fileFormat}</Text>
        <Text size="xs" c="dimmed">大小: {fileSize}</Text>
        <Text size="xs" c="dimmed">行数: {lineCount}</Text>
        <Text size="xs" c="dimmed">编码: {encoding}</Text>
      </Group>
    </Box>
  );
}