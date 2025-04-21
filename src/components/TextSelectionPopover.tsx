import { useState, useEffect } from 'react';
import { Popover, ActionIcon, TextInput, Stack, Text, Box, Portal, Group } from '@mantine/core';
import { IconMessageCircle, IconCornerDownLeft } from '@tabler/icons-react';
import { useClickOutside } from '@mantine/hooks';
import { useThemeStore } from '../stores/themeStore';
import { useSidebarStore } from '../stores/sidebarStore';
import { useChatHistoryStore } from '../stores/chatHistoryStore';
import { useUserStore } from '../stores/userStore';
import { fetch } from '@tauri-apps/plugin-http';

interface TextSelectionPopoverProps {
  onSubmit: (text: string) => void;
}

export default function TextSelectionPopover({ onSubmit }: TextSelectionPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useThemeStore();
  const { setActiveSidebar } = useSidebarStore();
  const { 
    addMessage, 
    currentSessionId, 
    setSessionId, 
    activeChatSessionId, 
    createSession 
  } = useChatHistoryStore();
  const { token } = useUserStore();
  
  const popoverRef = useClickOutside(() => {
    if (!isPopoverOpen) {
      setIsVisible(false);
    }
  });

  useEffect(() => {
    let isMouseDown = false;

    const handleMouseDown = (event: any) => {
      if (popoverRef.current?.contains(event?.target as Node)) {
        return;
      }
      isMouseDown = true;
      setIsVisible(false);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) {
        return;
      }
      if (!isMouseDown) return;
      isMouseDown = false;

      requestAnimationFrame(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        // 检查选中的文本是否在 LogContent 组件内
        const logContentElement = document.querySelector('[data-log-content="true"]');
        if (!logContentElement) return;

        let node = selection.anchorNode;
        let isInLogContent = false;
        
        while (node) {
          if (node === logContentElement) {
            isInLogContent = true;
            break;
          }
          node = node.parentNode;
        }

        if (!isInLogContent) return;

        const text = selection.toString().trim();
        if (text) {
          setSelectedText(text);
          setPosition({
            x: e.clientX,
            y: e.clientY - 10
          });
          setIsVisible(true);
          setIsPopoverOpen(false); // 重置 Popover 状态
        }
      });
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 调用真实API
  const simulateAIResponse = async (userMessage: string, selectedText?: string) => {
    setIsThinking(true);
    setError(null);
    
    // 创建一个带超时的fetch请求
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
      // 检查用户是否已登录
      if (!token) {
        throw new Error('请先登录后再使用AI对话功能');
      }
      
      // 确保有活跃会话
      if (!activeChatSessionId) {
        console.log('没有活跃会话，创建新会话');
        createSession();
      }
      
      // 准备请求体
      const requestBody: any = {
        application: "xai",
        // 直接在消息中包含选中的文本
        message: selectedText 
          ? `以下是我选中的日志内容:\n${selectedText}\n\n我的问题是:\n${userMessage}`
          : userMessage
      };
      
      // 如果存在会话ID，添加到请求中
      if (currentSessionId) {
        requestBody.session_id = currentSessionId;
        console.log('使用现有会话ID:', currentSessionId);
      } else {
        console.log('创建新会话');
      }
      
      // 调用真实API
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
        30000 // 30秒超时
      );

      const data = await response.json();
      console.log('AI响应数据:', data);
      
      if (response.ok && data.message) {
        // 如果是第一次对话，保存会话ID
        if (!currentSessionId && data.session_id) {
          console.log('保存新会话ID:', data.session_id);
          setSessionId(data.session_id);
        }
        
        // 添加AI回复
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
      
      // 添加错误消息
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
      console.log('开始提交:', { inputText });
      // 先打开聊天历史窗口
      setActiveSidebar('chat-history');
      console.log('已打开聊天历史窗口');
      
      // 确保有活跃会话
      if (!activeChatSessionId) {
        console.log('没有活跃会话，创建新会话');
        createSession();
      }
      
      // 添加到聊天历史
      addMessage({
        id: Date.now().toString(),
        content: inputText,
        timestamp: new Date(),
        role: 'user',
        selected: selectedText
      });
      
      // 清空输入框
      setInputText('');
      console.log('已清空输入框');
      // 提交内容
      onSubmit(inputText);
      console.log('已提交内容');
      // 关闭弹出窗口
      setIsPopoverOpen(false);
      setIsVisible(false);
      window.getSelection()?.removeAllRanges();
      console.log('已关闭弹出窗口');

      // 触发AI回复，传入选中的文本
      await simulateAIResponse(inputText, selectedText);
    } catch (error) {
      console.error('提交过程中出错:', error);
      setError(error instanceof Error ? error.message : '提交失败');
    }
  };

  if (!isVisible) return null;

  return (
    <Portal>
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: 1000,
        }}
      >
        <Popover
          opened={isPopoverOpen}
          onChange={setIsPopoverOpen}
          position="top"
          withArrow
          shadow="md"
          offset={10}
          trapFocus
          width={300}
          styles={{
            dropdown: {
              padding: '1rem',
              backgroundColor: isDark ? '#25262B' : '#fff',
              border: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
            },
          }}
        >
          <Popover.Target>
            <div>
              <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                radius="xl"
                onClick={(e) => {
                  console.log('点击了主按钮');
                  e.stopPropagation();
                  setIsPopoverOpen(true);
                }}
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transform: isPopoverOpen ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  animation: 'popIn 0.3s ease-out',
                }}
              >
                <IconMessageCircle size={20} />
              </ActionIcon>
            </div>
          </Popover.Target>

          <Popover.Dropdown onClick={(e) => e.stopPropagation()}>
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                已选择的文本：
              </Text>
              <Box
                p="xs"
                style={{
                  backgroundColor: isDark ? '#1A1B1E' : '#f1f3f5',
                  borderRadius: 4,
                  maxHeight: 100,
                  overflow: 'auto'
                }}
              >
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedText}
                </Text>
              </Box>
              
              {/* 输入区域 */}
              <Group gap={4} style={{ width: '100%', position: 'relative' }}>
                <TextInput
                  placeholder={isThinking ? "AI正在思考中..." : "输入你的问题... (按回车发送)"}
                  value={inputText}
                  disabled={isThinking}
                  onChange={(event) => {
                    console.log('输入框值变化:', event.currentTarget.value);
                    setInputText(event.currentTarget.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isThinking) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  style={{ flex: 1 }}
                  rightSection={
                    isThinking ? (
                      <Box 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: 28, 
                          height: 28 
                        }}
                      >
                        <div className="spinner-circle" style={{
                          width: 18,
                          height: 18,
                          border: '2px solid',
                          borderColor: '#1971c2 #e9ecef #e9ecef',
                          borderRadius: '50%',
                          animation: 'spin 1.2s linear infinite'
                        }} />
                      </Box>
                    ) : (
                      <ActionIcon
                        size="md"
                        radius="sm"
                        color="blue"
                        variant="subtle"
                        onClick={handleSubmit}
                        disabled={!inputText.trim() || isThinking}
                      >
                        <IconCornerDownLeft size={18} />
                      </ActionIcon>
                    )
                  }
                />
              </Group>
              
              {/* 错误信息显示 */}
              {error && (
                <Text c="red" size="xs" mt={5}>
                  {error}
                </Text>
              )}
            </Stack>
          </Popover.Dropdown>
        </Popover>

        {/* 使用标准的style标签 */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </Portal>
  );
} 