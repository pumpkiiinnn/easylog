import { Stack, Text, Switch, ColorInput, NumberInput, Select, Box } from '@mantine/core';

export default function SettingsPanel() {
  return (
    <Stack spacing={0}>
      <Box p="xs" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Text size="sm" weight={500}>显示设置</Text>
      </Box>
      
      <Box p="xs">
        <Stack spacing="md">
          <Switch 
            label="自动刷新" 
            description="每5秒自动刷新日志内容"
            styles={{
              label: { fontSize: '13px' },
              description: { fontSize: '12px' }
            }}
          />
          
          <Switch 
            label="自动滚动" 
            description="自动滚动到最新日志"
            styles={{
              label: { fontSize: '13px' },
              description: { fontSize: '12px' }
            }}
          />
          
          <NumberInput
            label="字体大小"
            defaultValue={12}
            min={8}
            max={24}
            styles={{
              label: { fontSize: '13px' }
            }}
          />
          
          <Select
            label="日志级别"
            placeholder="选择显示的日志级别"
            data={[
              { value: 'all', label: '全部' },
              { value: 'error', label: '错误' },
              { value: 'warn', label: '警告' },
              { value: 'info', label: '信息' },
              { value: 'debug', label: '调试' },
            ]}
            styles={{
              label: { fontSize: '13px' }
            }}
          />
          
          <ColorInput
            label="ERROR 颜色"
            defaultValue="#ff0000"
            styles={{
              label: { fontSize: '13px' }
            }}
          />
          
          <ColorInput
            label="WARN 颜色"
            defaultValue="#ffa500"
            styles={{
              label: { fontSize: '13px' }
            }}
          />
          
          <ColorInput
            label="INFO 颜色"
            defaultValue="#0000ff"
            styles={{
              label: { fontSize: '13px' }
            }}
          />
        </Stack>
      </Box>
    </Stack>
  );
} 