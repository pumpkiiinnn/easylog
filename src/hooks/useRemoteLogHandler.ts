import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useLogContentStore } from '../stores/logContentStore';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import type { UnlistenFn } from '@tauri-apps/api/event';

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
  auth_type: 'password' | 'key';
  password?: string;
  private_key_path?: string;
  passphrase?: string;
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

export interface RemoteLog {
  id: string;
  name: string;
  type: 'ssh' | 'kafka' | 'elasticsearch' | 'redis' | 'mongodb' | 'mysql' | 'custom';
  host: string;
  port?: number;
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
  // SSH特有属性
  username?: string;
  authType?: 'password' | 'key';
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  logFilePath?: string;
}

export function useRemoteLogHandler() {
  const [connections, setConnections] = useState<RemoteLogConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [content, setContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<{[key: string]: string[]}>({});
  
  const { setLogContent: setGlobalLogContent, setCurrentFileName: setGlobalFileName } = useLogContentStore();
  const { t } = useTranslation();

  // 设置事件监听器
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    
    const setupListeners = async () => {
      try {
        // 监听SSH连接状态
        const connectionStatusListener = await listen('ssh-connection-status', (event: any) => {
          const { id, connected, message } = event.payload;
          
          console.log('SSH连接状态事件:', { id, connected, message });
          
          updateConnectionStatus(id, connected ? 'connected' : 'error', message);
          
          if (connected) {
            notifications.show({
              title: t('remoteLogs.notifications.connected'),
              message: t('remoteLogs.notifications.connectedDetail', { 
                name: connections.find(c => c.id === id)?.name || id 
              }),
              color: 'green',
            });
          } else {
            notifications.show({
              title: t('remoteLogs.notifications.connectionError'),
              message: message || t('remoteLogs.notifications.unknownError'),
              color: 'red',
            });
          }
          setIsConnecting(false);
        });
        unlisteners.push(connectionStatusListener);
        
        // 监听SSH日志连接成功
        const logConnectedListener = await listen('ssh-log-connected', (event: any) => {
          const logPath = event.payload;
          console.log('SSH日志连接成功:', logPath);
          
          // 如果有活跃连接，更新其状态
          if (activeConnectionId) {
            updateConnectionStatus(activeConnectionId, 'connected');
            updateMonitoringStatus(activeConnectionId, true, logPath);
          }
        });
        unlisteners.push(logConnectedListener);
        
        // 监听SSH日志断开连接
        const logDisconnectedListener = await listen('ssh-log-disconnected', (event: any) => {
          const logPath = event.payload;
          console.log('SSH日志连接断开:', logPath);
          
          // 查找匹配的连接并更新其状态
          connections.forEach(conn => {
            if (conn.logPath === logPath) {
              updateConnectionStatus(conn.id, 'disconnected');
              updateMonitoringStatus(conn.id, false);
            }
          });
        });
        unlisteners.push(logDisconnectedListener);
        
        // 监听SSH日志数据
        const logDataListener = await listen('ssh-log-data', (event: any) => {
          const { content: logContent, source, timestamp } = event.payload;
          console.log('收到SSH日志数据:', { source, contentLength: logContent?.length });
          
          if (!source || !logContent) {
            console.warn('收到无效的日志数据:', event.payload);
            return;
          }
          
          // 查找与日志路径匹配的连接
          const connection = connections.find(conn => conn.logPath === source);
          if (!connection) {
            console.warn('找不到匹配的连接:', source);
            return;
          }
          
          // 更新内部日志状态
          setLogContent(prev => {
            const prevContent = prev[connection.id] || [];
            const newContent = [...prevContent, logContent];
            
            // 如果是当前活跃的连接，则更新LogContent组件
            if (connection.id === activeConnectionId) {
              setGlobalLogContent(newContent.join('\n'));
              setGlobalFileName(`${connection.name}: ${source}`);
              setContent(newContent.join('\n'));
              setCurrentFileName(`${connection.name}: ${source}`);
            }
            
            return {
              ...prev,
              [connection.id]: newContent
            };
          });
        });
        unlisteners.push(logDataListener);
        
        // 监听SSH日志错误
        const logErrorListener = await listen('ssh-log-error', (event: any) => {
          const errorMessage = event.payload;
          console.error('SSH日志错误:', errorMessage);
          
          notifications.show({
            title: t('remoteLogs.errors.logError'),
            message: errorMessage,
            color: 'red',
          });
          
          // 如果有活跃连接，更新其状态为错误
          if (activeConnectionId) {
            updateConnectionStatus(activeConnectionId, 'error', errorMessage);
            updateMonitoringStatus(activeConnectionId, false);
          }
        });
        unlisteners.push(logErrorListener);
        
        console.log('远程日志事件监听器设置完成');
      } catch (error) {
        console.error('设置事件监听器失败:', error);
      }
    };
    
    setupListeners();
    
    // 清理函数
    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, [connections, activeConnectionId, t]);

  // 更新连接状态
  const updateConnectionStatus = useCallback((id: string, status: RemoteLogConnection['status'], error?: string) => {
    setConnections(prevConnections => {
      return prevConnections.map(conn => {
        if (conn.id === id) {
          return { 
            ...conn, 
            status, 
            lastError: error || conn.lastError 
          };
        }
        return conn;
      });
    });
  }, []);

  // 更新监控状态
  const updateMonitoringStatus = useCallback((id: string, isMonitoring: boolean, logPath?: string) => {
    setConnections(prevConnections => {
      return prevConnections.map(conn => {
        if (conn.id === id) {
          return { 
            ...conn, 
            isMonitoring,
            ...(logPath ? { logPath } : {})
          };
        }
        return conn;
      });
    });
  }, []);

  // 获取远程日志
  const fetchRemoteLog = async (connectionId: string, logPath: string, follow = false) => {
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) {
        throw new Error(t('remoteLogs.errors.connectionNotFound'));
      }

      setIsFetching(true);
      console.log('获取远程日志:', { connectionId, logPath, follow });
      
      // 如果要实时监控，使用monitor_remote_log命令
      if (follow) {
        console.log('调用monitor_remote_log前:', { 
          credentials: {
            ...connection.credentials,
            // 为安全起见，不输出密码
            ...(connection.credentials.auth_type === 'password' && { 
              auth_type: connection.credentials.auth_type,
              password: '***'
            })
          },
          logPath,
          credentialsType: typeof connection.credentials,
          logPathType: typeof logPath
        });
        
        try {
          const result = await invoke('monitor_remote_log', {
            credentials: connection.credentials,
            logPath: logPath
          });
          
          // 详细记录返回结果
          console.log('monitor_remote_log调用结果:', {
            result,
            resultType: typeof result,
            isNull: result === null,
            isUndefined: result === undefined,
            stringified: JSON.stringify(result),
            time: new Date().toISOString(),
            connectionInfo: {
              id: connectionId,
              name: connection.name,
              host: connection.credentials.host,
              port: connection.credentials.port || 22,
              username: connection.credentials.username,
              authType: connection.credentials.auth_type
            }
          });
          
          // 设置当前文件名，使LogContent组件能够显示内容
          setCurrentFileName(`${connection.name}: ${logPath}`);
          setGlobalFileName(`${connection.name}: ${logPath}`);
          // 初始化内容显示连接中信息
          setContent('正在连接远程服务器并读取日志...');
          setGlobalLogContent('正在连接远程服务器并读取日志...');
          updateMonitoringStatus(connectionId, true, logPath);
          setActiveConnectionId(connectionId);
          return true;
        } catch (error) {
          console.error('monitor_remote_log调用失败:', error);
          notifications.show({
            title: t('remoteLogs.errors.monitoringFailed'),
            message: String(error),
            color: 'red',
          });
          updateConnectionStatus(connectionId, 'error', String(error));
          throw error;
        }
      } else {
        console.log('调用read_remote_log前:', { 
          credentials: {
            ...connection.credentials,
            // 为安全起见，不输出密码
            ...(connection.credentials.auth_type === 'password' && { 
              auth_type: connection.credentials.auth_type,
              password: '***'
            })
          },
          logPath,
          credentialsType: typeof connection.credentials,
          logPathType: typeof logPath
        });
        
        // 否则使用read_remote_log命令一次性获取日志内容
        const result = await invoke<{ content: string, total_lines: number }>('read_remote_log', {
          credentials: connection.credentials,
          logPath: logPath
        });
        
        console.log('获取到的远程日志:', { 
          contentLength: result.content.length, 
          totalLines: result.total_lines 
        });
        
        setContent(result.content);
        setGlobalLogContent(result.content);
        setCurrentFileName(`${connection.name}: ${logPath}`);
        setGlobalFileName(`${connection.name}: ${logPath}`);
        return result;
      }
    } catch (error) {
      console.error('获取远程日志失败:', error);
      notifications.show({
        title: t('remoteLogs.errors.fetchFailed'),
        message: String(error),
        color: 'red',
      });
      throw error;
    } finally {
      setIsFetching(false);
    }
  };

  // 连接到SSH服务器
  const connectToRemoteLog = async (log: RemoteLog) => {
    try {
      setIsConnecting(true);
      console.log('连接到远程日志:', log);
      
      notifications.show({
        title: t('remoteLogs.notifications.connecting'),
        message: t('remoteLogs.notifications.connectingDetail', { name: log.name }),
        color: 'blue',
        loading: true
      });
      
      // 准备SSH凭证
      const sshCredentials: SshCredentials = {
        host: log.host,
        port: log.port || 22,
        username: log.username || '',
        auth_type: log.authType || 'password',
        ...(log.authType === 'password' ? 
          { password: log.password } : 
          { 
            private_key_path: log.privateKeyPath,
            passphrase: log.passphrase
          }
        )
      };
      
      // 创建或更新连接记录
      const existingConnection = connections.find(c => c.id === log.id);
      let currentConnection: RemoteLogConnection;
      
      if (!existingConnection) {
        // 创建新连接记录
        currentConnection = {
          id: log.id,
          name: log.name,
          credentials: sshCredentials,
          status: 'disconnected',
          isMonitoring: false
        };
        
        setConnections(prev => [...prev, currentConnection]);
      } else {
        // 更新现有连接记录
        currentConnection = {
          ...existingConnection,
          credentials: sshCredentials,
          name: log.name
        };
        
        setConnections(prev => prev.map(conn => 
          conn.id === log.id ? currentConnection : conn
        ));
      }
      
      // 测试SSH连接
      await invoke('test_ssh_connection', { credentials: sshCredentials });
      console.log('SSH连接测试成功');
      
      // 开始监控日志文件
      if (log.logFilePath) {
        // 不再依赖connections状态，而是直接使用当前连接对象
        try {
          setIsFetching(true);
          console.log('获取远程日志:', { connectionId: log.id, logPath: log.logFilePath, follow: true });
          
          // 如果要实时监控，使用monitor_remote_log命令
          console.log('调用monitor_remote_log前:', { 
            credentials: {
              ...sshCredentials,
              // 为安全起见，不输出密码
              ...(sshCredentials.auth_type === 'password' && { 
                auth_type: sshCredentials.auth_type,
                password: '***'
              })
            },
            logPath: log.logFilePath,
            credentialsType: typeof sshCredentials,
            logPathType: typeof log.logFilePath
          });
          
          const result = await invoke('monitor_remote_log', {
            credentials: sshCredentials,
            logPath: log.logFilePath
          });
          
          // 详细记录返回结果
          console.log('monitor_remote_log调用结果:', {
            result,
            resultType: typeof result,
            isNull: result === null,
            isUndefined: result === undefined,
            stringified: JSON.stringify(result),
            time: new Date().toISOString(),
            connectionInfo: {
              id: log.id,
              name: log.name,
              host: sshCredentials.host,
              port: sshCredentials.port || 22,
              username: sshCredentials.username,
              authType: sshCredentials.auth_type
            }
          });
          
          // 设置当前文件名，使LogContent组件能够显示内容
          setCurrentFileName(`${log.name}: ${log.logFilePath}`);
          setGlobalFileName(`${log.name}: ${log.logFilePath}`);
          // 初始化内容显示连接中信息
          setContent('正在连接远程服务器并读取日志...');
          setGlobalLogContent('正在连接远程服务器并读取日志...');
          
          // 更新连接状态
          updateMonitoringStatus(log.id, true, log.logFilePath);
          setActiveConnectionId(log.id);
        } catch (error) {
          console.error('monitor_remote_log调用失败:', error);
          notifications.show({
            title: t('remoteLogs.errors.monitoringFailed'),
            message: String(error),
            color: 'red',
          });
          updateConnectionStatus(log.id, 'error', String(error));
          throw error;
        } finally {
          setIsFetching(false);
        }
        
        updateConnectionStatus(log.id, 'connected');
        notifications.show({
          title: t('remoteLogs.notifications.connected'),
          message: t('remoteLogs.notifications.connectedDetail', { name: log.name }),
          color: 'green',
        });
      } else {
        throw new Error(t('remoteLogs.errors.noLogFilePath'));
      }
      
      return true;
    } catch (error) {
      console.error('连接远程日志失败:', error);
      updateConnectionStatus(log.id, 'error', String(error));
      
      notifications.show({
        title: t('remoteLogs.errors.connectionFailed'),
        message: String(error),
        color: 'red',
      });
      
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // 断开远程日志连接
  const disconnectRemoteLog = async (id: string) => {
    try {
      console.log('断开远程日志连接:', id);
      
      const connection = connections.find(conn => conn.id === id);
      if (!connection) {
        throw new Error(t('remoteLogs.errors.connectionNotFound'));
      }
      
      // 如果没有日志路径，则无法断开连接
      if (!connection.logPath) {
        console.warn('无法断开连接，没有日志路径:', id);
        return;
      }
      
      // 停止日志流
      await invoke('stop_log_stream', { id: connection.logPath });
      
      updateConnectionStatus(id, 'disconnected');
      updateMonitoringStatus(id, false);
      
      // 如果当前活跃的连接是被断开的连接，则清理LogContent状态
      if (activeConnectionId === id) {
        setActiveConnectionId(null);
        setGlobalLogContent('');
        setGlobalFileName('');
      }
      
      notifications.show({
        title: t('remoteLogs.notifications.disconnected'),
        message: t('remoteLogs.notifications.disconnectedDetail', { name: connection.name }),
        color: 'blue',
      });
      
      return true;
    } catch (error) {
      console.error('断开远程日志连接失败:', error);
      
      notifications.show({
        title: t('remoteLogs.errors.disconnectionFailed'),
        message: String(error),
        color: 'red',
      });
      
      throw error;
    }
  };

  // 将RemoteLog转换为SshCredentials
  const convertToSshCredentials = (log: RemoteLog): SshCredentials => {
    return {
      host: log.host,
      port: log.port || 22,
      username: log.username || '',
      auth_type: log.authType || 'password',
      ...(log.authType === 'password' ? 
        { password: log.password } : 
        { 
          private_key_path: log.privateKeyPath,
          passphrase: log.passphrase
        }
      )
    };
  };

  // 激活指定连接
  const activateConnection = (id: string) => {
    const connection = connections.find(conn => conn.id === id);
    if (!connection) {
      console.warn('尝试激活不存在的连接:', id);
      return false;
    }
    
    setActiveConnectionId(id);
    
    // 如果已连接且有日志内容，则更新LogContent显示
    if (connection.status === 'connected' && logContent[id]) {
      setGlobalLogContent(logContent[id].join('\n'));
      setGlobalFileName(`${connection.name}: ${connection.logPath}`);
    }
    
    return true;
  };

  return {
    connections,
    activeConnectionId,
    isConnecting,
    isFetching,
    content,
    currentFileName,
    // 导出的方法
    fetchRemoteLog,
    connectToRemoteLog,
    disconnectRemoteLog,
    updateConnectionStatus,
    updateMonitoringStatus,
    activateConnection,
    convertToSshCredentials
  };
}
