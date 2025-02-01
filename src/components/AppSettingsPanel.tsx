import { Stack, Text, Box, Avatar, Button, TextInput, Select, Paper, Group, Progress, Menu, UnstyledButton, Divider } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { IconUser, IconCreditCard, IconRobot, IconLanguage, IconChevronDown, IconSettings2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';

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
  total: 10,
  unit: 'GB'
};

export default function AppSettingsPanel() {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    inputBg: isDark ? '#1A1B1E' : '#f8f9fa',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
    progressTrack: isDark ? '#2C2E33' : '#f1f3f5',
    cardBg: isDark ? '#25262B' : '#fff',
  };

  return (
    <Stack gap="md">
      <Text fw={500} size="sm" c={colors.text}>
        <IconSettings2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        {t('nav.appSettings')}
      </Text>

      <Paper p="md" radius="md" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
        <Stack gap="md">
          {/* 用户信息 */}
          <Group>
            <Avatar size="lg" src={user.avatar} color="blue">
              <IconUser size={24} />
            </Avatar>
            <Box>
              <Text size="sm" fw={500}>{user.name}</Text>
              <Text size="xs" c="dimmed">Free Plan</Text>
            </Box>
          </Group>

          {/* AI 使用量 */}
          <Box>
            <Group justify="space-between" mb={4}>
              <Text size="sm" c={colors.text}>AI Usage</Text>
              <Text size="sm" c="dimmed">{aiUsage.used}/{aiUsage.total} {aiUsage.unit}</Text>
            </Group>
            <Progress 
              value={(aiUsage.used / aiUsage.total) * 100} 
              size="sm" 
              color="blue"
            />
          </Box>

          <Divider />

          {/* 语言设置 */}
          <Box>
            <Text size="sm" fw={500} mb="md" c={colors.text}>
              <IconLanguage size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('settings.language.title')}
            </Text>
            <Box px="xs">
              <LanguageSwitch />
            </Box>
          </Box>

          <Divider />

          {/* 其他设置 */}
          <Group justify="space-between">
            <Text size="sm" c={colors.text}>
              <IconCreditCard size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('settings.subscription.title')}
            </Text>
            <Button variant="light" size="xs">
              {t('settings.subscription.upgrade')}
            </Button>
          </Group>

          <Group justify="space-between">
            <Text size="sm" c={colors.text}>
              <IconRobot size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('settings.aiModel.title')}
            </Text>
            <Select
              size="xs"
              w={120}
              data={[
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5', label: 'GPT-3.5' },
              ]}
              defaultValue="gpt-3.5"
            />
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
} 