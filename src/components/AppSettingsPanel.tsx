import { Stack, Text, Box, Avatar, Button, TextInput, Select, Paper, Group } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { IconUser, IconCreditCard, IconRobot, IconKey } from '@tabler/icons-react';

interface User {
  name: string;
  avatar: string;
  isLoggedIn: boolean;
}

// 模拟用户数据，实际应用中应该从状态管理或API获取
const user: User = {
  name: "未登录",
  avatar: "",
  isLoggedIn: false
};

export default function AppSettingsPanel() {
  const { isDark } = useThemeStore();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    inputBg: isDark ? '#1A1B1E' : '#f8f9fa',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
  };

  return (
    <Stack gap="md">
      {/* 账号设置 */}
      <Paper 
        p="md" 
        radius="sm"
        style={{
          backgroundColor: colors.inputBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Group position="apart" mb="xs">
          <Text size="sm" fw={500} c={colors.text}>
            <IconUser size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            账号设置
          </Text>
        </Group>
        
        <Group>
          <Avatar 
            size="lg" 
            src={user.avatar}
            color="blue"
          >
            {!user.avatar && <IconUser size={24} />}
          </Avatar>
          <div>
            <Text size="sm" c={colors.text}>{user.name}</Text>
            {!user.isLoggedIn && (
              <Button 
                variant="light" 
                size="xs" 
                mt="xs"
                onClick={() => {/* 处理登录 */}}
              >
                登录
              </Button>
            )}
          </div>
        </Group>
      </Paper>

      {/* AI 设置 */}
      <Paper 
        p="md" 
        radius="sm"
        style={{
          backgroundColor: colors.inputBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Text size="sm" fw={500} c={colors.text} mb="md">
          <IconRobot size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          AI 设置
        </Text>
        
        <Stack gap="sm">
          <Select
            label="AI 模型"
            placeholder="选择 AI 模型"
            data={[
              { value: 'openai', label: 'OpenAI GPT' },
              { value: 'anthropic', label: 'Anthropic Claude' },
              { value: 'gemini', label: 'Google Gemini' },
            ]}
            styles={{
              label: { color: colors.text },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            }}
          />
          
          <TextInput
            label="API Token"
            placeholder="输入 API Token"
            styles={{
              label: { color: colors.text },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            }}
          />
        </Stack>
      </Paper>

      {/* AI 余额 */}
      <Paper 
        p="md" 
        radius="sm"
        style={{
          backgroundColor: colors.inputBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Text size="sm" fw={500} c={colors.text} mb="md">
          <IconCreditCard size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          AI 余额
        </Text>
        
        <Stack gap="xs">
          <Group position="apart">
            <Text size="sm" c={colors.text}>已使用</Text>
            <Text size="sm" c={colors.text}>$0.00</Text>
          </Group>
          <Group position="apart">
            <Text size="sm" c={colors.text}>剩余额度</Text>
            <Text size="sm" c={colors.text}>$5.00</Text>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
} 