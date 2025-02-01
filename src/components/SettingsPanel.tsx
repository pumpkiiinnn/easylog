import { Stack, Text, Switch, ColorInput, NumberInput, Select, Box } from '@mantine/core';
import { useLogSettingsStore } from '../stores/logSettingsStore';
import { LogLevel } from '../types/log';

export default function SettingsPanel() {
  const {
    styles,
    autoRefresh,
    autoScroll,
    fontSize,
    setStyle,
    setAutoRefresh,
    setAutoScroll,
    setFontSize
  } = useLogSettingsStore();

  return (
    <Stack gap={0}>
      <Box p="xs" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Text size="sm" fw={500}>显示设置</Text>
      </Box>
      
      <Box p="xs">
        <Stack gap="md">
          <Switch 
            label="自动刷新" 
            description="每5秒自动刷新日志内容"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.currentTarget.checked)}
            styles={{
              label: { fontSize: '13px' },
              description: { fontSize: '12px' }
            }}
          />
          
          <Switch 
            label="自动滚动" 
            description="自动滚动到最新日志"
            checked={autoScroll}
            onChange={(event) => setAutoScroll(event.currentTarget.checked)}
            styles={{
              label: { fontSize: '13px' },
              description: { fontSize: '12px' }
            }}
          />
          
          <NumberInput
            label="字体大小"
            value={fontSize}
            onChange={(value) => setFontSize(Number(value))}
            min={8}
            max={24}
            styles={{
              label: { fontSize: '13px' }
            }}
          />
          
          {(Object.keys(styles) as LogLevel[]).map((level) => (
            <ColorInput
              key={level}
              label={`${level} 颜色`}
              value={styles[level].color}
              onChange={(color) => setStyle(level, { ...styles[level], color })}
              styles={{
                label: { fontSize: '13px' }
              }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
} 