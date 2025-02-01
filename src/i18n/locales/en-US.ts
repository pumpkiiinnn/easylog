export default {
  common: {
    search: 'Search',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    save: 'Save',
  },
  nav: {
    localFiles: 'Local Files',
    remoteLogs: 'Remote Logs',
    settings: 'Display Settings',
    appSettings: 'App Settings',
    chatHistory: 'Chat History',
  },
  toolbar: {
    expandSidebar: 'Expand Sidebar',
    collapseSidebar: 'Collapse Sidebar',
    search: 'Search',
    chatHistory: 'Chat History',
    displaySettings: 'Display Settings',
    appSettings: 'App Settings',
  },
  remoteLogs: {
    title: 'Remote Logs',
    addConnection: 'Add Connection',
    categories: {
      server: 'Server',
      middleware: 'Middleware',
      database: 'Database',
      custom: 'Custom',
    },
    types: {
      ssh: 'SSH Server',
      kafka: 'Kafka',
      redis: 'Redis',
      elasticsearch: 'Elasticsearch',
      mongodb: 'MongoDB',
      mysql: 'MySQL',
      custom: 'Custom',
    },
    form: {
      type: 'Connection Type',
      name: 'Name',
      host: 'Host',
      sshKey: 'SSH Key Path',
      username: 'Username',
      password: 'Password',
      selectType: 'Select Type',
      inputName: 'Enter connection name',
      inputHost: 'Enter host address',
      inputSshKey: 'Enter SSH key path',
      inputUsername: 'Enter username',
      inputPassword: 'Enter password',
    },
    status: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      error: 'Error',
    },
    defaultNames: {
      productionServer: 'Production Server',
      messageQueue: 'Message Queue',
      logStorage: 'Log Storage',
    },
  },
  chatHistory: {
    title: 'Chat History',
    selected: 'Selected',
    aiResponse: 'AI Analysis',
    time: '{time}',
  },
  fileList: {
    openFile: 'Open File',
    openFolder: 'Open Folder',
    recentFiles: 'Recent Files',
    noFiles: 'No Files',
    dragTip: 'Drop files here',
    filters: {
      name: 'Log Files',
      extensions: ['log', 'txt', 'json']
    },
    errors: {
      readError: 'Failed to read file: {{error}}',
      noSelection: 'No file selected',
    }
  },
  logContent: {
    dragToStart: 'Drop log file to start',
    dropToOpen: 'Release to open file',
    supportedFiles: 'Supports .log and .txt files',
    refresh: 'Refresh',
    export: 'Export',
    searchPlaceholder: 'Search log content...',
    errors: {
      invalidType: 'Invalid File Type',
      validFileTypes: 'Please drop .log, .txt, or .json files',
      readError: 'Failed to read file: {{error}}',
    },
  },
  settings: {
    displaySettings: 'Display Settings',
    theme: {
      title: 'Theme',
      light: 'Light',
      dark: 'Dark',
      darkMode: 'Dark Mode',
      darkModeDescription: 'Toggle dark/light theme',
    },
    autoRefresh: 'Auto Refresh',
    autoRefreshDescription: 'Refresh log content every 5 seconds',
    autoScroll: 'Auto Scroll',
    autoScrollDescription: 'Automatically scroll to latest logs',
    fontSize: 'Font Size',
    lineHeight: 'Line Height',
    language: {
      title: 'Language',
      current: 'Current Language',
    },
    subscription: {
      title: 'Subscription',
      upgrade: 'Upgrade',
    },
    aiModel: {
      title: 'AI Model',
    },
    logColors: {
      error: 'Error Color',
      warning: 'Warning Color',
      info: 'Info Color',
      debug: 'Debug Color',
      trace: 'Trace Color'
    }
  },
  bottomMenu: {
    format: 'Format',
    size: 'Size',
    lines: 'Lines',
    encoding: 'Encoding',
  },
}; 