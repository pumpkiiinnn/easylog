import {
  Stack,
  Text,
  Box,
  Avatar,
  Button,
  TextInput,
  Select,
  Paper,
  Group,
  Progress,
  Divider,
  Switch,
  Tabs,
  ActionIcon,
  Menu,
  Badge,
  Tooltip,
} from '@mantine/core';
import {
  IconUser,
  IconCreditCard,
  IconRobot,
  IconLanguage,
  IconBrandOpenai,
  IconBrandGoogle,
  IconBrandAzure,
  IconKey,
  IconSettings,
  IconMessageChatbot,
  IconBrain,
  IconChevronRight,
  IconPlus,
} from '@tabler/icons-react';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../stores/languageStore';
import { useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { LoginModal } from './LoginModal';

// AI 使用数据
const aiUsage = {
  used: 2.5,
  total: 10,
  unit: 'GB'
};

const modelProviders = [
  { 
    value: 'openai', 
    label: 'OpenAI', 
    icon: IconBrandOpenai,
    models: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5', label: 'GPT-3.5' },
    ]
  },
  { 
    value: 'google', 
    label: 'Google AI', 
    icon: IconBrandGoogle,
    models: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-ultra', label: 'Gemini Ultra' },
    ]
  },
  { 
    value: 'azure', 
    label: 'Azure OpenAI', 
    icon: IconBrandAzure,
    models: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo' },
    ]
  },
];

const languages = [
  { value: 'zh-CN', label: '简体中文', emoji: '🇨🇳' },
  { value: 'en-US', label: 'English', emoji: '🇺🇸' },
  // 可以继续添加其他语言
];

export default function AppSettingsPanel() {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const { isLoggedIn, clearUserData, userInfo } = useUserStore();

  console.log('AppSettingsPanel state:', { isLoggedIn, userInfo }); // 添加日志

  // 将 conversationStyles 移到组件内部，这样可以使用 t 函数
  const conversationStyles = [
    { value: 'professional', label: t('settings.aiStyles.professional') },
    { value: 'friendly', label: t('settings.aiStyles.friendly') },
    { value: 'creative', label: t('settings.aiStyles.creative') },
    { value: 'concise', label: t('settings.aiStyles.concise') },
  ];

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    surface: isDark ? '#25262B' : '#fff',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
  };

  // 获取当前语言的显示信息
  const getCurrentLanguageDisplay = () => {
    const currentLang = languages.find(lang => lang.value === currentLanguage);
    return currentLang ? `${currentLang.emoji} ${currentLang.label}` : '';
  };

  return (
    <Stack gap="md" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 48px)' }}>
      <Text fw={500} size="sm" c={colors.text}>
        <IconSettings size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        {t('nav.appSettings')}
      </Text>

      {/* 用户信息和API使用量 */}
      <Paper p="md" radius="md" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <Avatar size="lg" src={userInfo?.avatar} color="blue">
                <IconUser size={24} />
              </Avatar>
              <Box>
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    {isLoggedIn ? userInfo?.name : t('settings.auth.guest')}
                  </Text>
                  <Badge
                    size="sm"
                    variant={isDark ? 'light' : 'outline'}
                    color={userInfo?.subscription === 'free' ? 'blue' : 'green'}
                  >
                    {t(`settings.subscription.${userInfo?.subscription || 'free'}`)}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {isLoggedIn ? userInfo?.email : t('settings.auth.loginTip')}
                </Text>
              </Box>
            </Group>
            {isLoggedIn ? (
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <Button variant="subtle" size="sm">
                    {t('settings.auth.manage')}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item>{t('settings.auth.profile')}</Menu.Item>
                  <Menu.Item>{t('settings.auth.billing')}</Menu.Item>
                  <Menu.Divider />
                  <Menu.Item 
                    color="red"
                    onClick={() => clearUserData()}
                  >
                    {t('settings.auth.logout')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button 
                variant="light" 
                size="sm"
                onClick={() => setLoginModalOpened(true)}
              >
                {t('settings.auth.login')}
              </Button>
            )}
          </Group>

          <Box>
            <Group justify="space-between" mb={4}>
              <Text size="sm" c={colors.text}>{t('settings.apiUsage.title')}</Text>
              <Text size="sm" c="dimmed">
                {aiUsage.used}/{aiUsage.total} {aiUsage.unit}
              </Text>
            </Group>
            <Progress 
              value={(aiUsage.used / aiUsage.total) * 100} 
              size="sm" 
              color="blue"
            />
          </Box>

          <Group justify="space-between">
            <Text size="sm" c={colors.text}>
              <IconRobot size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('settings.aiModel.current')}
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

      {/* 自定义模型设置 */}
      <Paper p="md" radius="md" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <Stack gap="md">
          <Text size="sm" fw={500} c={colors.text}>
            <IconBrain size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {t('settings.customModel.title')}
          </Text>

          <Stack gap="sm">
            <TextInput
              label={t('settings.customModel.apiKey')}
              placeholder={t('settings.customModel.enterApiKey')}
              leftSection={<IconKey size={16} />}
              type="password"
            />

            <Select
              label={t('settings.customModel.modelType')}
              placeholder={t('settings.customModel.selectModel')}
              data={modelProviders.find(p => p.value === 'openai')?.models || []}
              itemComponent={({ label }) => (
                <Group gap="xs">
                  <IconBrandOpenai size={16} />
                  <Text size="sm">{label}</Text>
                </Group>
              )}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* 基础设置 */}
      <Paper p="md" radius="md" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <Stack gap="md">
          <Text size="sm" fw={500} c={colors.text}>
            <IconSettings size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {t('settings.basic.title')}
          </Text>

          {/* 语言设置 */}
          <Box>
            <Text size="sm" fw={500} mb="xs" c={colors.text}>
              <IconLanguage size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('settings.language.title')}
            </Text>
            <Select
              value={currentLanguage}
              onChange={(value) => value && setLanguage(value)}
              data={languages}
              placeholder={t('settings.language.selectLanguage')}
              itemComponent={({ label, emoji }) => (
                <Group gap="xs">
                  <Text size="sm">{emoji}</Text>
                  <Text size="sm">{label}</Text>
                </Group>
              )}
              styles={{
                input: {
                  backgroundColor: colors.hover,
                }
              }}
              rightSectionWidth={70}
              rightSection={
                <Text size="sm" c="dimmed" pr="xs">
                  {languages.find(lang => lang.value === currentLanguage)?.emoji}
                </Text>
              }
            />
            <Text size="xs" c="dimmed" mt={4}>
              {t('settings.language.current')}: {getCurrentLanguageDisplay()}
            </Text>
          </Box>

          <Divider />

          {/* AI 对话风格 */}
          <Box>
            <Text size="sm" fw={500} mb="xs" c={colors.text}>
              <IconMessageChatbot size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {t('settings.aiStyles.title')}
            </Text>
            <Select
              data={conversationStyles}
              defaultValue="professional"
              styles={{
                input: {
                  backgroundColor: colors.hover,
                }
              }}
            />
          </Box>

          {/* 其他设置选项 */}
          <Stack gap="xs">
            <Switch
              label={t('settings.basic.autoSave')}
              description={t('settings.basic.autoSaveDescription')}
            />
            <Switch
              label={t('settings.basic.telemetry')}
              description={t('settings.basic.telemetryDescription')}
            />
          </Stack>
        </Stack>
      </Paper>

      <LoginModal
        opened={loginModalOpened}
        onClose={() => setLoginModalOpened(false)}
      />
    </Stack>
  );
} 