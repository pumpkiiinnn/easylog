import { Menu, UnstyledButton, Group, Text } from '@mantine/core';
import { IconLanguage, IconCheck } from '@tabler/icons-react';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore } from '../stores/languageStore';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '简体中文' },
];

export default function LanguageSwitch() {
  const { isDark } = useThemeStore();
  const { currentLanguage, setLanguage } = useLanguageStore();

  const colors = {
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
  };

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
  };

  return (
    <Menu position="bottom-start" shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton
            /*//@ts-ignore*/
          sx={{
            padding: '8px 12px',
            borderRadius: 4,
            border: `1px solid ${colors.text}20`,
            width: '100%',
            '&:hover': {
              backgroundColor: colors.hover,
            },
          }}
        >
          <Group justify="space-between">
            <Group gap="sm">
              <IconLanguage size={16} />
              <Text size="sm">
                {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}
              </Text>
            </Group>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {languages.map((lang) => (
          <Menu.Item
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            leftSection={<IconLanguage size={16} />}
            rightSection={lang.code === currentLanguage && <IconCheck size={14} />}
          >
            {lang.name}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
} 