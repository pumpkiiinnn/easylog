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
  Avatar, 
  Switch,
  Loader
} from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatHistoryStore } from '../stores/chatHistoryStore';
import {IconCheck, IconCopy, IconMessage, IconRobot, IconSend, IconTrash, IconUser} from "@tabler/icons-react";

const AI_MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-2', label: 'Claude-2' },
];

export default function ChatHistoryPanel() {
  const { isDark } = useThemeStore();
  const { messages, clearHistory, addMessage } = useChatHistoryStore();
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [inputText, setInputText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [openedMessageId, setOpenedMessageId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState('');

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

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 处理消息点击
  const handleMessageClick = (message: any, content: string) => {
    setModalContent(content);
    setOpenedMessageId(message.id);
  };

  // 判断是否需要省略
  const shouldTruncate = (text: string) => text && text.length > 300;

  // 获取省略后的文本
  const getTruncatedText = (text: string) => {
    if (!text) return '';
    if (shouldTruncate(text)) {
      return text.slice(0, 300) + '...';
    }
    return text;
  };

  // 模拟AI回复
  const simulateAIResponse = async (userMessage: string) => {
    setIsThinking(true);
    
    try {
      // 随机等待1-3秒
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // 模拟的回复内容
      const responses = [
        "我已经分析了您提供的日志内容。这看起来是一个常见的问题，建议检查系统配置。",
        "根据日志显示，这可能是网络连接问题导致的。建议检查网络状态和防火墙设置。",
        "从日志来看，似乎是应用程序在高负载情况下的性能问题。建议优化相关代码或增加资源配置。",
        "这个错误日志表明可能存在内存泄漏。建议检查相关组件的资源释放情况。",
        "日志中显示的错误模式比较典型，可能是配置文件的权限问题导致的。"
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      // 添加AI回复
      addMessage({
        id: Date.now().toString(),
        content: response,
        timestamp: new Date(),
        role: 'assistant'
      });
    } catch (error) {
      console.error('Error in AI response:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || isThinking) return;
    
    try {
      // 添加用户消息
      addMessage({
        id: Date.now().toString(),
        content: inputText.trim(),
        timestamp: new Date(),
        role: 'user'
      });
      
      setInputText('');
      
      setIsLoading(true);
      
      // 触发AI回复
      await simulateAIResponse(inputText.trim());
      setIsLoading(false);
    } catch (error) {
      console.error('Error in message submission:', error);
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果正在输入法编辑，不处理任何快捷键
    if (isComposing) return;

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter 换行，保持默认行为
        return;
      } else {
        // Enter 发送消息
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  return (
    <Stack gap={0} h="100%" style={{width: '100%'}}>
      {/* 顶部标题栏 */}
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
            AI 助手
          </Text>
        </Group>
        {messages.length > 0 && (
          <Tooltip label="清空历史记录">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => clearHistory()}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* 消息列表区域 */}
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
              {/* 如果有选中的文本，显示在消息前面 */}
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
                  onClick={() => shouldTruncate(chat.selected) && handleMessageClick(chat, chat.selected)}
                >
                  <Text size="xs" c="dimmed" mb={4}>选中的日志：</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {getTruncatedText(chat.selected)}
                  </Text>
                </Paper>
              )}

              {/* 消息内容 */}
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
              
              {/* 时间戳 */}
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
          
          {/* 加载动画 */}
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
          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>

      {/* 消息详情弹窗 */}
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

      {/* 底部输入区域 */}
      <Box>
        {/* 输入框区域 */}
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

            {/* 模型选择和MCP开关 */}
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