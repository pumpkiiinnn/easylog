import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { AppShell, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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

  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <Notifications position="top-right" />
      <AppShell
        padding={0}
        navbar={{
          width: navbarCollapsed ? 50 : 260,
          breakpoint: 'sm',
          collapsed: { mobile: false },
        }}
        aside={{
          width: 280,
          breakpoint: 'sm',
          collapsed: { mobile: false },
        }}
        layout="default"
        styles={{
          root: { 
            height: '100vh',
            overflow: 'hidden'
          },
          main: { 
            padding: '0 !important',
            backgroundColor: '#f8f9fa',
          }
        }}
      >
        <AppShell.Navbar
          p="xs" 
          style={{ 
            borderRight: '1px solid #e9ecef',
            backgroundColor: '#fff',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            width: navbarCollapsed ? 50 : 260,
          }}
        >
          <ActionIcon
            variant="subtle"
            size="md"
            style={{
              position: 'absolute',
              right: navbarCollapsed ? 12 : -16,
              top: 20,
              zIndex: 10,
              backgroundColor: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '50%'
            }}
            onClick={() => setNavbarCollapsed(!navbarCollapsed)}
          >
            {navbarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </ActionIcon>
          <div style={{
            opacity: navbarCollapsed ? 0 : 1,
            transition: 'opacity 0.3s ease',
            visibility: navbarCollapsed ? 'hidden' : 'visible',
            width: 260,
          }}>
            <FileList />
          </div>
        </AppShell.Navbar>

        <AppShell.Main>
          <LogContent />
        </AppShell.Main>

        <AppShell.Aside 
          p="xs" 
          style={{ 
            borderLeft: '1px solid #e9ecef',
            backgroundColor: '#fff',
            overflow: 'auto'
          }}
        >
          <SettingsPanel />
        </AppShell.Aside>

        <BottomMenu
          fileFormat="LOG"
          fileSize="2.5MB"
          lineCount={1000}
          encoding="UTF-8"
          style={{
            position: 'fixed',
            bottom: 0,
            left: navbarCollapsed ? 50 : 260,
            right: 280,
            transition: 'left 0.3s ease',
            zIndex: 101
          }}
        />
      </AppShell>
    </MantineProvider>
  );
}

export default App;
