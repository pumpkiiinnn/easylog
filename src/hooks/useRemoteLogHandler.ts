import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useLogContentStore } from '../stores/logContentStore';
import { useTranslation } from 'react-i18next';

export interface AuthMethod {
  auth_type: 'password' | 'key';
  password?: string;
  private_key_path?: string;
  passphrase?: string;
}

export interface SshCredentials {
  host: string;
  port?: number;
  username: string;
  auth_method: AuthMethod;
}

export interface LogStreamOptions {
  log_file_path: string;
  follow: boolean;
}

export interface RemoteLogConnection {
  id: string;
  name: string;
  credentials: SshCredentials;
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  logPath?: string;
  isMonitoring: boolean;
}

export interface LogStreamData {
  content: string;
  timestamp: number;
}

export function useRemoteLogHandler() {
  const [connections, setConnections] = useState<RemoteLogConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const { setContent, setCurrentFileName } = useLogContentStore();
  const { t } = useTranslation();

  // 添加连接
  const addConnection = useCallback((connection: Omit<RemoteLogConnection, 'id' | 'status' | 'isMonitoring'>) => {
    setConnections(prev => [
      ...prev,
      {
        ...connection,
        id: Date.now().toString(),
        status: 'disconnected',
        isMonitoring: false
      }
    ]);
  }, []);

  // 移除连接
  const removeConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
  }, []);

  // 更新连接状态
  const updateConnectionStatus = useCallback((id: string, status: RemoteLogConnection['status'], lastError?: string) => {
    setConnections(prev => prev.map(conn => 
      conn.id === id ? { 
        ...conn, 
        status, 
        lastError: lastError || conn.lastError,
        isMonitoring: status === 'connected' ? conn.isMonitoring : false
      } : conn
    ));
  }, []);

  // 更新连接监控状态
  const updateMonitoringStatus = useCallback((id: string, isMonitoring: boolean, logPath?: string) => {
    setConnections(prev => prev.map(conn => 
      conn.id === id ? { 
        ...conn, 
        isMonitoring,
        logPath: logPath || conn.logPath
      } : conn
    ));
  }, []);

  // 测试连接
  const testConnection = useCallback(async (credentials: SshCredentials) => {
    setIsConnecting(true);
    try {
      const result = await invoke<{ connected: boolean, message: string }>('test_ssh_connection', { credentials });
      return result;
    } catch (error) {
      console.error('SSH连接测试失败:', error);
      return { 
        connected: false, 
        message: error instanceof Error ? error.message : t('remoteLogs.errors.unknownError')
      };
    } finally {
      setIsConnecting(false);
    }
  }, [t]);

  // 连接并获取日志内容
  const fetchRemoteLog = useCallback(async (connectionId: string, logPath: string, follow = false) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection) {
      throw new Error(t('remoteLogs.errors.connectionNotFound'));
    }

    setIsFetching(true);
    try {
      // 如果要实时监控，使用monitor_remote_log命令
      if (follow) {
        await invoke('monitor_remote_log', {
          credentials: connection.credentials,
          options: {
            log_file_path: logPath,
            follow: true
          }
        });
        // 设置当前文件名，使LogContent组件能够显示内容
        setCurrentFileName(`${connection.name}: ${logPath}`);
        // 初始化内容为空字符串，确保LogContent组件知道有内容要显示
        setContent('');
        updateMonitoringStatus(connectionId, true, logPath);
        return true;
      } else {
        // 否则使用read_remote_log命令一次性获取日志内容
        const result = await invoke<{ content: string, file_name: string }>('read_remote_log', {
          credentials: connection.credentials,
          options: {
            log_file_path: logPath,
            follow: false
          }
        });
        
        setContent(result.content);
        setCurrentFileName(`${connection.name}: ${result.file_name}`);
        return true;
      }
    } catch (error) {
      console.error('获取远程日志失败:', error);
      updateConnectionStatus(connectionId, 'error', error instanceof Error ? error.message : t('remoteLogs.errors.unknownError'));
      notifications.show({
        title: t('remoteLogs.errors.fetchError'),
        message: error instanceof Error ? error.message : t('remoteLogs.errors.unknownError'),
        color: 'red',
      });
      return false;
    } finally {
      setIsFetching(false);
    }
  }, [connections, updateConnectionStatus, updateMonitoringStatus, setContent, setCurrentFileName, t]);

  // 停止监控日志
  const stopMonitoring = useCallback(async (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection || !connection.logPath) return;

    try {
      await invoke('stop_remote_log_monitor', {
        log_path: connection.logPath
      });
      updateMonitoringStatus(connectionId, false);
    } catch (error) {
      console.error('停止监控日志失败:', error);
      notifications.show({
        title: t('remoteLogs.errors.stopMonitorError'),
        message: error instanceof Error ? error.message : t('remoteLogs.errors.unknownError'),
        color: 'red',
      });
    }
  }, [connections, updateMonitoringStatus, t]);

  // 连接到服务器
  const connectToServer = useCallback(async (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection) return;

    setIsConnecting(true);
    try {
      const testResult = await testConnection(connection.credentials);
      if (testResult.connected) {
        updateConnectionStatus(connectionId, 'connected');
        notifications.show({
          title: t('remoteLogs.notifications.connectionSuccess'),
          message: testResult.message,
          color: 'green',
        });
        setSelectedConnection(connectionId);
        return true;
      } else {
        updateConnectionStatus(connectionId, 'error', testResult.message);
        notifications.show({
          title: t('remoteLogs.errors.connectionFailed'),
          message: testResult.message,
          color: 'red',
        });
        return false;
      }
    } catch (error) {
      console.error('连接服务器失败:', error);
      updateConnectionStatus(connectionId, 'error', error instanceof Error ? error.message : t('remoteLogs.errors.unknownError'));
      notifications.show({
        title: t('remoteLogs.errors.connectionFailed'),
        message: error instanceof Error ? error.message : t('remoteLogs.errors.unknownError'),
        color: 'red',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [connections, updateConnectionStatus, testConnection, t]);

  // 断开连接
  const disconnectFromServer = useCallback(async (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection) return;

    // 如果正在监控日志，首先停止监控
    if (connection.isMonitoring) {
      await stopMonitoring(connectionId);
    }

    updateConnectionStatus(connectionId, 'disconnected');
    if (selectedConnection === connectionId) {
      setSelectedConnection(null);
    }
  }, [connections, selectedConnection, stopMonitoring, updateConnectionStatus]);

  // 设置事件监听
  useEffect(() => {
    const unlistenFunctions: (() => void)[] = [];

    const setupEventListeners = async () => {
      // 监听日志连接成功事件
      const connectedUnlisten = await listen<string>('ssh-log-connected', (event) => {
        console.log('SSH日志连接成功:', event.payload);
        notifications.show({
          title: t('remoteLogs.notifications.streamConnected'),
          message: event.payload,
          color: 'green',
        });
      });
      unlistenFunctions.push(connectedUnlisten);

      // 监听日志数据事件
      const dataUnlisten = await listen<LogStreamData>('ssh-log-data', (event) => {
        console.log('收到日志数据:', event.payload);
        // 添加到日志内容中
        setContent(prevContent => {
          // 为了避免内容过长，可以限制行数
          const maxLines = 5000;
          const lines = (prevContent || '').split('\n');
          if (lines.length > maxLines) {
            lines.splice(0, lines.length - maxLines);
          }
          return [...lines, event.payload.content].join('\n');
        });
      });
      unlistenFunctions.push(dataUnlisten);

      // 监听日志错误事件
      const errorUnlisten = await listen<string>('ssh-log-error', (event) => {
        console.error('SSH日志错误:', event.payload);
        notifications.show({
          title: t('remoteLogs.errors.streamError'),
          message: event.payload,
          color: 'red',
        });
      });
      unlistenFunctions.push(errorUnlisten);

      // 监听日志断开连接事件
      const disconnectedUnlisten = await listen<string>('ssh-log-disconnected', (event) => {
        console.log('SSH日志连接断开:', event.payload);
        notifications.show({
          title: t('remoteLogs.notifications.streamDisconnected'),
          message: event.payload,
          color: 'yellow',
        });

        // 找到对应的连接并更新状态
        const connectionId = connections.find(conn => conn.logPath === event.payload)?.id;
        if (connectionId) {
          updateMonitoringStatus(connectionId, false);
        }
      });
      unlistenFunctions.push(disconnectedUnlisten);

      // 监听日志监控停止事件
      const monitorStoppedUnlisten = await listen<string>('ssh-log-monitor-stopped', (event) => {
        console.log('SSH日志监控停止:', event.payload);
        // 找到对应的连接并更新状态
        const connectionId = connections.find(conn => conn.logPath === event.payload)?.id;
        if (connectionId) {
          updateMonitoringStatus(connectionId, false);
        }
      });
      unlistenFunctions.push(monitorStoppedUnlisten);
    };

    setupEventListeners();

    // 清理事件监听器
    return () => {
      unlistenFunctions.forEach(unlisten => unlisten());
    };
  }, [connections, updateMonitoringStatus, setContent, t]);

  return {
    connections,
    selectedConnection,
    isConnecting,
    isFetching,
    addConnection,
    removeConnection,
    updateConnectionStatus,
    connectToServer,
    disconnectFromServer,
    fetchRemoteLog,
    stopMonitoring,
    setSelectedConnection
  };
}
