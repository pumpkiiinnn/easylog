import { listen } from '@tauri-apps/api/event';
import { useState, useEffect, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useLogContentStore } from '../stores/logContentStore';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import type { UnlistenFn } from '@tauri-apps/api/event';

// 全局变量，用于跟踪事件监听器是否已设置
let isListenerSetup = false;

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
  // 使用 useRef 存储最新的状态值，避免事件监听器中的闭包问题
  const connectionsRef = useRef<RemoteLogConnection[]>([]);
  const activeConnectionIdRef = useRef<string | null>(null);

  const [connections, setConnections] = useState<RemoteLogConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [content, setContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<{[key: string]: string[]}>({});
  
  const { setLogContent: setGlobalLogContent, setCurrentFileName: setGlobalFileName } = useLogContentStore();
  const { t } = useTranslation();

  // 同步 ref 值
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);
  
  useEffect(() => {
    activeConnectionIdRef.current = activeConnectionId;
  }, [activeConnectionId]);
  
  // 设置事件监听器
  useEffect(() => {
    // 如果已经设置过监听器，则直接返回
    if (isListenerSetup) {
      console.log('事件监听器已经设置，跳过重复设置');
      return;
    }
    
    // 标记监听器已设置
    isListenerSetup = true;
    
    const unlisteners: UnlistenFn[] = [];
    
    const setupListeners = async () => {
      try {
        console.log('设置远程日志事件监听器...');
        
        // 监听SSH连接状态
        const connectionStatusListener = await listen('ssh-connection-status', (event: any) => {
          const { id, connected, message } = event.payload;
          
          console.log('SSH连接状态事件:', { id, connected, message });
          
          updateConnectionStatus(id, connected ? 'connected' : 'error', message);
          
          if (connected) {
            notifications.show({
              title: t('remoteLogs.notification.connected'),
              message: t('remoteLogs.notification.connectedDetail', { 
                name: connectionsRef.current.find(c => c.id === id)?.name || id 
              }),
              color: 'green',
              autoClose: 3000 // 3秒后自动关闭
            });
          } else {
            notifications.show({
              title: t('remoteLogs.notification.error'),
              message: message || t('remoteLogs.notification.connectionError'),
              color: 'red',
              autoClose: 3000 // 3秒后自动关闭
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
          if (activeConnectionIdRef.current) {
            updateConnectionStatus(activeConnectionIdRef.current, 'connected');
            updateMonitoringStatus(activeConnectionIdRef.current, true, logPath);
          }
        });
        unlisteners.push(logConnectedListener);
        
        // 监听SSH日志断开连接
        const logDisconnectedListener = await listen('ssh-log-disconnected', (event: any) => {
          const logPath = event.payload;
          console.log('SSH日志连接断开:', logPath);
          
          // 查找匹配的连接并更新其状态
          connectionsRef.current.forEach(conn => {
            if (conn.logPath === logPath) {
              updateConnectionStatus(conn.id, 'disconnected');
              updateMonitoringStatus(conn.id, false);
            }
          });
        });
        unlisteners.push(logDisconnectedListener);
        
        // 监听SSH日志数据
        const logDataListener = await listen('ssh-log-data', (event: any) => {
          const { content: logContent, source } = event.payload;
          console.log('收到SSH日志数据:', { source, contentLength: logContent?.length });
          
          if (!source || !logContent) {
            console.warn('收到无效的日志数据:', event.payload);
            return;
          }
          
          // 查找与日志路径匹配的连接
          const connection = connectionsRef.current.find(conn => conn.logPath === source);
          if (!connection) {
            console.warn('找不到匹配的连接:', source);
            return;
          }
          
          // 更新内部日志状态
          setLogContent(prev => {
            const prevContent = prev[connection.id] || [];
            const newContent = [...prevContent, logContent];
            
            // 如果是当前活跃的连接，则更新LogContent组件
            if (connection.id === activeConnectionIdRef.current) {
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
            title: t('remoteLogs.notification.error'),
            message: errorMessage,
            color: 'red',
            autoClose: 3000 // 3秒后自动关闭
          });
          
          // 如果有活跃连接，更新其状态为错误
          if (activeConnectionIdRef.current) {
            updateConnectionStatus(activeConnectionIdRef.current, 'error', errorMessage);
            updateMonitoringStatus(activeConnectionIdRef.current, false);
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
      console.log('清理远程日志事件监听器...');
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []); // 空依赖数组，确保事件监听器只注册一次

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
      const connection = connectionsRef.current.find(conn => conn.id === connectionId);
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
            title: t('remoteLogs.notification.error'),
            message: String(error),
            color: 'red',
            autoClose: 3000 // 3秒后自动关闭
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
        title: t('remoteLogs.notification.error'),
        message: String(error),
        color: 'red',
        autoClose: 3000 // 3秒后自动关闭
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
      
      // notifications.show({
      //   title: t('remoteLogs.notification.connecting'),
      //   message: t('remoteLogs.notification.connectingDetail', { name: log.name }),
      //   color: 'blue',
      //   loading: true,
      //   autoClose: 3000 // 3秒后自动关闭
      // });
      
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
      const existingConnection = connectionsRef.current.find(c => c.id === log.id);
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
          status: 'disconnected'
        };
        
        setConnections(prev => 
          prev.map(c => c.id === log.id ? currentConnection : c)
        );
      }
      
      // 清空之前的日志内容
      clearConnectionLogs(log.id);
      
      // 设置为活跃连接
      setActiveConnectionId(log.id);
      
      // 获取日志路径
      const logPath = log.logFilePath || '/var/log/syslog';
      
      // 更新连接状态
      updateConnectionStatus(log.id, 'connected');
      updateMonitoringStatus(log.id, true);
      
      // 保存日志路径到连接记录
      setConnections(prev => 
        prev.map(c => c.id === log.id ? { ...c, logPath } : c)
      );
      
      // 调用Rust函数开始监控日志
      await invoke('monitor_remote_log', {
        credentials: sshCredentials,
        logPath
      });
      
      // 连接成功
      notifications.show({
        title: t('remoteLogs.notification.connected'),
        message: t('remoteLogs.notification.connectedDetail', { name: log.name }),
        color: 'green',
        autoClose: 3000 // 3秒后自动关闭
      });
      
      return true;
    } catch (error) {
      console.error('连接到远程日志失败:', error);
      
      // 更新连接状态为错误
      updateConnectionStatus(log.id, 'error', String(error));
      updateMonitoringStatus(log.id, false);
      
      notifications.show({
        title: t('remoteLogs.notification.error'),
        message: String(error),
        color: 'red',
        autoClose: 3000 // 3秒后自动关闭
      });
      
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // 清空指定连接的日志内容
  const clearConnectionLogs = (id: string) => {
    setLogContent(prev => {
      const newLogContent = { ...prev };
      delete newLogContent[id];
      return newLogContent;
    });
  };

  // 断开远程日志连接
  const disconnectRemoteLog = async (id: string) => {
    try {
      console.log('断开远程日志连接:', id);
      
      const connection = connectionsRef.current.find(conn => conn.id === id);
      if (!connection) {
        throw new Error(t('remoteLogs.errors.connectionNotFound'));
      }
      
      // 如果没有日志路径，则无法断开连接
      if (!connection.logPath) {
        console.warn('无法断开连接，没有日志路径:', id);
        return;
      }
      
      // 停止日志流 - 修复参数，传递 host 和 port
      await invoke('stop_log_stream', { 
        host: connection.credentials.host,
        port: connection.credentials.port
      });
      
      // 清空该连接的日志内容
      clearConnectionLogs(id);
      
      updateConnectionStatus(id, 'disconnected');
      updateMonitoringStatus(id, false);
      
      // 如果当前活跃的连接是被断开的连接，则清理LogContent状态
      if (activeConnectionIdRef.current === id) {
        setActiveConnectionId(null);
        setGlobalLogContent('');
        setGlobalFileName('');
      }
      
      notifications.show({
        title: t('remoteLogs.notification.disconnected'),
        message: t('remoteLogs.notification.disconnectedDetail', { name: connection.name }),
        color: 'blue',
        autoClose: 3000 // 3秒后自动关闭
      });
      
      return true;
    } catch (error) {
      console.error('断开远程日志连接失败:', error);
      
      notifications.show({
        title: t('remoteLogs.notification.error'),
        message: String(error),
        color: 'red',
        autoClose: 3000 // 3秒后自动关闭
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
    const connection = connectionsRef.current.find(conn => conn.id === id);
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
