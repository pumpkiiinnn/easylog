import { Stack, Text, Paper, Group, ActionIcon, Button, Modal, Select, TextInput, Badge, Box, Tabs, Notification, Code, ScrollArea } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { useState, useEffect } from 'react';
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
  IconPlayerPlay,
  IconPlayerStop,
  IconCheck,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

interface RemoteLog {
  id: string;
  name: string;
  type: 'ssh' | 'kafka' | 'elasticsearch' | 'mongodb' | 'mysql' | 'redis' | 'custom';
  host: string;
  port?: number;
  username?: string;
  authType?: 'password' | 'key';
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  logFilePath?: string;
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
}

export default function RemoteLogsPanel() {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  
  // 状态管理
  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info'; message: string} | null>(null);
  const [activeConnections, setActiveConnections] = useState<{[key: string]: boolean}>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<RemoteLog | null>(null);
  const [logContent, setLogContent] = useState<{[key: string]: string[]}>({});
  
  // 事件监听器引用
  const [unlisteners, setUnlisteners] = useState<UnlistenFn[]>([]);
  
  // 初始化事件监听
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // 监听SSH连接状态变化
        const connectionStatusListener = await listen('ssh-connection-status', (event: any) => {
          const { id, connected, message } = event.payload;
          setLogs(prevLogs => {
            return prevLogs.map(log => {
              if (log.id === id) {
                return {
                  ...log,
                  status: connected ? 'connected' : 'error',
                  message: message
                };
              }
              return log;
            });
          });
          
          if (connected) {
            setActiveConnections(prev => ({ ...prev, [id]: true }));
            setNotification({ type: 'success', message: t('remoteLogs.notifications.connected', { name: logs.find(l => l.id === id)?.name || id }) });
          } else {
            setActiveConnections(prev => ({ ...prev, [id]: false }));
            setNotification({ type: 'error', message: message || t('remoteLogs.notifications.connectionError') });
          }
          setIsConnecting(false);
        });
        
        // 监听SSH日志数据
        const logDataListener = await listen('ssh-log-data', (event: any) => {
          const { id, content } = event.payload;
          setLogContent(prev => {
            const prevContent = prev[id] || [];
            return {
              ...prev,
              [id]: [...prevContent, content]
            };
          });
        });
        
        setUnlisteners([connectionStatusListener, logDataListener]);
      } catch (error) {
        console.error('Failed to setup listeners:', error);
      }
    };
    
    setupListeners();
    
    // 清理函数
    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []); // 仅在组件挂载时运行一次
  
  // SSH连接函数
  const connectSsh = async (log: RemoteLog) => {
    try {
      setIsConnecting(true);
      
      // 准备SSH凭证
      const sshCredentials = {
        host: log.host,
        port: log.port || 22,
        username: log.username,
        auth_type: log.authType,
        ...(log.authType === 'password' ? { password: log.password } : {
          private_key_path: log.privateKeyPath,
          passphrase: log.passphrase
        })
      };
      
      // 调用Rust后端
      await invoke('test_ssh_connection', { id: log.id, credentials: sshCredentials });
      
      // 启动日志流
      if (log.logFilePath) {
        await invoke('start_log_stream', {
          id: log.id,
          credentials: sshCredentials,
          options: {
            log_file_path: log.logFilePath,
            follow: true
          }
        });
      }
    } catch (error) {
      console.error('SSH connection error:', error);
      setNotification({ type: 'error', message: String(error) });
      setIsConnecting(false);
      
      // 更新日志状态为错误
      setLogs(prevLogs => {
        return prevLogs.map(l => {
          if (l.id === log.id) {
            return { ...l, status: 'error', message: String(error) };
          }
          return l;
        });
      });
    }
  };
  
  // SSH断开连接函数
  const disconnectSsh = async (id: string) => {
    try {
      await invoke('stop_log_stream', { id });
      setActiveConnections(prev => ({ ...prev, [id]: false }));
      
      // 更新日志状态为断开连接
      setLogs(prevLogs => {
        return prevLogs.map(log => {
          if (log.id === id) {
            return { ...log, status: 'disconnected' };
          }
          return log;
        });
      });
      
      setNotification({ type: 'info', message: t('remoteLogs.notifications.disconnected', { name: logs.find(l => l.id === id)?.name || id }) });
    } catch (error) {
      console.error('SSH disconnection error:', error);
      setNotification({ type: 'error', message: String(error) });
    }
  };
  
  // 打开编辑模态框
  const openEditModal = (log: RemoteLog) => {
    setEditingLog({ ...log });
    setIsEditModalOpen(true);
  };
  
  // 保存编辑后的连接
  const saveEditedLog = () => {
    if (!editingLog) return;
    
    setLogs(prevLogs => {
      return prevLogs.map(log => {
        if (log.id === editingLog.id) {
          return editingLog;
        }
        return log;
      });
    });
    
    setIsEditModalOpen(false);
    setEditingLog(null);
  };
  
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
                  {log.status !== 'connected' ? (
                    <ActionIcon 
                      variant="subtle" 
                      color="green" 
                      size="sm"
                      onClick={() => connectSsh(log)}
                      loading={isConnecting}
                      disabled={isConnecting}
                    >
                      <IconPlayerPlay size={14} />
                    </ActionIcon>
                  ) : (
                    <ActionIcon 
                      variant="subtle" 
                      color="red" 
                      size="sm"
                      onClick={() => disconnectSsh(log.id)}
                    >
                      <IconPlayerStop size={14} />
                    </ActionIcon>
                  )}
                  <ActionIcon 
                    variant="subtle" 
                    color="blue" 
                    size="sm"
                    onClick={() => openEditModal(log)}
                    disabled={log.status === 'connected'}
                  >
                    <IconPencil size={14} />
                  </ActionIcon>
                  <ActionIcon 
                    variant="subtle" 
                    color="red" 
                    size="sm"
                    onClick={() => {
                      if (log.status === 'connected') {
                        disconnectSsh(log.id);
                      }
                      setLogs(prev => prev.filter(l => l.id !== log.id));
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              <Text size="xs" c="dimmed">{log.host}</Text>
            </Paper>
          ))}
        </Stack>
      </Stack>

      {/* 通知组件 */}
      {notification && (
        <Notification
          color={notification.type === 'success' ? 'green' : notification.type === 'error' ? 'red' : 'blue'}
          title={notification.type === 'success' ? t('remoteLogs.notifications.success') : 
                 notification.type === 'error' ? t('remoteLogs.notifications.error') : 
                 t('remoteLogs.notifications.info')}
          icon={notification.type === 'success' ? <IconCheck size={18} /> : 
                notification.type === 'error' ? <IconX size={18} /> : 
                <IconAlertCircle size={18} />}
          onClose={() => setNotification(null)}
          style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
        >
          {notification.message}
        </Notification>
      )}

      {/* 日志内容显示区域 */}
      {activeConnections && Object.keys(activeConnections).length > 0 && (
        <Paper
          p="md"
          radius="md"
          mt="md"
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            height: '300px',
            overflow: 'hidden',
          }}
        >
          <Text fw={500} size="sm" c={colors.text} mb="xs">
            {t('remoteLogs.content.title')}
          </Text>
          <ScrollArea h={240} type="auto">
            {Object.entries(logContent).map(([id, lines]) => (
              activeConnections[id] && (
                <Box key={id}>
                  <Text fw={500} size="xs" c={colors.text}>
                    {logs.find(l => l.id === id)?.name || id}
                  </Text>
                  <Code block style={{ backgroundColor: isDark ? '#1A1B1E' : '#F1F3F5', color: isDark ? '#C1C2C5' : '#495057' }}>
                    {lines.join('\n')}
                  </Code>
                </Box>
              )
            ))}
          </ScrollArea>
        </Paper>
      )}

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
                {category.category === 'server' && newLog.type === 'ssh' && (
                  <>
                    <TextInput
                      label={t('remoteLogs.form.port')}
                      placeholder="22"
                      value={newLog.port?.toString() || '22'}
                      onChange={(e) => setNewLog({ ...newLog, port: parseInt(e.target.value) || 22 })}
                    />
                    <TextInput
                      label={t('remoteLogs.form.username')}
                      placeholder={t('remoteLogs.form.inputUsername')}
                      value={newLog.username || ''}
                      onChange={(e) => setNewLog({ ...newLog, username: e.target.value })}
                      required
                    />
                    <Select
                      label={t('remoteLogs.form.authType')}
                      placeholder={t('remoteLogs.form.selectAuthType')}
                      data={[
                        { value: 'password', label: t('remoteLogs.form.password') },
                        { value: 'key', label: t('remoteLogs.form.privateKey') }
                      ]}
                      value={newLog.authType || 'password'}
                      onChange={(value) => setNewLog({ ...newLog, authType: value as 'password' | 'key' })}
                      required
                    />
                    {newLog.authType === 'password' ? (
                      <TextInput
                        label={t('remoteLogs.form.password')}
                        type="password"
                        placeholder={t('remoteLogs.form.inputPassword')}
                        value={newLog.password || ''}
                        onChange={(e) => setNewLog({ ...newLog, password: e.target.value })}
                        required
                      />
                    ) : (
                      <>
                        <TextInput
                          label={t('remoteLogs.form.privateKeyPath')}
                          placeholder={t('remoteLogs.form.inputPrivateKeyPath')}
                          value={newLog.privateKeyPath || ''}
                          onChange={(e) => setNewLog({ ...newLog, privateKeyPath: e.target.value })}
                          required
                        />
                        <TextInput
                          label={t('remoteLogs.form.passphrase')}
                          type="password"
                          placeholder={t('remoteLogs.form.inputPassphrase')}
                          value={newLog.passphrase || ''}
                          onChange={(e) => setNewLog({ ...newLog, passphrase: e.target.value })}
                        />
                      </>
                    )}
                    <TextInput
                      label={t('remoteLogs.form.logFilePath')}
                      placeholder="/var/log/syslog"
                      value={newLog.logFilePath || ''}
                      onChange={(e) => setNewLog({ ...newLog, logFilePath: e.target.value })}
                      required
                    />
                  </>
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

      {/* 编辑模态框 */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLog(null);
        }}
        title={t('remoteLogs.form.editTitle')}
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
        {editingLog && (
          <Stack gap="md">
            <TextInput
              label={t('remoteLogs.form.name')}
              placeholder={t('remoteLogs.form.inputName')}
              value={editingLog.name}
              onChange={(e) => setEditingLog({ ...editingLog, name: e.target.value })}
              required
            />
            <Select
              label={t('remoteLogs.form.type')}
              placeholder={t('remoteLogs.form.selectType')}
              data={getAllTypes().map(type => ({ value: type.value, label: type.label }))}
              value={editingLog.type}
              onChange={(value) => setEditingLog({ ...editingLog, type: value as RemoteLog['type'] })}
              required
              disabled
            />
            <TextInput
              label={t('remoteLogs.form.host')}
              placeholder={t('remoteLogs.form.inputHost')}
              value={editingLog.host}
              onChange={(e) => setEditingLog({ ...editingLog, host: e.target.value })}
              required
            />
            {editingLog.type === 'ssh' && (
              <>
                <TextInput
                  label={t('remoteLogs.form.port')}
                  placeholder="22"
                  value={editingLog.port?.toString() || '22'}
                  onChange={(e) => setEditingLog({ ...editingLog, port: parseInt(e.target.value) || 22 })}
                />
                <TextInput
                  label={t('remoteLogs.form.username')}
                  placeholder={t('remoteLogs.form.inputUsername')}
                  value={editingLog.username || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, username: e.target.value })}
                  required
                />
                <Select
                  label={t('remoteLogs.form.authType')}
                  placeholder={t('remoteLogs.form.selectAuthType')}
                  data={[
                    { value: 'password', label: t('remoteLogs.form.password') },
                    { value: 'key', label: t('remoteLogs.form.privateKey') }
                  ]}
                  value={editingLog.authType || 'password'}
                  onChange={(value) => setEditingLog({ ...editingLog, authType: value as 'password' | 'key' })}
                  required
                />
                {editingLog.authType === 'password' ? (
                  <TextInput
                    label={t('remoteLogs.form.password')}
                    type="password"
                    placeholder={t('remoteLogs.form.inputPassword')}
                    value={editingLog.password || ''}
                    onChange={(e) => setEditingLog({ ...editingLog, password: e.target.value })}
                    required
                  />
                ) : (
                  <>
                    <TextInput
                      label={t('remoteLogs.form.privateKeyPath')}
                      placeholder={t('remoteLogs.form.inputPrivateKeyPath')}
                      value={editingLog.privateKeyPath || ''}
                      onChange={(e) => setEditingLog({ ...editingLog, privateKeyPath: e.target.value })}
                      required
                    />
                    <TextInput
                      label={t('remoteLogs.form.passphrase')}
                      type="password"
                      placeholder={t('remoteLogs.form.inputPassphrase')}
                      value={editingLog.passphrase || ''}
                      onChange={(e) => setEditingLog({ ...editingLog, passphrase: e.target.value })}
                    />
                  </>
                )}
                <TextInput
                  label={t('remoteLogs.form.logFilePath')}
                  placeholder="/var/log/syslog"
                  value={editingLog.logFilePath || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, logFilePath: e.target.value })}
                  required
                />
              </>
            )}
            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingLog(null);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={saveEditedLog}>
                {t('common.save')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
} 