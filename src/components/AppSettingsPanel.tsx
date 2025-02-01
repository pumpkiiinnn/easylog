import { Stack, Text, Box, Avatar, Button, TextInput, Select, Paper, Group, Progress, Menu, UnstyledButton } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { IconUser, IconCreditCard, IconRobot, IconLanguage, IconChevronDown } from '@tabler/icons-react';

interface User {
  name: string;
  avatar: string;
  isLoggedIn: boolean;
}

// 模拟用户数据
const user: User = {
  name: "未登录",
  avatar: "",
  isLoggedIn: false
};

// AI 使用数据
const aiUsage = {
  used: 2.5,
  total: 5.0,
  percentage: 50, // (2.5/5.0) * 100
};

export default function AppSettingsPanel() {
  const { isDark } = useThemeStore();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    inputBg: isDark ? '#1A1B1E' : '#f8f9fa',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
    progressTrack: isDark ? '#2C2E33' : '#f1f3f5',
    cardBg: isDark ? '#25262B' : '#fff',
  };

  return (
    <Stack gap="lg">
      {/* 账号设置 */}
      <Paper 
        p="xl" 
        radius="md"
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={500} c={colors.text}>
            <IconUser size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            账号设置
          </Text>
        </Group>
        
        <Group>
          <Avatar 
            size={64}
            src={user.avatar}
            color="blue"
            radius="xl"
          >
            {!user.avatar && <IconUser size={32} />}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text size="lg" fw={500} c={colors.text}>{user.name}</Text>
            {!user.isLoggedIn && (
              <Button 
                variant="light" 
                size="sm" 
                mt="xs"
                onClick={() => {/* 处理登录 */}}
              >
                登录
              </Button>
            )}
          </div>
        </Group>
      </Paper>

      {/* AI 设置与余额 */}
      <Paper 
        p="xl"
        radius="md"
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Group justify="space-between" mb="lg">
          <Text size="sm" fw={500} c={colors.text}>
            <IconRobot size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            AI 设置
          </Text>
          <Group gap="xs">
            <IconCreditCard size={16} color={colors.text} />
            <Text size="sm" c={colors.text}>余额: ${aiUsage.total - aiUsage.used}</Text>
          </Group>
        </Group>
        
        <Stack gap="md">
          <Box>
            <Text size="sm" c={colors.text} mb={4}>使用额度</Text>
            <Progress 
              value={aiUsage.percentage} 
              size="xl"
              radius="xl"
              styles={{
                root: { backgroundColor: colors.progressTrack },
              }}
            />
            <Group justify="space-between" mt={4}>
              <Text size="xs" c="dimmed">已使用: ${aiUsage.used}</Text>
              <Text size="xs" c="dimmed">总额度: ${aiUsage.total}</Text>
            </Group>
          </Box>

          <Select
            label="AI 模型"
            placeholder="选择 AI 模型"
            data={[
              { value: 'openai', label: 'OpenAI GPT-4' },
              { value: 'anthropic', label: 'Anthropic Claude 3' },
              { value: 'gemini', label: 'Google Gemini Pro' },
            ]}
            styles={{
              label: { color: colors.text, marginBottom: 8 },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
                height: 42,
              },
            }}
          />
          
          <TextInput
            label="API Token"
            placeholder="输入 API Token"
            styles={{
              label: { color: colors.text, marginBottom: 8 },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
                height: 42,
              },
            }}
          />
        </Stack>
      </Paper>

      {/* 语言设置 */}
      <Paper 
        p="xl"
        radius="md"
        style={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Group justify="space-between">
          <Text size="sm" fw={500} c={colors.text}>
            <IconLanguage size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            语言设置
          </Text>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  backgroundColor: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text size="sm" c={colors.text}>简体中文</Text>
                <IconChevronDown size={16} color={colors.text} />
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item>English</Menu.Item>
              <Menu.Item>简体中文</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>
    </Stack>
  );
} 