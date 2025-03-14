import { Stack, Text, Switch, ColorInput, NumberInput, Box } from '@mantine/core';
import { useLogSettingsStore } from '../stores/logSettingsStore';
import { useThemeStore } from '../stores/themeStore';
import { LogLevel } from '../types/log';
import { IconMoonStars, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

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

  const { isDark, toggleTheme } = useThemeStore();

  const { t } = useTranslation();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    inputBg: isDark ? '#1A1B1E' : '#f8f9fa',
    text: isDark ? '#C1C2C5' : '#495057',
  };

  return (
    <Stack gap={0}>
      <Box p="xs" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <Text size="sm" fw={500} c={colors.text}>{t('settings.displaySettings')}</Text>
      </Box>
      
      <Box p="xs">
        <Stack gap="md">
          <Switch 
            label={t('settings.theme.darkMode')} 
            description={t('settings.theme.darkModeDescription')}
            checked={isDark}
            onChange={() => toggleTheme()}
            thumbIcon={isDark ? <IconMoonStars size={12} /> : <IconSun size={12} />}
            styles={{
              label: { fontSize: '13px', color: colors.text },
              description: { fontSize: '12px', color: isDark ? '#909296' : '#868e96' },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              }
            }}
          />

          <Switch 
            label={t('settings.autoRefresh')} 
            description={t('settings.autoRefreshDescription')}
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.currentTarget.checked)}
            styles={{
              label: { fontSize: '13px', color: colors.text },
              description: { fontSize: '12px', color: isDark ? '#909296' : '#868e96' },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              }
            }}
          />
          
          <Switch 
            label={t('settings.autoScroll')} 
            description={t('settings.autoScrollDescription')}
            checked={autoScroll}
            onChange={(event) => setAutoScroll(event.currentTarget.checked)}
            styles={{
              label: { fontSize: '13px', color: colors.text },
              description: { fontSize: '12px', color: isDark ? '#909296' : '#868e96' },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              }
            }}
          />
          
          <NumberInput
            label={t('settings.fontSize')}
            value={fontSize}
            onChange={(value) => setFontSize(Number(value))}
            min={8}
            max={24}
            styles={{
              label: { fontSize: '13px', color: colors.text },
              input: {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              }
            }}
          />
          
          {(Object.keys(styles) as LogLevel[]).map((level) => (
            <ColorInput
              key={level}
              label={t(`settings.logColors.${level}`)}
              value={styles[level].color}
              onChange={(color) => setStyle(level, { ...styles[level], color })}
              styles={{
                label: { fontSize: '13px', color: colors.text },
                input: {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                },
                preview: {
                  border: `1px solid ${colors.border}`,
                }
              }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
} 