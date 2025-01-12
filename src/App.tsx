import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { AppShell } from '@mantine/core';
import FileList from './components/FileList';
import LogContent from './components/LogContent';
import SettingsPanel from './components/SettingsPanel';
import { Notifications } from '@mantine/notifications';
import BottomMenu from './components/BottomMenu';

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
  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <Notifications position="top-right" />
      <AppShell
        padding={0}
        navbar={{
          width: 260,
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
          root: { height: '100vh' },
          main: { 
            padding: '0 !important',
            backgroundColor: '#f8f9fa',
          }
        }}
      >
        <AppShell.Navbar p="xs" style={{ 
          borderRight: '1px solid #e9ecef',
          backgroundColor: '#fff'
        }}>
          <FileList />
        </AppShell.Navbar>

        <AppShell.Main>
          <LogContent />
        </AppShell.Main>

        <AppShell.Aside p="xs" style={{ 
          borderLeft: '1px solid #e9ecef',
          backgroundColor: '#fff'
        }}>
          <SettingsPanel />
        </AppShell.Aside>

        <BottomMenu
          fileFormat="LOG"
          fileSize="2.5MB"
          lineCount={1000}
          encoding="UTF-8"
        />
      </AppShell>
    </MantineProvider>
  );
}

export default App;
