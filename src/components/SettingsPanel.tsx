import { Stack, Text, Switch, ColorInput, NumberInput, Box, Button, Select, Group } from '@mantine/core';
import { useLogSettingsStore } from '../stores/logSettingsStore';
import { useThemeStore } from '../stores/themeStore';
import { LogLevel } from '../types/log';
import { IconMoonStars, IconSun, IconPlus, IconEdit } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import CustomLogFormatDialog from './CustomLogFormatDialog';
import { useLogFormatStore } from '../stores/logFormatStore';

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
  const { formats, activeFormatId, setActiveFormat } = useLogFormatStore();

  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState<string | undefined>(undefined);

  const { t } = useTranslation();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    inputBg: isDark ? '#1A1B1E' : '#f8f9fa',
    text: isDark ? '#C1C2C5' : '#495057',
  };

  // 打开添加格式对话框
  const openAddFormatDialog = () => {
    setEditingFormatId(undefined);
    setFormatDialogOpen(true);
  };

  // 打开编辑格式对话框
  const openEditFormatDialog = (id: string) => {
    setEditingFormatId(id);
    setFormatDialogOpen(true);
  };

  // 处理格式选择
  const handleFormatSelect = (value: string | null) => {
    setActiveFormat(value);
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
          

          <Box>
            <Group justify="space-between" mb="xs">
              <Text 
                size="sm" 
                fw={500}
                c={colors.text}
              >
                {t('settings.customLogFormat.title', '日志格式')}
              </Text>
              <Button 
                leftSection={<IconPlus size={14} />} 
                variant="subtle" 
                size="xs"
                onClick={openAddFormatDialog}
              >
                {t('settings.customLogFormat.addFormat', '添加')}
              </Button>
            </Group>

            <Select
              placeholder={t('settings.customLogFormat.selectFormatPlaceholder', '选择格式')}
              data={formats.length > 0 ? 
                [
                  ...(formats.some(format => format.isDefault) ? [{
                    group: t('settings.customLogFormat.defaultFormats', '默认'),
                    items: formats.filter(format => format.isDefault).map(format => ({
                      value: format.id,
                      label: format.name
                    }))
                  }] : []),
                  ...(formats.some(format => !format.isDefault) ? [{
                    group: t('settings.customLogFormat.customFormats', '自定义'),
                    items: formats.filter(format => !format.isDefault).map(format => ({
                      value: format.id,
                      label: format.name
                    }))
                  }] : [])
                ].filter(group => group.items.length > 0)
                : [] 
              }
              value={activeFormatId}
              onChange={handleFormatSelect}
              clearable
              mb="sm"
              styles={{
                input: {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              }}
              rightSection={
                activeFormatId && !formats.find(f => f.id === activeFormatId)?.isDefault ? (
                  <div 
                    style={{ cursor: 'pointer' }}
                    onClick={() => openEditFormatDialog(activeFormatId)}
                  >
                    <IconEdit size={16} color={colors.text} />
                  </div>
                ) : null
              }
            />
          </Box>
          
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

      <CustomLogFormatDialog
        opened={formatDialogOpen}
        onClose={() => setFormatDialogOpen(false)}
        editingFormatId={editingFormatId}
      />
    </Stack>
  );
} 