import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme, AppShell } from '@mantine/core';
import { ActionIcon, Tooltip, Stack } from '@mantine/core';
import { 
  IconPlugConnected,
  IconFolderOpen, 
  IconSearch, 
  IconBug,
  IconBell,
  IconUser,
  IconMenu2,
  IconSettings
} from '@tabler/icons-react';
import FileList from './components/FileList';
import LogContent from './components/LogContent';
import SettingsPanel from './components/SettingsPanel';
import { Notifications } from '@mantine/notifications';
import BottomMenu from './components/BottomMenu';
import { useState } from 'react';
import { useThemeStore } from './stores/themeStore';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  components: {
    AppShell: {
      styles: (theme: any) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : '#f8f9fa',
        },
      }),
    },
    Button: {
      styles: {
        root: {
          fontWeight: 400,
        }
      }
    }
  },
});

function App() {
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const { isDark } = useThemeStore();
  
  const toolbarWidth = 48; // 工具栏宽度
  const fileNavWidth = navbarCollapsed ? 0 : 260; // 文件导航栏宽度
  const settingsWidth = 280; // 右侧设置面板宽度
  const headerHeight = 48; // 顶部栏高度

  const toolbarItems = [
    { icon: IconPlugConnected, tooltip: '插件' },
    { 
      icon: IconFolderOpen, 
      tooltip: navbarCollapsed ? '展开资源管理器' : '收起资源管理器',
      onClick: () => setNavbarCollapsed(!navbarCollapsed)
    },
    { icon: IconSearch, tooltip: '搜索' },
    { icon: IconBug, tooltip: '调试' },
  ];

  // 定义深色和浅色主题的颜色
  const colors = {
    background: isDark ? '#1A1B1E' : '#f8f9fa',
    surface: isDark ? '#25262B' : '#fff',
    border: isDark ? '#2C2E33' : '#e9ecef',
    text: isDark ? '#C1C2C5' : '#495057',
    textDimmed: isDark ? '#909296' : '#868e96',
    hover: isDark ? '#2C2E33' : '#f1f3f5',
  };

  return (
    <MantineProvider
      theme={{
        colorScheme: isDark ? 'dark' : 'light',
      }}
      withNormalizeCSS
    >
      <Notifications />
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: colors.background,
        color: colors.text,
      }}>
        <div style={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* 工具栏 */}
          <Stack 
            style={{
              width: toolbarWidth,
              backgroundColor: colors.surface,
              height: '100%',
              padding: '8px 0',
              alignItems: 'center',
              flexShrink: 0,
              borderRight: `1px solid ${colors.border}`,
            }}
            gap={8}
          >
            {toolbarItems.map((item, index) => (
              <Tooltip
                key={index}
                label={item.tooltip}
                position="right"
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  color={isDark ? 'gray.4' : 'gray.7'}
                  size="lg"
                  onClick={item.onClick}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: colors.hover,
                      }
                    }
                  }}
                >
                  <item.icon size={22} />
                </ActionIcon>
              </Tooltip>
            ))}
          </Stack>

          {/* 文件导航区域 */}
          <div style={{
            width: fileNavWidth,
            borderRight: navbarCollapsed ? 'none' : `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}>
            <div style={{
              opacity: navbarCollapsed ? 0 : 1,
              transition: 'opacity 0.3s ease',
              visibility: navbarCollapsed ? 'hidden' : 'visible',
              width: 260,
              padding: '12px'
            }}>
              <FileList />
            </div>
          </div>

          {/* 主内容区域 */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: colors.background,
            position: 'relative',
          }}>
            <LogContent />
            <BottomMenu
              fileFormat="LOG"
              fileSize="2.5MB"
              lineCount={1000}
              encoding="UTF-8"
              style={{
                position: 'fixed',
                bottom: 0,
                left: toolbarWidth + fileNavWidth,
                right: settingsWidth,
                transition: 'left 0.3s ease',
                zIndex: 101,
                backgroundColor: colors.surface,
                borderTop: `1px solid ${colors.border}`,
              }}
            />
          </div>

          {/* 右侧设置面板 */}
          <div style={{
            width: settingsWidth,
            borderLeft: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            overflow: 'auto',
            padding: '12px',
            flexShrink: 0,
          }}>
            <SettingsPanel />
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}

export default App;
