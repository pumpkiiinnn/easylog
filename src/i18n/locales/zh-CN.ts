export default {
  common: {
    search: '搜索',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    save: '保存',
  },
  nav: {
    localFiles: '本地文件',
    remoteLogs: '远程日志',
    settings: '显示设置',
    appSettings: '应用设置',
    chatHistory: '对话历史',
  },
  toolbar: {
    expandSidebar: '展开资源管理器',
    collapseSidebar: '收起资源管理器',
    search: '搜索',
    chatHistory: '对话历史',
    displaySettings: '显示设置',
    appSettings: '应用设置',
  },
  remoteLogs: {
    title: '远程日志',
    addConnection: '添加连接',
    categories: {
      server: '服务器',
      middleware: '中间件',
      database: '数据库',
      custom: '自定义',
    },
    types: {
      ssh: 'SSH 服务器',
      kafka: 'Kafka',
      redis: 'Redis',
      elasticsearch: 'Elasticsearch',
      mongodb: 'MongoDB',
      mysql: 'MySQL',
      custom: '自定义',
    },
    form: {
      type: '连接类型',
      name: '名称',
      host: '主机地址',
      sshKey: 'SSH 密钥路径',
      username: '用户名',
      password: '密码',
      selectType: '选择类型',
      inputName: '输入连接名称',
      inputHost: '输入主机地址',
      inputSshKey: '输入 SSH 密钥路径',
      inputUsername: '输入用户名',
      inputPassword: '输入密码',
    },
    status: {
      connected: '已连接',
      disconnected: '未连接',
      error: '错误',
    },
    defaultNames: {
      productionServer: '生产服务器',
      messageQueue: '消息队列',
      logStorage: '日志存储',
    },
  },
  chatHistory: {
    title: '对话历史',
    selected: '已选择',
    aiResponse: 'AI 分析结果',
    time: '{time}',
  },
  fileList: {
    openFile: '打开文件',
    openFolder: '打开文件夹',
    recentFiles: '最近打开',
    noFiles: '暂无文件',
    dragTip: '拖放文件到此处',
    filters: {
      name: '日志文件',
      extensions: ['log', 'txt', 'json']
    },
    errors: {
      readError: '读取文件失败：{{error}}',
      noSelection: '未选择文件',
    }
  },
  logContent: {
    dragToStart: '拖入日志文件以开始',
    dropToOpen: '释放以打开文件',
    supportedFiles: '支持 .log 和 .txt 文件',
    refresh: '刷新',
    export: '导出',
    searchPlaceholder: '搜索日志内容...',
    errors: {
      invalidType: '无效的文件类型',
      validFileTypes: '请拖入 .log、.txt 或 .json 文件',
      readError: '读取文件失败：{{error}}',
    },
  },
  settings: {
    displaySettings: '显示设置',
    theme: {
      darkMode: '夜间模式',
      darkModeDescription: '切换深色/浅色主题',
      title: '主题',
      light: '浅色',
      dark: '深色',
    },
    autoRefresh: '自动刷新',
    autoRefreshDescription: '每5秒自动刷新日志内容',
    autoScroll: '自动滚动',
    autoScrollDescription: '自动滚动到最新日志',
    fontSize: '字体大小',
    lineHeight: '行高',
    language: {
      title: '界面语言',
      current: '当前语言',
      selectLanguage: '选择语言',
    },
    subscription: {
      title: '订阅计划',
      upgrade: '升级',
    },
    aiModel: {
      title: 'AI 模型',
    },
    logColors: {
      error: '错误颜色',
      warning: '警告颜色',
      info: '信息颜色',
      debug: '调试颜色',
      trace: '追踪颜色'
    },
    auth: {
      login: '登录',
      logout: '退出登录',
      manage: '管理账户',
      profile: '个人资料',
      billing: '账单信息',
      logoutConfirm: {
        title: '确认退出',
        message: '确定要退出登录吗？',
        confirm: '确认退出',
        cancel: '取消'
      },
      logoutSuccess: {
        title: '退出成功',
        message: '您已成功退出登录'
      },
      guest: '游客',
      loginTip: '请登录以使用更多功能'
    },
    subscription: {
      free: '免费版',
      pro: '专业版',
      enterprise: '企业版',
      details: '管理订阅计划',
    },
    apiUsage: {
      title: 'API 使用量',
      remaining: '剩余额度',
    },
    customModel: {
      title: '自定义模型',
      provider: '模型提供商',
      selectProvider: '选择提供商',
      apiKey: 'API 密钥',
      enterApiKey: '输入 API 密钥',
      modelType: '模型类型',
      selectModel: '选择模型',
    },
    basic: {
      title: '基础设置',
      autoSave: '自动保存',
      autoSaveDescription: '自动保存对话历史和设置',
      telemetry: '使用数据收集',
      telemetryDescription: '帮助我们改进产品（不包含对话内容）',
    },
    aiStyles: {
      title: 'AI 对话风格',
      professional: '专业',
      friendly: '友好',
      creative: '创意',
      concise: '简洁',
    },
    aiModel: {
      current: '当前模型',
    },
  },
  bottomMenu: {
    format: '格式',
    size: '大小',
    lines: '行数',
    encoding: '编码',
  },
}; 