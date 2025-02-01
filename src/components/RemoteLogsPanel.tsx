import { Stack, Text, Paper, Group, ActionIcon, Button, Modal, Select, TextInput, Badge, Box, Tabs } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { useState } from 'react';
import { 
  IconPlus, 
  IconServer,
  IconAffiliate,
  IconDatabase,
  IconCloud, 
  IconTrash, 
  IconPencil,
  IconTerminal2,
  IconBrandElastic,
  IconBrandMongodb,
  IconBrandMysql,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface RemoteLog {
  id: string;
  name: string;
  type: 'ssh' | 'kafka' | 'elasticsearch' | 'mongodb' | 'mysql' | 'redis' | 'custom';
  host: string;
  status: 'connected' | 'disconnected' | 'error';
}

export default function RemoteLogsPanel() {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  
  // 将 REMOTE_TYPES 移到组件内部，这样可以使用 t 函数
  const REMOTE_TYPES = [
    { 
      category: 'server',
      label: t('remoteLogs.categories.server'),
      icon: IconTerminal2,
      types: [
        { value: 'ssh', label: t('remoteLogs.types.ssh'), icon: IconTerminal2, color: '#40C057' },
      ]
    },
    {
      category: 'middleware',
      label: t('remoteLogs.categories.middleware'),
      icon: IconAffiliate,
      types: [
        { value: 'kafka', label: t('remoteLogs.types.kafka'), icon: IconAffiliate, color: '#228BE6' },
        { value: 'redis', label: t('remoteLogs.types.redis'), icon: IconDatabase, color: '#FA5252' },
      ]
    },
    {
      category: 'database',
      label: t('remoteLogs.categories.database'),
      icon: IconDatabase,
      types: [
        { value: 'elasticsearch', label: t('remoteLogs.types.elasticsearch'), icon: IconBrandElastic, color: '#BE4BDB' },
        { value: 'mongodb', label: t('remoteLogs.types.mongodb'), icon: IconBrandMongodb, color: '#82C91E' },
        { value: 'mysql', label: t('remoteLogs.types.mysql'), icon: IconBrandMysql, color: '#FAB005' },
      ]
    },
    {
      category: 'custom',
      label: t('remoteLogs.categories.custom'),
      icon: IconCloud,
      types: [
        { value: 'custom', label: t('remoteLogs.types.custom'), icon: IconCloud, color: '#868E96' },
      ]
    },
  ];

  const [logs, setLogs] = useState<RemoteLog[]>([
    { id: '1', name: t('remoteLogs.defaultNames.productionServer'), type: 'ssh', host: '192.168.1.100', status: 'connected' },
    { id: '2', name: t('remoteLogs.defaultNames.messageQueue'), type: 'kafka', host: 'kafka.example.com', status: 'connected' },
    { id: '3', name: t('remoteLogs.defaultNames.logStorage'), type: 'elasticsearch', host: 'es.example.com', status: 'error' },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLog, setNewLog] = useState<Partial<RemoteLog>>({});
  const [activeTab, setActiveTab] = useState<string>('server');

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    cardBg: isDark ? '#25262B' : '#fff',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
    modalBg: isDark ? '#1A1B1E' : '#fff',
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = REMOTE_TYPES.find(t => t.types.some(t => t.value === type));
    const Icon = typeConfig?.types.find(t => t.value === type)?.icon || IconCloud;
    return <Icon size={18} color={typeConfig?.types.find(t => t.value === type)?.color} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'disconnected': return 'gray';
      case 'error': return 'red';
      default: return 'blue';
    }
  };

  const handleAddLog = () => {
    if (newLog.name && newLog.type && newLog.host) {
      setLogs([...logs, {
        id: Date.now().toString(),
        name: newLog.name,
        type: newLog.type as RemoteLog['type'],
        host: newLog.host,
        status: 'disconnected'
      }]);
      setIsAddModalOpen(false);
      setNewLog({});
    }
  };

  const getAllTypes = () => {
    return REMOTE_TYPES.flatMap(category => category.types);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" px="md" py="xs">
          <Text fw={500} size="sm" c={colors.text}>
            <IconServer size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {t('remoteLogs.title')}
          </Text>
          <Button 
            variant="light" 
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t('remoteLogs.addConnection')}
          </Button>
        </Group>

        <Stack gap="md" px="md">
          {logs.map((log) => (
            <Paper
              key={log.id}
              p="md"
              radius="md"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  borderColor: '#228be6',
                }
              }}
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  {getTypeIcon(log.type)}
                  <Text fw={500} size="sm" c={colors.text}>{log.name}</Text>
                  <Badge 
                    size="sm" 
                    color={getStatusColor(log.status)}
                    variant={isDark ? 'light' : 'outline'}
                  >
                    {log.status}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <ActionIcon variant="subtle" color="blue" size="sm">
                    <IconPencil size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm">
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              <Text size="xs" c="dimmed">{log.host}</Text>
            </Paper>
          ))}
        </Stack>
      </Stack>

      <Modal
        opened={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewLog({});
        }}
        title={t('remoteLogs.form.title')}
        size="lg"
        styles={{
          content: { backgroundColor: colors.modalBg },
          header: {
            backgroundColor: colors.modalBg,
            borderBottom: `1px solid ${colors.border}`,
          },
          title: { color: colors.text },
        }}
      >
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'server')}>
          <Tabs.List>
            {REMOTE_TYPES.map(category => (
              <Tabs.Tab
                key={category.category}
                value={category.category}
                leftSection={<category.icon size={16} />}
              >
                {category.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {REMOTE_TYPES.map(category => (
            <Tabs.Panel key={category.category} value={category.category}>
              <Stack gap="md" mt="md">
                <Select
                  label={t('remoteLogs.form.type')}
                  placeholder={t('remoteLogs.form.selectType', { category: category.label })}
                  data={category.types}
                  value={newLog.type}
                  onChange={(value) => setNewLog({ ...newLog, type: value as RemoteLog['type'] })}
                  itemComponent={({ label, value }) => (
                    <Group gap="xs">
                      {getTypeIcon(value)}
                      <Text size="sm">{label}</Text>
                    </Group>
                  )}
                />
                <TextInput
                  label={t('remoteLogs.form.name')}
                  placeholder={t('remoteLogs.form.inputName')}
                  value={newLog.name || ''}
                  onChange={(e) => setNewLog({ ...newLog, name: e.target.value })}
                />
                <TextInput
                  label={t('remoteLogs.form.host')}
                  placeholder={t('remoteLogs.form.inputHost')}
                  value={newLog.host || ''}
                  onChange={(e) => setNewLog({ ...newLog, host: e.target.value })}
                />
                {category.category === 'server' && (
                  <TextInput
                    label={t('remoteLogs.form.sshKey')}
                    placeholder={t('remoteLogs.form.inputSshKey')}
                  />
                )}
                {category.category === 'database' && (
                  <>
                    <TextInput
                      label={t('remoteLogs.form.username')}
                      placeholder={t('remoteLogs.form.inputUsername')}
                    />
                    <TextInput
                      label={t('remoteLogs.form.password')}
                      type="password"
                      placeholder={t('remoteLogs.form.inputPassword')}
                    />
                  </>
                )}
              </Stack>
            </Tabs.Panel>
          ))}

          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddLog}>
              {t('common.add')}
            </Button>
          </Group>
        </Tabs>
      </Modal>
    </>
  );
} 