import { Stack, Text, Paper, Group, ScrollArea, Box, ActionIcon, Modal, Button } from '@mantine/core';
import { useThemeStore } from '../stores/themeStore';
import { IconMessage, IconClock, IconTrash, IconMaximize } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  content: string;
  timestamp: Date;
  selected: string;
  response: string;  // 添加完整的AI响应
}

// 模拟对话历史数据，实际应从状态管理获取
const chatHistory: ChatMessage[] = [
  {
    content: "这段日志显示了一个严重的内存泄漏问题，建议检查内存分配和释放的逻辑。可能存在资源未正确释放的情况，建议：\n1. 检查对象生命周期\n2. 使用内存分析工具\n3. 查看资源释放点",
    timestamp: new Date(2024, 2, 15, 14, 30),
    selected: "Error: memory leak detected in process 1234, current usage: 2.5GB, threshold: 1GB\nStack trace:\n  at MemoryManager.allocate (memory.js:123)\n  at ObjectPool.create (pool.js:45)",
    response: "根据日志分析，这是一个典型的内存泄漏问题。具体表现为：\n\n1. 当前内存使用量(2.5GB)远超阈值(1GB)\n2. 问题出现在 MemoryManager.allocate 方法\n3. 涉及 ObjectPool 的对象创建\n\n建议排查方向：\n1. 检查 ObjectPool.create 中的对象是否有正确的销毁机制\n2. 验证 MemoryManager.allocate 的内存分配策略\n3. 考虑添加内存使用监控和自动回收机制"
  },
  {
    content: "根据日志分析，这是一个数据库连接超时，可能是由于连接池配置不当或数据库负载过高导致。建议检查数据库连接池的配置和数据库服务器状态。",
    timestamp: new Date(2024, 2, 15, 10, 20),
    selected: "Database connection timeout after 30s\nConnection pool: 10/10 used\nQuery: SELECT * FROM large_table WHERE timestamp > ?",
    response: "分析发现以下问题：\n\n1. 连接池已满(10/10)\n2. 查询可能未优化(大表全量扫描)\n3. 超时时间可能过短(30s)\n\n建议优化方案：\n1. 增加连接池容量\n2. 优化查询语句，添加索引\n3. 调整超时时间配置"
  },
];

export default function ChatHistoryPanel() {
  const { isDark } = useThemeStore();
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const { t } = useTranslation();

  const colors = {
    border: isDark ? '#2C2E33' : '#e9ecef',
    cardBg: isDark ? '#25262B' : '#fff',
    text: isDark ? '#C1C2C5' : '#495057',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
    modalBg: isDark ? '#1A1B1E' : '#fff',
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" px="md" py="xs">
          <Text fw={500} size="sm" c={colors.text}>
            <IconMessage size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {t('chatHistory.title')}
          </Text>
        </Group>

        <ScrollArea h="calc(100vh - 120px)" type="hover" offsetScrollbars>
          <Stack gap="md" px="md">
            {chatHistory.map((chat, index) => (
              <Paper
                key={index}
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
                onClick={() => setSelectedChat(chat)}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <IconClock size={14} color={colors.text} />
                    <Text size="xs" c="dimmed">
                      {formatTime(chat.timestamp)}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChat(chat);
                      }}
                    >
                      <IconMaximize size={14} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="subtle" 
                      color="red" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 处理删除
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Box mb="xs">
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {t('chatHistory.selected')}: {chat.selected}
                  </Text>
                </Box>

                <Text size="sm" c={colors.text} lineClamp={3}>
                  {chat.content}
                </Text>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>

      <Modal
        opened={!!selectedChat}
        onClose={() => setSelectedChat(null)}
        size="lg"
        title={
          <Group gap="xs">
            <IconClock size={16} />
            <Text>{selectedChat && formatTime(selectedChat.timestamp)}</Text>
          </Group>
        }
        styles={{
          content: {
            backgroundColor: colors.modalBg,
          },
          header: {
            backgroundColor: colors.modalBg,
            borderBottom: `1px solid ${colors.border}`,
          },
          title: {
            color: colors.text,
          },
          root: {
            zIndex: 300,
          },
          inner: {
            padding: '20px',
          },
          body: {
            backgroundColor: colors.modalBg,
          }
        }}
        overlayProps={{
          opacity: 0.7,
          color: isDark ? '#000' : '#fff',
          blur: 0,
        }}
        radius="md"
        centered
      >
        <Stack gap="md">
          <Paper 
            p="md" 
            radius="md"
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Text size="sm" fw={500} c={colors.text} mb="xs">
              {t('chatHistory.selected')}:
            </Text>
            <Text 
              size="sm" 
              c={colors.text}
              style={{ 
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                padding: '8px',
                backgroundColor: isDark ? '#1A1B1E' : '#f8f9fa',
                borderRadius: '4px',
              }}
            >
              {selectedChat?.selected}
            </Text>
          </Paper>

          <Paper 
            p="md"
            radius="md"
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Text size="sm" fw={500} c={colors.text} mb="xs">
              {t('chatHistory.aiResponse')}:
            </Text>
            <Text 
              size="sm" 
              c={colors.text}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {selectedChat?.response}
            </Text>
          </Paper>
        </Stack>
      </Modal>
    </>
  );
} 