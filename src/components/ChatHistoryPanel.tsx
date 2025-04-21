import { 
  Stack, 
  Text, 
  Paper, 
  Group, 
  ScrollArea, 
  Box, 
  ActionIcon, 
  Select, 
  Textarea, 
  Tooltip, 
  Modal, 
  CopyButton, 
  Button, 
  Switch,
  Loader,
  Menu,
  Divider,
  TextInput,
  Drawer
} from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import React, { useState, useRef, useEffect } from 'react';
import { useChatHistoryStore } from '../stores/chatHistoryStore';
import {
  IconCheck, 
  IconCopy, 
  IconMessage, 
  IconSend, 
  IconTrash, 
  IconPlus, 
  IconDotsVertical, 
  IconPencil, 
  IconHistory, 
  IconChevronLeft
} from "@tabler/icons-react";
import { useUserStore } from '../stores/userStore';
import { fetch } from '@tauri-apps/plugin-http';

const AI_MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-2', label: 'Claude-2' },
];

export default function ChatHistoryPanel() {
  const { isDark } = useThemeStore();
  const { 
    messages, 
    clearHistory, 
    addMessage, 
    currentSessionId, 
    setSessionId,
    sessions, 
    activeChatSessionId,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession
  } = useChatHistoryStore();
  const { token } = useUserStore();
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [inputText, setInputText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [openedMessageId, setOpenedMessageId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState('');
  
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  
  const activeSession = sessions.find(s => s.id === activeChatSessionId);

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    cardBg: isDark ? '#25262B' : '#fff',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
    modalBg: isDark ? '#1A1B1E' : '#fff',
    inputBg: isDark ? '#25262B' : '#fff',
    userBubble: isDark ? '#228be6' : '#228be6',
    aiBubble: isDark ? '#2C2E33' : '#f1f3f5',
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    } else if (!activeChatSessionId) {
      setActiveSession(sessions[sessions.length - 1].id);
    }
  }, [sessions, activeChatSessionId, createSession, setActiveSession]);

  const formatTime = (date: Date | string | number | null | undefined) => {
    try {
      if (!date) return '未知时间';
      
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // 检查日期是否有效
      if (isNaN(dateObj.getTime())) {
        return '未知时间';
      }
      
      return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '未知时间';
    }
  };

  const formatDate = (date: Date | string | number | null | undefined) => {
    try {
      if (!date) return '未知时间';
      
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // 检查日期是否有效
      if (isNaN(dateObj.getTime())) {
        return '未知时间';
      }
      
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '未知时间';
    }
  };

  const handleMessageClick = (message: any, content: string) => {
    setModalContent(content);
    setOpenedMessageId(message.id);
  };

  const shouldTruncate = (text: string) => text && text.length > 300;

  const getTruncatedText = (text: string) => {
    if (!text) return '';
    if (shouldTruncate(text)) {
      return text.slice(0, 300) + '...';
    }
    return text;
  };

  const getSessionPreview = (session: any) => {
    if (!session.messages || session.messages.length === 0) {
      return '无对话内容';
    }
    
    const lastMessage = session.messages[session.messages.length - 1];
    return getTruncatedText(lastMessage.content).slice(0, 50);
  };

  const handleRenameSession = () => {
    if (!editingSessionId || !newSessionTitle.trim()) return;
    
    renameSession(editingSessionId, newSessionTitle.trim());
    setEditingSessionId(null);
    setNewSessionTitle('');
  };

  const simulateAIResponse = async (userMessage: string) => {
    setIsThinking(true);
    setError(null);
    
    const fetchWithTimeout = async (url: string, options: any, timeout = 30000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };
    
    try {
      if (!token) {
        throw new Error('请先登录后再使用AI对话功能');
      }
      
      const requestBody: any = {
        application: "xai",
        message: userMessage
      };
      
      if (currentSessionId) {
        requestBody.session_id = currentSessionId;
        console.log('使用现有会话ID:', currentSessionId);
      } else {
        console.log('创建新会话');
      }
      
      const response = await fetchWithTimeout(
        'https://myllm.ai-ia.cc/api/chat/completions', 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        },
        30000
      );

      const data = await response.json();
      console.log('AI响应数据:', data);
      
      if (response.ok && data.message) {
        if (!currentSessionId && data.session_id) {
          console.log('保存新会话ID:', data.session_id);
          setSessionId(data.session_id);
        }
        
        addMessage({
          id: Date.now().toString(),
          content: data.message,
          timestamp: new Date(),
          role: 'assistant',
          metadata: {
            model: data.model,
            sessionId: data.session_id,
            usage: data.usage
          }
        });
      } else {
        throw new Error(data.message || '请求失败');
      }
    } catch (error) {
      console.error('调用AI API出错:', error);
      
      let errorMessage = '连接服务器失败';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时，请稍后再试';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      addMessage({
        id: Date.now().toString(),
        content: `请求失败: ${errorMessage}`,
        timestamp: new Date(),
        role: 'assistant'
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || isThinking) return;
    
    try {
      addMessage({
        id: Date.now().toString(),
        content: inputText.trim(),
        timestamp: new Date(),
        role: 'user'
      });
      
      setInputText('');
      
      setIsLoading(true);
      
      await simulateAIResponse(inputText.trim());
      setIsLoading(false);
    } catch (error) {
      console.error('Error in message submission:', error);
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  return (
    <Stack gap={0} h="100%" style={{width: '100%'}}>
      <Group 
        justify="space-between" 
        px="md" 
        py="xs" 
        style={{
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBg,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%'
        }}
      >
        <Group gap="xs">
          <IconMessage size={18} style={{ color: '#228be6' }} />
          <Text fw={500} size="sm" c={colors.text}>
            AI助手
          </Text>
          {currentSessionId && (
            <Text size="xs" c="dimmed" style={{ fontSize: '10px' }}>
              (会话中)
            </Text>
          )}
        </Group>
        <Group gap="xs">
          <Tooltip label="历史对话">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setDrawerOpened(true)}
            >
              <IconHistory size={16} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="新建对话">
            <ActionIcon
              variant="subtle"
              color="blue"
              size="sm"
              onClick={() => {
                createSession();
                setDrawerOpened(false);
              }}
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Tooltip>
          
          {messages.length > 0 && (
            <Tooltip label="清空当前对话">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  clearHistory();
                  console.log('已清空对话历史，重置会话ID');
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <ScrollArea 
        h="calc(100vh - 120px)"
        style={{ 
          backgroundColor: colors.modalBg,
          width: '100%'
        }}
        viewportRef={scrollAreaRef}
        offsetScrollbars
      >
        <Stack gap="lg" p="md" style={{ width: '100%' }}>
          {messages.map((chat, index) => (
            <Box key={index} style={{ width: '100%' }}>
              {chat.selected && (
                <Paper
                  p="xs"
                  mb="xs"
                  style={{
                    backgroundColor: colors.hover,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    width: '100%',
                    wordBreak: 'break-word',
                    cursor: shouldTruncate(chat.selected) ? 'pointer' : 'default',
                  }}
                    //@ts-ignore
                  onClick={() => shouldTruncate(chat.selected) && handleMessageClick(chat, chat.selected)}
                >
                  <Text size="xs" c="dimmed" mb={4}>选中的日志：</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {getTruncatedText(chat.selected)}
                  </Text>
                </Paper>
              )}

              <Paper
                p="xs"
                style={{
                  backgroundColor: chat.role === 'user' ? colors.userBubble : colors.aiBubble,
                  color: chat.role === 'user' ? 'white' : colors.text,
                  borderRadius: '12px',
                  wordBreak: 'break-word',
                  width: 'fit-content',
                  maxWidth: '100%',
                  cursor: shouldTruncate(chat.content) ? 'pointer' : 'default',
                  marginLeft: chat.role === 'user' ? 'auto' : '0',
                }}
                onClick={() => shouldTruncate(chat.content) && handleMessageClick(chat, chat.content)}
              >
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {getTruncatedText(chat.content)}
                </Text>
              </Paper>
              
              <Text 
                size="xs" 
                c="dimmed" 
                mt={4} 
                style={{ 
                  textAlign: chat.role === 'user' ? 'right' : 'left'
                }}
              >
                {formatTime(chat.timestamp)}
              </Text>
            </Box>
          ))}
          
          {isLoading && (
            <Box style={{ 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0'
            }}>
              <Loader size="xs" />
              <Text size="sm" c="dimmed">AI思考中...</Text>
            </Box>
          )}
          
          {error && (
            <Text c="red" size="sm" ta="center" py="xs">
              {error}
            </Text>
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>

      <Drawer
        opened={drawerOpened}
        onClose={() => {
          setDrawerOpened(false);
          setEditingSessionId(null);
          setNewSessionTitle('');
        }}
        title="历史对话"
        position="right"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        size="md"
      >
        <Stack>
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              createSession();
              setDrawerOpened(false);
            }}
            fullWidth
            mb="md"
          >
            新对话
          </Button>
          
          <Divider label="历史记录" labelPosition="center" />
          
          <ScrollArea h="calc(100vh - 200px)" offsetScrollbars>
            <Stack gap="xs">
              {sessions.length === 0 ? (
                <Text ta="center" c="dimmed" py="xl">暂无对话历史</Text>
              ) : (
                sessions.map((session) => (
                  <Box 
                    key={session.id}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      border: `1px solid ${session.id === activeChatSessionId ? '#228be6' : colors.border}`,
                      backgroundColor: session.id === activeChatSessionId ? (isDark ? '#1C2333' : '#E6F7FF') : colors.cardBg,
                      overflow: 'hidden'
                    }}
                  >
                    {editingSessionId === session.id ? (
                      <Group p="xs" style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <TextInput
                          value={newSessionTitle}
                          onChange={(e) => setNewSessionTitle(e.currentTarget.value)}
                          placeholder="AI助手"
                          autoFocus
                          style={{ flex: 1 }}
                        />
                        <Button size="xs" onClick={handleRenameSession}>保存</Button>
                        <Button 
                          size="xs" 
                          variant="subtle" 
                          onClick={() => {
                            setEditingSessionId(null);
                            setNewSessionTitle('');
                          }}
                        >
                          取消
                        </Button>
                      </Group>
                    ) : (
                      <Group 
                        p="xs" 
                        style={{ 
                          borderBottom: `1px solid ${colors.border}`,
                          justifyContent: 'space-between'
                        }}
                      >
                        <Text size="sm" fw={500} c={session.id === activeChatSessionId ? '#228be6' : colors.text}>
                          AI助手
                        </Text>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            {formatDate(session.updatedAt)}
                          </Text>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                deleteSession(session.id);
                              } catch (err) {
                                console.error('删除会话失败:', err);
                              }
                            }}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    )}
                    <Box 
                      p="xs"
                      onClick={() => {
                        setActiveSession(session.id);
                        setDrawerOpened(false);
                      }}
                    >
                      <Text size="xs" lineClamp={2} c={session.id === activeChatSessionId ? undefined : 'dimmed'}>
                        {getSessionPreview(session)}
                      </Text>
                    </Box>
                  </Box>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Drawer>

      <Modal
        opened={openedMessageId !== null}
        onClose={() => setOpenedMessageId(null)}
        title="消息详情"
        size="lg"
        padding="md"
        styles={{
          title: {
            fontSize: '18px',
            fontWeight: 600,
          },
          body: {
            padding: '20px',
          },
        }}
      >
        <Stack>
          <Box
            style={{
              backgroundColor: colors.inputBg,
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {modalContent}
            </Text>
          </Box>
          <Group justify="flex-end">
            <CopyButton value={modalContent}>
              {({ copied, copy }) => (
                <Button
                  color={copied ? 'teal' : 'blue'}
                  onClick={copy}
                  leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                >
                  {copied ? '已复制' : '复制内容'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Stack>
      </Modal>

      <Box>
        <Box
          style={{
            backgroundColor: colors.cardBg,
            padding: '0px 16px 8px',
            position: 'sticky',
            bottom: 32,
            width: '100%'
          }}
        >
          <Stack gap={0}>
            <Group align="flex-end" gap="sm" style={{ width: '100%', marginBottom: 1 }}>
              <Box style={{ flex: 1 }}>
                <Textarea
                  placeholder={isThinking ? "AI正在思考中..." : "Shift + Enter 换行"}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  disabled={isThinking}
                  styles={{
                    input: {
                      backgroundColor: colors.inputBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      resize: 'none',
                      overflow: 'hidden',
                      marginBottom: 0,
                      '&:focus': {
                        borderColor: '#228be6',
                      }
                    },
                    wrapper: {
                      width: '100%',
                      marginBottom: 0
                    }
                  }}
                  minRows={1}
                  maxRows={4}
                  autosize
                />
              </Box>
              <Tooltip label={isThinking ? "AI思考中" : "发送消息"}>
                <ActionIcon
                  variant="filled"
                  color="blue"
                  size="lg"
                  radius="xl"
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isThinking}
                  style={{
                    marginBottom: '1px',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Group justify="flex-start" gap="xs" style={{ marginLeft: 4, marginTop: -1 }}>
              <Select
                size="xs"
                value={selectedModel}
                onChange={(value) => setSelectedModel(value || 'gpt-3.5-turbo')}
                data={AI_MODELS}
                variant="unstyled"
                styles={{
                  root: {
                    width: 'auto'
                  },
                  input: {
                    color: isDark ? '#909296' : '#868e96',
                    fontWeight: 500,
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '0',
                    height: '18px',
                    lineHeight: '18px',
                    '&:hover': {
                      color: isDark ? '#C1C2C5' : '#495057',
                    }
                  }
                }}
              />
              <Switch
                size="xs"
                label="MCP"
                labelPosition="left"
                styles={{
                  label: {
                    fontSize: '11px',
                    color: isDark ? '#909296' : '#868e96',
                    paddingRight: 4
                  },
                  track: {
                    width: '24px',
                    height: '14px'
                  },
                  thumb: {
                    width: '10px',
                    height: '10px'
                  }
                }}
              />
            </Group>
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}