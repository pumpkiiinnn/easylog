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
    search: 'Search connections...',
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
      title: 'Add Remote Connection',
      type: 'Connection Type',
      name: 'Name',
      host: 'Host',
      port: 'Port',
      sshKey: 'SSH Key Path',
      username: 'Username',
      password: 'Password',
      authType: 'Authentication Type',
      passwordAuth: 'Password Authentication',
      keyAuth: 'Key Authentication',
      privateKey: 'Private Key',
      privateKeyPath: 'Private Key Path',
      passphrase: 'Passphrase',
      logFilePath: 'Log File Path',
      selectType: 'Select Type',
      selectAuthType: 'Select Authentication Type',
      inputName: 'Enter connection name',
      inputHost: 'Enter host address',
      inputSshKey: 'Enter SSH key path',
      inputUsername: 'Enter username',
      inputPassword: 'Enter password',
      inputPrivateKeyPath: 'Enter private key path',
      inputPassphrase: 'Enter passphrase (optional)',
      inputPort: 'Enter port (default: 22)',
      inputLogFilePath: 'Enter log file path',
      editTitle: 'Edit Remote Connection',
      addTitle: 'Add Remote Connection',
    },
    status: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      error: 'Error',
      connecting: 'Connecting',
    },
    notification: {
      success: 'Success',
      error: 'Error',
      info: 'Information',
      connected: 'Connected',
      connectedDetail: 'Successfully connected to {{name}}',
      connecting: 'Connecting',
      connectingDetail: 'Establishing connection to {{name}}...',
      disconnected: 'Disconnected',
      disconnectedDetail: 'Connection to {{name}} has been closed',
      connectionError: 'Connection error',
      authError: 'Authentication error',
    },
    content: {
      title: 'Log Content',
      empty: 'No remote connections yet. Add one to get started.',
      loading: 'Loading logs...',
      noSearchResults: 'No connections match your search. Try another query.'
    },
    actions: {
      connect: 'Connect',
      disconnect: 'Disconnect',
      edit: 'Edit',
      delete: 'Delete',
      addConnection: 'Add',
      clearSearch: 'Clear Search'
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
    fileLoaded: 'File Loaded',
    errors: {
      invalidType: 'Invalid File Type',
      validFileTypes: 'Please drop .log, .txt, or .json files',
      readError: 'Failed to read file: {{error}}',
      fileLoadFailed: 'Failed to load file',
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
      title: 'Interface Language',
      current: 'Current Language',
      selectLanguage: 'Select language',
    },
    subscription: {
      title: 'Subscription',
      upgrade: 'Upgrade',
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
      details: 'Manage subscription',
    },
    aiModel: {
      title: 'AI Model',
      current: 'Current Model',
    },
    logColors: {
      error: 'Error Color',
      warning: 'Warning Color',
      info: 'Info Color',
      debug: 'Debug Color',
      trace: 'Trace Color'
    },
    customLogFormat: {
      title: 'Custom Log Format',
      description: 'Add custom log formats with regex patterns to match non-standard logs',
      selectFormat: 'Select Log Format',
      selectFormatPlaceholder: 'Choose a log format to use',
      defaultFormats: 'Default Formats',
      customFormats: 'Custom Formats',
      active: 'Active',
      addFormat: 'Add Format',
      editFormat: 'Edit Format'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      manage: 'Manage Account',
      profile: 'Profile',
      billing: 'Billing',
      logoutConfirm: {
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
        confirm: 'Logout',
        cancel: 'Cancel'
      },
      logoutSuccess: {
        title: 'Logout Successful',
        message: 'You have been successfully logged out'
      },
      guest: 'Guest',
      loginTip: 'Please login to access more features'
    },
    apiUsage: {
      title: 'API Usage',
      remaining: 'Remaining',
    },
    customModel: {
      title: 'Custom Models',
      provider: 'Provider',
      selectProvider: 'Select provider',
      apiKey: 'API Key',
      enterApiKey: 'Enter API key',
      modelType: 'Model Type',
      selectModel: 'Select model',
    },
    basic: {
      title: 'Basic Settings',
      autoSave: 'Auto Save',
      autoSaveDescription: 'Automatically save chat history and settings',
      telemetry: 'Usage Data Collection',
      telemetryDescription: 'Help us improve (excludes conversation content)',
    },
    aiStyles: {
      title: 'AI Conversation Style',
      professional: 'Professional',
      friendly: 'Friendly',
      creative: 'Creative',
      concise: 'Concise',
    },
  },
  customLogFormat: {
    addFormat: 'Add Log Format',
    editFormat: 'Edit Log Format',
    name: 'Format Name',
    namePlaceholder: 'Enter format name',
    pattern: 'Regex Pattern',
    patternPlaceholder: 'Enter regular expression',
    patternDescription: 'Use regex capture groups to extract different parts of the log',
    sample: 'Sample Log',
    samplePlaceholder: 'Enter a sample log line',
    sampleDescription: 'Enter a sample log line to test the regex pattern',
    groupsDescription: 'Set capture group indices to specify which parentheses capture timestamp, log level, etc.',
    levelGroup: 'Log Level Group',
    levelGroupDescription: 'Group index that captures log level (ERROR, INFO, etc.)',
    messageGroup: 'Message Content Group',
    messageGroupDescription: 'Group index that captures the main log message',
    timestampGroup: 'Timestamp Group',
    timestampGroupDescription: 'Group index that captures the timestamp (optional)',
    traceIdGroup: 'Trace ID Group',
    traceIdGroupDescription: 'Group index that captures trace ID (optional)',
    loggerGroup: 'Logger Group',
    loggerGroupDescription: 'Group index that captures logger name/class (optional)',
    testDescription: 'Test if your regex pattern correctly parses the sample log',
    testButton: 'Test Regex Pattern',
    testSuccess: 'Test Successful',
    testFailed: 'Test Failed',
    tabs: {
      basic: 'Basic Settings',
      captureGroups: 'Capture Groups',
      test: 'Test'
    },
    errors: {
      nameRequired: 'Format name is required',
      patternRequired: 'Regex pattern is required',
      sampleRequired: 'Sample log line is required',
      levelGroupRequired: 'Log level group is required',
      messageGroupRequired: 'Message content group is required',
      patternOrSampleMissing: 'Both regex pattern and sample log are required',
      invalidPattern: 'Invalid regex pattern'
    }
  },
  bottomMenu: {
    format: 'Format',
    size: 'Size',
    lines: 'Lines',
    encoding: 'Encoding',
  },
};