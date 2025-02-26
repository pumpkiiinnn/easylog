import { useState, useEffect } from 'react';
import { Popover, ActionIcon, TextInput, Stack, Text, Box, Portal, Group } from '@mantine/core';
import { IconMessageCircle, IconCornerDownLeft } from '@tabler/icons-react';
import { useClickOutside } from '@mantine/hooks';
import { useThemeStore } from '../stores/themeStore';
import { useSidebarStore } from '../stores/sidebarStore';
import { useChatHistoryStore } from '../stores/chatHistoryStore';

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
  const { isDark } = useThemeStore();
  const { setActiveSidebar } = useSidebarStore();
  const { addMessage } = useChatHistoryStore();
  
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
    if (inputText.trim()) {
      console.log('开始提交:', { inputText });
      // 先打开聊天历史窗口
      setActiveSidebar('chat-history');
      console.log('已打开聊天历史窗口');
      
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

      // 触发AI回复
      await simulateAIResponse(inputText);
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
                  placeholder="输入你的问题... (按回车发送)"
                  value={inputText}
                  onChange={(event) => {
                    console.log('输入框值变化:', event.currentTarget.value);
                    setInputText(event.currentTarget.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      console.log('按下回车键');
                      handleSubmit();
                    }
                  }}
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa',
                      border: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
                      paddingRight: '40px', // 为图标留出空间
                    }
                  }}
                  autoFocus
                />
                
                {/* 回车提示图标 */}
                <Box 
                  style={{ 
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0.5,
                    pointerEvents: 'none', // 禁用鼠标事件
                  }}
                >
                  <IconCornerDownLeft 
                    size={16}
                    style={{
                      color: isDark ? '#909296' : '#adb5bd',
                    }}
                  />
                </Box>
              </Group>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </div>

      <style>
        {`
          @keyframes popIn {
            from {
              opacity: 0;
              transform: scale(0.8) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </Portal>
  );
} 