import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './i18n';
import {MantineProvider, createTheme, AppShell, Stack, Tabs} from '@mantine/core';
import {ActionIcon, Tooltip} from '@mantine/core';
import {
    IconPlugConnected,
    IconFolderOpen,
    IconSearch,
    IconBug,
    IconBell,
    IconUser,
    IconMenu2,
    IconSettings,
    IconAdjustments,
    IconSettings2,
    IconMessage,
    IconServer
} from '@tabler/icons-react';
import FileList from './components/FileList';
import LogContent from './components/LogContent';
import SettingsPanel from './components/SettingsPanel';
import {Notifications} from '@mantine/notifications';
import BottomMenu from './components/BottomMenu';
import {useState, useEffect} from 'react';
import {useThemeStore} from './stores/themeStore';
import {useSidebarStore} from './stores/sidebarStore';
import AppSettingsPanel from './components/AppSettingsPanel';
import ChatHistoryPanel from './components/ChatHistoryPanel';
import RemoteLogsPanel from './components/RemoteLogsPanel';
import LanguageSwitch from './components/LanguageSwitch';
import { useLanguageStore } from './stores/languageStore';
import { useTranslation } from 'react-i18next';
import { ModalsProvider } from '@mantine/modals';

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
    const {isDark} = useThemeStore();
    const {activeSidebar, setActiveSidebar} = useSidebarStore();
    const [activeLeftTab, setActiveLeftTab] = useState<'files' | 'remote'>('files');
    const { t } = useTranslation();
    const { currentLanguage } = useLanguageStore();

    const toolbarWidth = 48;
    const fileNavWidth = navbarCollapsed ? 0 : 260;
    const settingsWidth = 280;

    // 监听语言变化，更新所有需要翻译的文本
    useEffect(() => {
        document.title = t('app.title');
    }, [currentLanguage, t]);

    const toolbarItems = [
        {
            icon: IconFolderOpen,
            tooltip: navbarCollapsed ? t('toolbar.expandSidebar') : t('toolbar.collapseSidebar'),
            onClick: () => setNavbarCollapsed(!navbarCollapsed)
        },
        {icon: IconSearch, tooltip: t('toolbar.search')},
        {
            icon: IconMessage,
            tooltip: t('toolbar.chatHistory'),
            onClick: () => setActiveSidebar(activeSidebar === 'chat-history' ? null : 'chat-history'),
            active: activeSidebar === 'chat-history'
        },
        {
            icon: IconAdjustments,
            tooltip: t('toolbar.displaySettings'),
            onClick: () => setActiveSidebar(activeSidebar === 'settings' ? null : 'settings'),
            active: activeSidebar === 'settings'
        },
        {
            icon: IconSettings2,
            tooltip: t('toolbar.appSettings'),
            onClick: () => setActiveSidebar(activeSidebar === 'app-settings' ? null : 'app-settings'),
            active: activeSidebar === 'app-settings'
        },
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
        <MantineProvider>
            <ModalsProvider>
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
                                        variant={item.active ? "filled" : "subtle"}
                                        color={isDark ? 'gray.4' : 'gray.7'}
                                        size="lg"
                                        onClick={item.onClick}
                                        styles={{
                                            root: {
                                                backgroundColor: item.active ? (isDark ? '#2C2E33' : '#e9ecef') : undefined,
                                                '&:hover': {
                                                    backgroundColor: colors.hover,
                                                }
                                            }
                                        }}
                                    >
                                        <item.icon size={22}/>
                                    </ActionIcon>
                                </Tooltip>
                            ))}
                        </Stack>

                        {/* 左侧导航区域 */}
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
                            }}>
                                <Tabs
                                    value={activeLeftTab}
                                    onChange={(value) => setActiveLeftTab(value as 'files' | 'remote')}
                                    styles={{
                                        root: {
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        },
                                        panel: {
                                            flex: 1,
                                            overflow: 'auto',
                                        },
                                        list: {
                                            backgroundColor: colors.surface,
                                            borderBottom: `1px solid ${colors.border}`,
                                        }
                                    }}
                                >
                                    <Tabs.List>
                                        <Tabs.Tab
                                            style={{
                                                width: '50%',
                                            }}
                                            value="files"
                                            leftSection={<IconFolderOpen size={16}/>}
                                        >
                                            {t('nav.localFiles')}
                                        </Tabs.Tab>
                                        <Tabs.Tab
                                            style={{
                                                width: '50%',
                                            }}
                                            value="remote"
                                            leftSection={<IconServer size={16}/>}
                                        >
                                            {t('nav.remoteLogs')}
                                        </Tabs.Tab>
                                    </Tabs.List>

                                    <Tabs.Panel value="files" p="md">
                                        <FileList/>
                                    </Tabs.Panel>

                                    <Tabs.Panel value="remote" p={0}>
                                        <RemoteLogsPanel/>
                                    </Tabs.Panel>
                                </Tabs>
                            </div>
                        </div>

                        {/* 主内容区域 */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            backgroundColor: colors.background,
                            position: 'relative',
                        }}>
                            <LogContent/>
                            <BottomMenu
                                fileFormat="LOG"
                                fileSize="2.5MB"
                                lineCount={1000}
                                encoding="UTF-8"
                                style={{
                                    position: 'fixed',
                                    bottom: 0,
                                    left: toolbarWidth + fileNavWidth,
                                    right: activeSidebar ? settingsWidth : 0,
                                    transition: 'all 0.3s ease',
                                    zIndex: 101,
                                    backgroundColor: colors.surface,
                                    borderTop: `1px solid ${colors.border}`,
                                }}
                            />
                        </div>

                        {/* 右侧设置面板 */}
                        <div style={{
                            width: activeSidebar ? settingsWidth : 0,
                            borderLeft: activeSidebar ? `1px solid ${colors.border}` : 'none',
                            backgroundColor: colors.surface,
                            overflow: 'hidden',
                            transition: 'width 0.3s ease',
                            flexShrink: 0,
                        }}>
                            {activeSidebar === 'settings' && (
                                <div style={{width: settingsWidth, padding: '12px'}}>
                                    <SettingsPanel/>
                                </div>
                            )}
                            {activeSidebar === 'app-settings' && (
                                <div style={{width: settingsWidth, padding: '12px'}}>
                                    <AppSettingsPanel/>
                                </div>
                            )}
                            {activeSidebar === 'chat-history' && (
                                <div style={{width: settingsWidth}}>
                                    <ChatHistoryPanel/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ModalsProvider>
        </MantineProvider>
    );
}

export default App;
