import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { AppShell, ActionIcon, Tooltip, Stack } from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
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

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  components: {
    AppShell: {
      styles: (theme) => ({
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

  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <Notifications position="top-right" />
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* 顶部栏 */}
        <div style={{
          height: headerHeight,
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* 左侧 Logo 或标题 */}
          <div style={{ 
            fontWeight: 500,
            fontSize: '16px',
            color: '#228be6'
          }}>
            Log Viewer
          </div>

          {/* 右侧工具栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Tooltip label="通知" position="bottom">
              <ActionIcon variant="subtle" color="gray.7" size="lg">
                <IconBell size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="设置" position="bottom">
              <ActionIcon variant="subtle" color="gray.7" size="lg">
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="用户" position="bottom">
              <ActionIcon variant="subtle" color="gray.7" size="lg">
                <IconUser size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="菜单" position="bottom">
              <ActionIcon variant="subtle" color="gray.7" size="lg">
                <IconMenu2 size={20} />
              </ActionIcon>
            </Tooltip>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div style={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* 工具栏 */}
          <Stack 
            style={{
              width: toolbarWidth,
              backgroundColor: '#fff',
              height: '100%',
              padding: '8px 0',
              alignItems: 'center',
              flexShrink: 0,
              borderRight: '1px solid #e9ecef',
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
                  color="gray.7"
                  size="lg"
                  onClick={item.onClick}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: '#f1f3f5',
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
            borderRight: navbarCollapsed ? 'none' : '1px solid #e9ecef',
            backgroundColor: '#fff',
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
            backgroundColor: '#f8f9fa',
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
                zIndex: 101
              }}
            />
          </div>

          {/* 右侧设置面板 */}
          <div style={{
            width: settingsWidth,
            borderLeft: '1px solid #e9ecef',
            backgroundColor: '#fff',
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
