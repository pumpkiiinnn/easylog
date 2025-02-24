import { useState, useEffect } from 'react';
import { Popover, ActionIcon, TextInput, Stack, Text, Box, Portal } from '@mantine/core';
import { IconMessageCircle, IconSend } from '@tabler/icons-react';
import { useClickOutside } from '@mantine/hooks';
import { useThemeStore } from '../stores/themeStore';

interface TextSelectionPopoverProps {
  onSubmit: (text: string) => void;
}

export default function TextSelectionPopover({ onSubmit }: TextSelectionPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { isDark } = useThemeStore();
  
  const popoverRef = useClickOutside(() => {
    if (!isPopoverOpen) {
      setIsVisible(false);
    }
  });

  useEffect(() => {
    let isMouseDown = false;

    const handleMouseDown = () => {
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

        // 检查选中的文本是否在日志内容区域内
        const logContentArea = document.querySelector('[data-log-content-area]');
        if (!logContentArea) return;

        const range = selection.getRangeAt(0);
        const selectedNode = range.commonAncestorContainer;
        
        // 检查选中的节点是否在日志内容区域内
        if (!logContentArea.contains(selectedNode)) return;

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

  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit(inputText);
      setInputText('');
      setIsPopoverOpen(false);
      setIsVisible(false);
      window.getSelection()?.removeAllRanges();
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
            <div onClick={(e) => {
              e.stopPropagation();
              setIsPopoverOpen(true);
            }}>
              <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                radius="xl"
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
              <TextInput
                placeholder="输入你的问题..."
                value={inputText}
                onChange={(event) => setInputText(event.currentTarget.value)}
                rightSection={
                  <ActionIcon 
                    variant="subtle" 
                    color="blue" 
                    onClick={handleSubmit}
                    disabled={!inputText.trim()}
                  >
                    <IconSend size={16} />
                  </ActionIcon>
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                autoFocus
                styles={{
                  input: {
                    backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa',
                    border: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
                  }
                }}
              />
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