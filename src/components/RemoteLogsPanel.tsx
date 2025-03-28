import { Stack, Text, Paper, Group, Button, Modal, Select, TextInput, Badge, Tabs } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { useState, useEffect } from 'react';
import { 
  IconPlus, 
  IconPencil, 
  IconTrash, 
  IconServer,
  IconAffiliate,
  IconDatabase,
  IconCloud,
  IconTerminal2,
  IconBrandElastic,
  IconBrandMongodb,
  IconBrandMysql,
  IconPower,
  IconTowerOff,
  IconSearch,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useLogContentStore } from '../stores/logContentStore';
import { PasswordInput } from '@mantine/core';
import { RemoteLog, useRemoteLogHandler } from '../hooks/useRemoteLogHandler';
import { useRemoteLogStore } from '../stores/remoteLogStore';

export default function RemoteLogsPanel() {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const { setLogContent: setGlobalLogContent, setCurrentFileName } = useLogContentStore();
  
  // 使用新的远程日志处理hook
  const { 
    connectToRemoteLog, 
    disconnectRemoteLog, 
    activateConnection,
    isConnecting
  } = useRemoteLogHandler();
  
  // 使用远程日志存储
  const { logs: storedLogs, addLog, updateLog, deleteLog } = useRemoteLogStore();
  
  // 状态管理
  //@ts-ignore
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info'; message: string} | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<RemoteLog | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // 使用存储的日志初始化状态
  const [logs, setLogs] = useState<RemoteLog[]>([]);
  
  // 当存储的日志变化时更新本地状态
  useEffect(() => {
    if (storedLogs && storedLogs.length > 0) {
      setLogs(storedLogs);
    }
  }, [storedLogs]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 设置默认使用password认证模式
  const [newLog, setNewLog] = useState<Partial<RemoteLog>>({ authType: 'password' });
  const [activeTab, setActiveTab] = useState<string>('server');

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    cardBg: isDark ? '#25262B' : '#fff',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
    modalBg: isDark ? '#1A1B1E' : '#fff',
  };

  const getTypeColor = (type: string) => {
    const typeConfig = REMOTE_TYPES.find(t => t.types.some(t => t.value === type));
    return typeConfig?.types.find(t => t.value === type)?.color || '#868E96';
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
      // 创建新的日志连接，包含所有必要字段
      const newLogEntry: RemoteLog = {
        id: Date.now().toString(),
        name: newLog.name,
        type: newLog.type as RemoteLog['type'],
        host: newLog.host,
        port: newLog.port || 22,
        status: 'disconnected',
        // SSH连接特有字段
        ...(newLog.type === 'ssh' ? {
          username: newLog.username || '',
          authType: newLog.authType || 'password',  // 默认使用password模式
          password: newLog.authType === 'password' ? newLog.password : undefined,
          privateKeyPath: newLog.authType === 'key' ? newLog.privateKeyPath : undefined,
          passphrase: newLog.authType === 'key' ? newLog.passphrase : undefined,
          logFilePath: newLog.logFilePath || '/var/log/syslog'
        } : {})
      };
      
      // 更新本地状态
      setLogs([...logs, newLogEntry]);
      // 保存到持久化存储
      addLog(newLogEntry);
      
      setIsAddModalOpen(false);
      setNewLog({});
    }
  };

  // 更新日志状态函数
  const updateLogStatus = (id: string, status: RemoteLog['status'], message?: string) => {
    setLogs(prevLogs => {
      return prevLogs.map(log => {
        if (log.id === id) {
          return { ...log, status, message };
        }
        return log;
      });
    });
  };

  // 连接SSH服务器
  const connectSsh = async (log: RemoteLog) => {
    try {
      setNotification({ type: 'info', message: t('remoteLogs.notification.connecting', { name: log.name }) });
      
      // 设置为活跃日志，标记当前选中的服务器
      setActiveLogId(log.id);
      
      // 调用hook的连接方法
      await connectToRemoteLog(log);
      
      // 更新日志状态为已连接
      updateLogStatus(log.id, 'connected');
      
      setNotification({ type: 'success', message: t('remoteLogs.notification.connected', { name: log.name }) });
    } catch (error) {
      console.error('SSH connection error:', error);
      setNotification({ type: 'error', message: String(error) });
      
      // 更新日志状态为错误
      updateLogStatus(log.id, 'error', String(error));
    }
  };
  
  // SSH断开连接函数
  const disconnectSsh = async (id: string) => {
    try {
      const log = logs.find(l => l.id === id);
      if (!log) return;
      
      await disconnectRemoteLog(id);
      
      // 更新日志状态为断开连接
      updateLogStatus(id, 'disconnected');
      
      // 如果当前活跃的日志是被断开的日志，则清理LogContent状态
      if (activeLogId === id) {
        setActiveLogId(null);
        setGlobalLogContent('');
        setCurrentFileName('');
      }
      
      setNotification({ type: 'info', message: t('remoteLogs.notification.disconnected', { name: log.name }) });
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
    
    // 更新本地状态
    setLogs(prevLogs => {
      return prevLogs.map(log => {
        if (log.id === editingLog.id) {
          return editingLog;
        }
        return log;
      });
    });
    
    // 保存到持久化存储
    updateLog(editingLog);
    
    setIsEditModalOpen(false);
    setEditingLog(null);
  };

  const getAllTypes = () => {
    return REMOTE_TYPES.flatMap(category => category.types);
  };

  // 过滤日志列表
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      log.name.toLowerCase().includes(lowerCaseQuery) ||
      log.host.toLowerCase().includes(lowerCaseQuery) ||
      log.type.toLowerCase().includes(lowerCaseQuery)
    );
  });

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" px="md" py="xs">
          <TextInput
            placeholder={t('remoteLogs.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="xs"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1 }}
          />
          <Button 
            variant="filled" 
            color="blue"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t('remoteLogs.actions.addConnection')}
          </Button>
        </Group>

        <Stack gap="md" px="md" pb="md">
          {logs.length === 0 ? (
            <Paper
              p="xl"
              radius="md"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px dashed ${colors.border}`,
                textAlign: 'center',
              }}
            >
              <Stack align="center" gap="xs">
                <IconServer size={32} color={isDark ? '#5C5F66' : '#ADB5BD'} />
                <Text size="sm" c={isDark ? '#5C5F66' : '#6C757D'}>
                  {t('remoteLogs.content.empty')}
                </Text>
                <Button 
                  variant="light" 
                  color="blue"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setIsAddModalOpen(true)}
                  mt="sm"
                >
                  {t('remoteLogs.actions.addConnection')}
                </Button>
              </Stack>
            </Paper>
          ) : filteredLogs.length === 0 ? (
            <Paper
              p="xl"
              radius="md"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px dashed ${colors.border}`,
                textAlign: 'center',
              }}
            >
              <Stack align="center" gap="xs">
                <IconSearch size={32} color={isDark ? '#5C5F66' : '#ADB5BD'} />
                <Text size="sm" c={isDark ? '#5C5F66' : '#6C757D'}>
                  {t('remoteLogs.content.noSearchResults')}
                </Text>
                <Button 
                  variant="light" 
                  color="gray"
                  size="xs"
                  onClick={() => setSearchQuery('')}
                  mt="sm"
                >
                  {t('remoteLogs.actions.clearSearch')}
                </Button>
              </Stack>
            </Paper>
          ) : (
            filteredLogs.map((log) => (
              <Paper
                key={log.id}
                p="md"
                radius="md"
                style={{
                  backgroundColor: activeLogId === log.id ? (isDark ? '#2C2E33' : '#E9ECEF') : colors.cardBg,
                  border: `1px solid ${activeLogId === log.id ? '#228be6' : colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => {
                  // 如果已连接，则仅设置为活跃状态
                  if (log.status === 'connected') {
                    setActiveLogId(log.id);
                    // 激活connection，更新LogContent显示
                    activateConnection(log.id);
                  } else {
                    // 未连接则先连接
                    connectSsh(log);
                  }
                }}
              >
                <Stack gap={8}>
                  {/* 标题和状态行 */}
                  <Group justify="flex-start" align="center" style={{ flexWrap: 'nowrap' }}>
                    <Badge 
                      size="md" 
                      color={getTypeColor(log.type)}
                      variant="filled"
                      radius="sm"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {log.type}
                    </Badge>
                
                    <Group gap={4} style={{ marginLeft: 'auto' }}>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        p={0}
                        style={{ width: '28px', height: '28px', minWidth: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(log);
                        }}
                        title={t('remoteLogs.actions.edit')}
                        radius="md"
                      >
                        <IconPencil size={14} />
                      </Button>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        p={0}
                        style={{ width: '28px', height: '28px', minWidth: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // 从本地状态中删除
                          setLogs(logs.filter(l => l.id !== log.id));
                          // 从持久化存储中删除
                          deleteLog(log.id);
                          
                          if (activeLogId === log.id) {
                            setActiveLogId(null);
                            setGlobalLogContent('');
                            setCurrentFileName('');
                          }
                        }}
                        title={t('remoteLogs.actions.delete')}
                        radius="md"
                      >
                        <IconTrash size={14} />
                      </Button>
                    </Group>
                  </Group>
                  <Text fw={600} size="sm" style={{ wordBreak: 'break-word', flex: 1 }}>{log.name}</Text>
                  {/* 主机信息 */}
                  <Group gap={6}>
                    <IconServer size={14} color={isDark ? '#868E96' : '#ADB5BD'} />
                    <Text size="xs" c={isDark ? '#868E96' : '#6C757D'} fw={500}>
                      {log.host}{log.port ? `:${log.port}` : ''}
                    </Text>
                  </Group>
                  
                  {/* 错误信息 */}
                  {log.status === 'error' && log.message && (
                    <Text size="xs" c={getStatusColor(log.status)} fw={500}>
                      {log.message}
                    </Text>
                  )}
                  
                  {/* 操作按钮组 - 只保留连接/断开连接按钮 */}
                  <Group justify="center" mt={8}>
                    {log.status === 'disconnected' ? (
                      <Button
                        variant="filled"
                        color="blue"
                        size="xs"
                        leftSection={<IconPower size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          connectSsh(log);
                        }}
                        loading={isConnecting}
                        disabled={isConnecting}
                        title={t('remoteLogs.actions.connect')}
                        radius="md"
                        fullWidth
                      >
                        {t('remoteLogs.actions.connect')}
                      </Button>
                    ) : (
                      <Button
                        variant="filled"
                        color="red"
                        size="xs"
                        leftSection={<IconTowerOff size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          disconnectSsh(log.id);
                        }}
                        title={t('remoteLogs.actions.disconnect')}
                        radius="md"
                        fullWidth
                      >
                        {t('remoteLogs.actions.disconnect')}
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Stack>

      {/* 添加新连接模态框 */}
      <Modal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={<Text fw={500}>{t('remoteLogs.addConnection')}</Text>}
        size="lg"
        styles={{
          content: {
            backgroundColor: colors.modalBg,
          }
        }}
      >
        <Stack>
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab(value || 'server')}
          >
            <Tabs.List>
              {REMOTE_TYPES.map(category => (
                <Tabs.Tab 
                  key={category.category} 
                  value={category.category}
                  leftSection={<category.icon size={14} />}
                >
                  {category.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {REMOTE_TYPES.map(category => (
              <Tabs.Panel key={category.category} value={category.category} pt="xs">
                <Stack>
                  <Select
                    label={t('remoteLogs.form.type')}
                    placeholder={t('remoteLogs.form.selectType')}
                    data={[
                      { 
                        group: category.label, 
                        items: category.types.map(type => ({
                          value: type.value,
                          label: type.label
                        }))
                      }
                    ]}
                    value={newLog.type}
                    onChange={(value) => setNewLog({ ...newLog, type: value as RemoteLog['type'] })}
                    required
                  />
                  
                  <TextInput
                    label={t('remoteLogs.form.name')}
                    placeholder={t('remoteLogs.form.inputName')}
                    value={newLog.name || ''}
                    onChange={(e) => setNewLog({ ...newLog, name: e.target.value })}
                    required
                  />
                  
                  <TextInput
                    label={t('remoteLogs.form.host')}
                    placeholder={t('remoteLogs.form.inputHost')}
                    value={newLog.host || ''}
                    onChange={(e) => setNewLog({ ...newLog, host: e.target.value })}
                    required
                  />
                  
                  <TextInput
                    label={t('remoteLogs.form.port')}
                    placeholder={newLog.type === 'ssh' ? '22' : t('remoteLogs.form.inputPort')}
                    value={newLog.port?.toString() || ''}
                    onChange={(e) => setNewLog({ ...newLog, port: parseInt(e.target.value) || undefined })}
                  />
                  
                  {/* SSH特有的字段 */}
                  {newLog.type === 'ssh' && (
                    <>
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
                          { value: 'password', label: t('remoteLogs.form.passwordAuth') },
                          { value: 'key', label: t('remoteLogs.form.keyAuth') },
                        ]}
                        value={newLog.authType || 'password'}
                        onChange={(value) => setNewLog({ ...newLog, authType: value as 'password' | 'key' })}
                        required
                      />
                      {newLog.authType === 'password' ? (
                        <PasswordInput
                          label={t('remoteLogs.form.password')}
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
                          <PasswordInput
                            label={t('remoteLogs.form.passphrase')}
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
                  
                  {/* Kafka特有的字段 */}
                  {newLog.type === 'kafka' && (
                    <>
                      <TextInput
                        label={t('remoteLogs.form.username')}
                        placeholder={t('remoteLogs.form.inputUsername')}
                      />
                      <PasswordInput
                        label={t('remoteLogs.form.password')}
                        placeholder={t('remoteLogs.form.inputPassword')}
                      />
                    </>
                  )}
                  
                  {/* 其他特有字段可以根据类型添加 */}
                  
                </Stack>
              </Tabs.Panel>
            ))}
          </Tabs>
          
          <Group justify="end" mt="md">
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setNewLog({});
            }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddLog} disabled={!newLog.name || !newLog.type || !newLog.host}>
              {t('common.add')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 编辑连接模态框 */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLog(null);
        }}
        title={<Text fw={500}>{t('remoteLogs.editConnection')}</Text>}
        size="lg"
        styles={{
          content: {
            backgroundColor: colors.modalBg,
          }
        }}
      >
        {editingLog && (
          <Stack>
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
              data={[
                {
                  group: t('remoteLogs.categories.all'),
                  items: getAllTypes().map(type => ({
                    value: type.value,
                    label: type.label
                  }))
                }
              ]}
              value={editingLog.type}
              onChange={(value) => setEditingLog({ ...editingLog, type: value as RemoteLog['type'] })}
              required
            />
            
            <TextInput
              label={t('remoteLogs.form.host')}
              placeholder={t('remoteLogs.form.inputHost')}
              value={editingLog.host}
              onChange={(e) => setEditingLog({ ...editingLog, host: e.target.value })}
              required
            />
            
            <TextInput
              label={t('remoteLogs.form.port')}
              placeholder={editingLog.type === 'ssh' ? '22' : t('remoteLogs.form.inputPort')}
              value={editingLog.port?.toString() || ''}
              onChange={(e) => setEditingLog({ ...editingLog, port: parseInt(e.target.value) || undefined })}
            />
            
            {/* SSH特有的字段 */}
            {editingLog.type === 'ssh' && (
              <>
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
                    { value: 'password', label: t('remoteLogs.form.passwordAuth') },
                    { value: 'key', label: t('remoteLogs.form.keyAuth') },
                  ]}
                  value={editingLog.authType || 'password'}
                  onChange={(value) => setEditingLog({ ...editingLog, authType: value as 'password' | 'key' })}
                  required
                />
                {editingLog.authType === 'password' ? (
                  <PasswordInput
                    label={t('remoteLogs.form.password')}
                    type="password"
                    placeholder={t('remoteLogs.form.inputPassword')}
                    value={editingLog.password || ''}
                    onChange={(e) => setEditingLog({ ...editingLog, password: e.target.value })}
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
                    <PasswordInput
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
          </Stack>
        )}
        
        <Group justify="end" mt="md">
          <Button variant="outline" onClick={() => {
            setIsEditModalOpen(false);
            setEditingLog(null);
          }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditedLog}>
            {t('common.save')}
          </Button>
        </Group>
      </Modal>
      
    </>
  );
}