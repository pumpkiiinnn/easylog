import { Group, Text, Box, ActionIcon } from '@mantine/core';
import { IconBell, IconUser, IconSettings } from '@tabler/icons-react';
import { useThemeStore } from '../stores/themeStore';
import { useSidebarStore } from '../stores/sidebarStore';

interface BottomMenuProps {
  fileFormat?: string;
  fileSize?: string;
  lineCount?: number;
  encoding?: string;
  style?: React.CSSProperties;
}

export default function BottomMenu({ 
  fileFormat = '-',
  fileSize = '-',
  lineCount = 0,
  encoding = 'UTF-8',
  style
}: BottomMenuProps) {
  const { isDark } = useThemeStore();
  const { activeSidebar, setActiveSidebar } = useSidebarStore();

  const colors = {
    text: isDark ? '#909296' : '#868e96',
    border: isDark ? '#2C2E33' : '#e9ecef',
    divider: isDark ? '#2C2E33' : '#e9ecef',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '22px',
        backgroundColor: '#f8f9fa',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '12px',
        zIndex: 1000, // 添加 z-index
        ...style
      }}
    >
      <Group 
        h="100%" 
        px="xs" 
        gap="lg"
        justify="flex-start"
      >
        <Text size="xs" c={colors.text}>格式: {fileFormat}</Text>
        <Text size="xs" c={colors.text}>大小: {fileSize}</Text>
        <Text size="xs" c={colors.text}>行数: {lineCount} 行</Text>
        <Text size="xs" c={colors.text}>编码: {encoding}</Text>
      </Group>

      <Group gap="xs">
        <ActionIcon 
          variant={activeSidebar === 'notifications' ? 'filled' : 'subtle'}
          size="sm"
          color={isDark ? 'gray.4' : 'gray.7'}
          onClick={() => setActiveSidebar(
            activeSidebar === 'notifications' ? null : 'notifications'
          )}
          styles={{
            root: {
              backgroundColor: activeSidebar === 'notifications' 
                ? (isDark ? '#2C2E33' : '#e9ecef') 
                : undefined,
              '&:hover': {
                backgroundColor: colors.hover,
              }
            }
          }}
        >
          <IconBell size={16} />
        </ActionIcon>
        
        <ActionIcon 
          variant={activeSidebar === 'user' ? 'filled' : 'subtle'}
          size="sm"
          color={isDark ? 'gray.4' : 'gray.7'}
          onClick={() => setActiveSidebar(
            activeSidebar === 'user' ? null : 'user'
          )}
          styles={{
            root: {
              backgroundColor: activeSidebar === 'user' 
                ? (isDark ? '#2C2E33' : '#e9ecef') 
                : undefined,
              '&:hover': {
                backgroundColor: colors.hover,
              }
            }
          }}
        >
          <IconUser size={16} />
        </ActionIcon>
        
        <ActionIcon 
          variant={activeSidebar === 'settings' ? 'filled' : 'subtle'}
          size="sm"
          color={isDark ? 'gray.4' : 'gray.7'}
          onClick={() => setActiveSidebar(
            activeSidebar === 'settings' ? null : 'settings'
          )}
          styles={{
            root: {
              backgroundColor: activeSidebar === 'settings' 
                ? (isDark ? '#2C2E33' : '#e9ecef') 
                : undefined,
              '&:hover': {
                backgroundColor: colors.hover,
              }
            }
          }}
        >
          <IconSettings size={16} />
        </ActionIcon>
      </Group>
    </Box>
  );
}