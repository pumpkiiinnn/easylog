// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use log::{debug, error, info, warn, LevelFilter};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader, Read};
use ssh2::Session;
use std::path::Path;
use std::sync::Mutex;
use tauri::Manager;
use tokio;
use tauri::Emitter;
use std::collections::HashMap;
use std::sync::Arc;
use lazy_static::lazy_static;

// 定义活跃连接管理器结构
#[derive(Debug, Default)]
struct ActiveConnections {
    // 使用(host, port)作为键
    connections: HashMap<(String, u16), String>, // 值为log_path，用于识别连接
}

// 使用lazy_static创建全局的活跃连接管理器
lazy_static! {
    static ref ACTIVE_CONNECTIONS: Arc<Mutex<ActiveConnections>> = Arc::new(Mutex::new(ActiveConnections::default()));
}

// 初始化日志系统的函数
fn setup_logging() {
    env_logger::Builder::from_default_env()
        .filter_level(LevelFilter::Info)
        .format_timestamp(None)
        .init();
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct FileContent {
    content: String,
    total_lines: usize,
}

#[derive(Debug, Deserialize)]
struct FileReadOptions {
    path: String,
    max_lines: Option<usize>, // 可选参数，限制读取行数
}

#[tauri::command]
fn greet(name: &str) -> String {
    println!("Hello, {}!", name);
    info!("Greeting {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file(options: FileReadOptions) -> Result<FileContent, String> {
    info!("Reading file with options: {:?}", options);

    // 添加文件存在性检查
    if !std::path::Path::new(&options.path).exists() {
        let err = format!("File not found: {}", options.path);
        error!("{}", err);
        return Err(err);
    }

    let file = match File::open(&options.path) {
        Ok(f) => f,
        Err(e) => {
            let err = format!("Failed to open file: {}", e);
            error!("{}", err);
            return Err(err);
        }
    };

    let reader = BufReader::new(file);
    let mut content = String::new();

    // 如果指定了最大行数，就只读取指定行数
    if let Some(max_lines) = options.max_lines {
        for (i, line) in reader.lines().enumerate() {
            if i >= max_lines {
                break;
            }
            match line {
                Ok(line) => {
                    content.push_str(&line);
                    content.push('\n');
                }
                Err(e) => {
                    let err = format!("Error reading line: {}", e);
                    error!("{}", err);
                    return Err(err);
                }
            }
        }
    } else {
        // 否则读取整个文件
        for line in reader.lines() {
            match line {
                Ok(line) => {
                    content.push_str(&line);
                    content.push('\n');
                }
                Err(e) => {
                    let err = format!("Error reading line: {}", e);
                    error!("{}", err);
                    return Err(err);
                }
            }
        }
    }

    let _file_name = std::path::Path::new(&options.path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let result = FileContent {
        content: content.clone(),
        total_lines: content.lines().count(),
    };

    info!("Successfully read file");
    Ok(result)
}

#[tauri::command]
fn log_to_frontend(level: String, message: String) {
    match level.as_str() {
        "error" => error!("{}", message),
        "warn" => warn!("{}", message),
        "info" => info!("{}", message),
        "debug" => debug!("{}", message),
        "trace" => debug!("{}", message),
        _ => info!("{}", message),
    }
}

// 新添加的SSH连接和日志流相关结构体和类型
#[derive(Debug, Deserialize, Clone)]
pub struct SshCredentials {
    host: String,
    port: Option<u16>,
    username: String,
    #[serde(flatten)]
    auth_method: AuthMethod,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(tag = "auth_type")]
pub enum AuthMethod {
    #[serde(rename = "password")]
    Password { password: String },
    #[serde(rename = "key")]
    PublicKey { private_key_path: String, passphrase: Option<String> },
}

#[derive(Debug, Serialize, Clone)]
pub struct SshConnectionStatus {
    connected: bool,
    message: String,
}

#[derive(Debug, Deserialize)]
pub struct LogStreamOptions {
    log_file_path: String,
    follow: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogStreamData {
    pub content: String,
    pub is_complete: bool,
    pub source: Option<String>,
    pub error: Option<String>,
    pub timestamp: u64,
}

// SSH连接测试
#[tauri::command]
async fn test_ssh_connection(credentials: SshCredentials) -> Result<SshConnectionStatus, String> {
    info!("Testing SSH connection to: {}", credentials.host);
    
    let port = credentials.port.unwrap_or(22);
    
    // 创建一个临时的TCP连接来测试SSH连接
    match std::net::TcpStream::connect(format!("{}:{}", credentials.host, port)) {
        Ok(tcp) => {
            // 创建SSH会话
            let mut sess = match ssh2::Session::new() {
                Ok(s) => s,
                Err(e) => return Err(format!("创建SSH会话失败: {}", e)),
            };
            
            sess.set_tcp_stream(tcp);
            if let Err(e) = sess.handshake() {
                return Err(format!("SSH握手失败: {}", e));
            }
            
            // 根据认证方式进行身份验证
            let auth_result = match &credentials.auth_method {
                AuthMethod::Password { password } => {
                    sess.userauth_password(&credentials.username, password)
                },
                AuthMethod::PublicKey { private_key_path, passphrase } => {
                    // 因为需要考虑跨平台，这里处理路径
                    let path = std::path::Path::new(private_key_path);
                    let passphrase_str = passphrase.as_deref().unwrap_or("");
                    sess.userauth_pubkey_file(
                        &credentials.username,
                        None,
                        path,
                        Some(passphrase_str)
                    )
                }
            };
            
            if let Err(e) = auth_result {
                return Err(format!("SSH认证失败: {}", e));
            }
            
            info!("SSH连接测试成功: {}", credentials.host);
            Ok(SshConnectionStatus {
                connected: true,
                message: "连接成功".to_string(),
            })
        },
        Err(e) => {
            error!("无法连接到SSH服务器: {}", e);
            Err(format!("连接失败: {}", e))
        }
    }
}

// 读取远程日志文件
#[tauri::command]
async fn read_remote_log(credentials: SshCredentials, options: LogStreamOptions) -> Result<FileContent, String> {
    info!("Reading remote log file: {} from {}", options.log_file_path, credentials.host);
    
    let port = credentials.port.unwrap_or(22);
    
    // 创建TCP连接
    let tcp = match std::net::TcpStream::connect(format!("{}:{}", credentials.host, port)) {
        Ok(s) => s,
        Err(e) => return Err(format!("无法连接到服务器: {}", e)),
    };
    
    // 创建SSH会话
    let mut sess = match ssh2::Session::new() {
        Ok(s) => s,
        Err(e) => return Err(format!("创建SSH会话失败: {}", e)),
    };
    
    sess.set_tcp_stream(tcp);
    if let Err(e) = sess.handshake() {
        return Err(format!("SSH握手失败: {}", e));
    }
    
    // 根据认证方式进行身份验证
    let auth_result = match &credentials.auth_method {
        AuthMethod::Password { password } => {
            sess.userauth_password(&credentials.username, password)
        },
        AuthMethod::PublicKey { private_key_path, passphrase } => {
            let path = std::path::Path::new(private_key_path);
            let passphrase_str = passphrase.as_deref().unwrap_or("");
            sess.userauth_pubkey_file(
                &credentials.username,
                None,
                path,
                Some(passphrase_str)
            )
        }
    };
    
    if let Err(e) = auth_result {
        return Err(format!("SSH认证失败: {}", e));
    }
    
    // 打开一个通道并执行命令读取日志文件
    let mut channel = match sess.channel_session() {
        Ok(c) => c,
        Err(e) => return Err(format!("无法创建SSH通道: {}", e)),
    };
    
    // 根据选项使用合适的命令
    let command = if options.follow {
        format!("tail -n 1000 -f \"{}\"", options.log_file_path)
    } else {
        format!("cat \"{}\"", options.log_file_path)
    };
    
    if let Err(e) = channel.exec(&command) {
        return Err(format!("执行命令失败: {}", e));
    }
    
    // 读取输出 - 直接使用channel.read方法，不使用BufReader
    let mut buffer = vec![0; 8192]; // 使用更大的缓冲区
    let mut content = String::new();
    
    // 读取所有数据
    loop {
        match channel.read(&mut buffer) {
            Ok(n) => {
                if n == 0 {
                    break; // 读取结束
                }
                
                // 将读取的数据转换为字符串并添加到结果中
                match std::str::from_utf8(&buffer[0..n]) {
                    Ok(s) => content.push_str(s),
                    Err(e) => {
                        return Err(format!("解析日志内容失败: {}", e));
                    }
                }
            },
            Err(e) => {
                return Err(format!("读取日志内容失败: {}", e));
            }
        }
    }
    
    // 等待通道关闭
    channel.wait_close().ok();
    
    // 返回结果
    Ok(FileContent {
        content: content.clone(),
        total_lines: content.lines().count(),
    })
}

// 实时监控远程日志文件（使用事件系统）
#[tauri::command]
async fn monitor_remote_log(window: tauri::Window, credentials: SshCredentials, log_path: String) -> Result<(), String> {
    info!("Starting remote log monitoring for: {} on {}", log_path, credentials.host);
    
    let port = credentials.port.unwrap_or(22);
    let conn_key = (credentials.host.clone(), port);
    
    // 检查是否已有相同服务器的连接
    {
        let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
        if let Some(existing_log_path) = connections.connections.get(&conn_key) {
            let err_msg = format!("已存在到服务器 {}:{} 的连接，正在监控日志: {}", conn_key.0, conn_key.1, existing_log_path);
            error!("{}", err_msg);
            // 移除旧连接
            connections.connections.remove(&conn_key);
        }

        // 添加到活跃连接列表
        connections.connections.insert(conn_key.clone(), log_path.clone());
    }
    
    // 克隆window以便在tokio线程中使用
    let window_clone = window.clone();
    let host = credentials.host.clone();
    
    // 使用tokio线程来处理实时日志监控
    tokio::spawn(async move {
        // 创建TCP连接
        let tcp = match std::net::TcpStream::connect(format!("{}:{}", credentials.host, port)) {
            Ok(s) => s,
            Err(e) => {
                let err_msg = format!("无法连接到服务器: {}", e);
                error!("{}", err_msg);
                let _ = window_clone.emit("ssh-log-error", err_msg);
                
                // 从活跃连接中移除
                let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
                connections.connections.remove(&conn_key);
                return;
            }
        };
        
        // 创建SSH会话
        let mut sess = match ssh2::Session::new() {
            Ok(s) => s,
            Err(e) => {
                let err_msg = format!("创建SSH会话失败: {}", e);
                error!("{}", err_msg);
                let _ = window_clone.emit("ssh-log-error", err_msg);
                
                // 从活跃连接中移除
                let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
                connections.connections.remove(&conn_key);
                return;
            }
        };
        
        sess.set_tcp_stream(tcp);
        if let Err(e) = sess.handshake() {
            let err_msg = format!("SSH握手失败: {}", e);
            error!("{}", err_msg);
            let _ = window_clone.emit("ssh-log-error", err_msg);
            
            // 从活跃连接中移除
            let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
            connections.connections.remove(&conn_key);
            return;
        }
        
        // 根据认证方式进行身份验证
        let auth_result = match &credentials.auth_method {
            AuthMethod::Password { password } => {
                sess.userauth_password(&credentials.username, password)
            },
            AuthMethod::PublicKey { private_key_path, passphrase } => {
                let path = std::path::Path::new(private_key_path);
                let passphrase_str = passphrase.as_deref().unwrap_or("");
                sess.userauth_pubkey_file(
                    &credentials.username,
                    None,
                    path,
                    Some(passphrase_str)
                )
            }
        };
        
        if let Err(e) = auth_result {
            let err_msg = format!("SSH认证失败: {}", e);
            error!("{}", err_msg);
            let _ = window_clone.emit("ssh-log-error", err_msg);
            
            // 从活跃连接中移除
            let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
            connections.connections.remove(&conn_key);
            return;
        }
        
        // 打开一个通道并执行命令读取日志文件
        let mut channel = match sess.channel_session() {
            Ok(c) => c,
            Err(e) => {
                let err_msg = format!("无法创建SSH通道: {}", e);
                error!("{}", err_msg);
                let _ = window_clone.emit("ssh-log-error", err_msg);
                
                // 从活跃连接中移除
                let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
                connections.connections.remove(&conn_key);
                return;
            }
        };
        
        // 使用tail -f命令来实时读取文件内容，显示最后100行
        let command = format!("tail -n 100 -f \"{}\"", log_path);
        
        if let Err(e) = channel.exec(&command) {
            let err_msg = format!("执行命令失败: {}", e);
            error!("{}", err_msg);
            let _ = window_clone.emit("ssh-log-error", err_msg);
            
            // 从活跃连接中移除
            let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
            connections.connections.remove(&conn_key);
            return;
        }
        
        // 通知前端连接成功
        let _ = window_clone.emit("ssh-log-connected", log_path.clone());
        
        // 读取输出并发送到前端
        info!("Starting to read remote log data from: {}", log_path);
        
        // 使用行计数器跟踪读取的日志行数
        let mut line_count = 0;
        let mut last_log_time = std::time::Instant::now();
        
        // 初始化一个缓冲区
        let mut buffer = vec![0; 1024]; 
        let mut accumulated_data = Vec::new();
        
        // 设置为非阻塞模式 - SSH2的Channel不支持set_blocking，使用其他方式处理
        // 使用session的设置来影响通道行为
        sess.set_blocking(false);
        info!("Session set to non-blocking mode, starting read loop");
        
        loop {
            // 检查连接是否应该停止（被其他请求取消）
            {
                let connections = ACTIVE_CONNECTIONS.lock().unwrap();
                if !connections.connections.contains_key(&conn_key) {
                    info!("连接已被请求停止: {}:{} for {}", conn_key.0, conn_key.1, log_path);
                    break;
                }
            }
            
            match channel.read(&mut buffer) {
                Ok(bytes_read) => {
                    if bytes_read == 0 {
                        // 在非阻塞模式下，返回0可能意味着暂时没有数据或EOF
                        if channel.eof() {
                            info!("Channel EOF detected, connection closed after reading {} lines", line_count);
                            break;
                        }
                        // 等待一下再继续读取
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        continue;
                    }
                    
                    // 将读取到的数据添加到累积缓冲区
                    accumulated_data.extend_from_slice(&buffer[0..bytes_read]);
                    
                    // 按行处理数据
                    let mut start_idx = 0;
                    while let Some(idx) = accumulated_data[start_idx..].iter().position(|&b| b == b'\n') {
                        let line_end_idx = start_idx + idx;
                        
                        // 尝试转换行数据为UTF-8字符串
                        if let Ok(line) = String::from_utf8(accumulated_data[start_idx..line_end_idx].to_vec()) {
                            line_count += 1;
                            
                            // 每读取100行或者每5秒输出一次调试日志
                            let now = std::time::Instant::now();
                            if line_count % 100 == 0 || now.duration_since(last_log_time).as_secs() >= 5 {
                                info!("Read {} lines from remote log. Latest content: {}", 
                                     line_count, line.chars().take(50).collect::<String>());
                                last_log_time = now;
                            }
                            
                            // 打印每一行日志内容到Rust控制台
                            info!("[远程日志] {}: {}", log_path, line);
                            
                            // 为每行创建LogStreamData并发送到前端
                            let log_data = LogStreamData {
                                content: line,
                                is_complete: false,
                                source: Some(log_path.clone()),
                                error: None,
                                timestamp: std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs(),
                            };
                            
                            if let Err(e) = window_clone.emit("ssh-log-data", log_data) {
                                error!("Failed to emit log data: {}", e);
                            }
                        }
                        
                        // 移动到下一行的开始
                        start_idx = line_end_idx + 1;
                    }
                    
                    // 保留未处理的数据（可能是不完整的行）
                    if start_idx < accumulated_data.len() {
                        accumulated_data = accumulated_data[start_idx..].to_vec();
                    } else {
                        accumulated_data.clear();
                    }
                },
                Err(e) => {
                    // 在非阻塞模式下，WouldBlock错误是正常的
                    if e.kind() == std::io::ErrorKind::WouldBlock {
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        continue;
                    }
                    
                    let err_msg = format!("读取远程日志失败: {}", e);
                    error!("{}", err_msg);
                    
                    let log_data = LogStreamData {
                        content: String::new(),
                        is_complete: true,
                        source: Some(log_path.clone()),
                        error: Some(err_msg.clone()),
                        timestamp: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                    };
                    
                    let _ = window_clone.emit("log-data", log_data);
                    let _ = window_clone.emit("ssh-log-error", err_msg);
                    break;
                }
            }
        }
        
        // 从活跃连接中移除
        {
            let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
            connections.connections.remove(&conn_key);
        }
        
        // 通知前端监控已结束
        let _ = window_clone.emit("ssh-log-disconnected", log_path);
        info!("Remote log monitoring ended for {}:{}", host, port);
    });
    
    Ok(())
}

// 停止监控远程日志
#[tauri::command]
async fn stop_remote_log_monitor(window: tauri::Window, log_path: String) -> Result<(), String> {
    info!("Stopping remote log monitor for: {}", log_path);
    
    // 发送一个事件通知前端连接已关闭
    let _ = window.emit("ssh-log-monitor-stopped", log_path);
    
    Ok(())
}

// 停止指定服务器的日志流
#[tauri::command]
async fn stop_log_stream(window: tauri::Window, host: String, port: Option<u16>) -> Result<(), String> {
    let port = port.unwrap_or(22);
    let conn_key = (host.clone(), port);
    
    info!("尝试停止服务器 {}:{} 的日志流", host, port);
    
    // 从活跃连接中移除
    let log_path;
    {
        let mut connections = ACTIVE_CONNECTIONS.lock().unwrap();
        if let Some(path) = connections.connections.remove(&conn_key) {
            log_path = path;
            info!("已移除服务器 {}:{} 的连接", host, port);
        } else {
            return Err(format!("未找到服务器 {}:{} 的活跃连接", host, port));
        }
    }
    
    // 通知前端连接已关闭
    let _ = window.emit("ssh-log-monitor-stopped", &log_path);
    let _ = window.emit("ssh-log-disconnected", &log_path);
    
    info!("成功停止服务器 {}:{} 的日志流，日志路径: {}", host, port, log_path);
    Ok(())
}

#[derive(Debug, Deserialize, Serialize)]
struct LogFileInfo {
    path: String,
    name: String,
    is_remote: bool,
}

#[tauri::command]
fn validate_ssh_logs(credentials: SshCredentials) -> Result<Vec<LogFileInfo>, String> {
    info!("Validating SSH logs from: {}", credentials.host);
    
    let port = credentials.port.unwrap_or(22);
    
    // 创建TCP连接
    let tcp = match std::net::TcpStream::connect(format!("{}:{}", credentials.host, port)) {
        Ok(s) => s,
        Err(e) => return Err(format!("无法连接到服务器: {}", e)),
    };
    
    // 创建SSH会话
    let mut sess = match ssh2::Session::new() {
        Ok(s) => s,
        Err(e) => return Err(format!("创建SSH会话失败: {}", e)),
    };
    
    sess.set_tcp_stream(tcp);
    if let Err(e) = sess.handshake() {
        return Err(format!("SSH握手失败: {}", e));
    }
    
    // 根据认证方式进行身份验证
    let auth_result = match &credentials.auth_method {
        AuthMethod::Password { password } => {
            sess.userauth_password(&credentials.username, password)
        },
        AuthMethod::PublicKey { private_key_path, passphrase } => {
            let path = std::path::Path::new(private_key_path);
            let passphrase_str = passphrase.as_deref().unwrap_or("");
            sess.userauth_pubkey_file(
                &credentials.username,
                None,
                path,
                Some(passphrase_str)
            )
        }
    };
    
    if let Err(e) = auth_result {
        return Err(format!("SSH认证失败: {}", e));
    }
    
    // 查找常见日志目录中的日志文件
    let common_dirs = vec![
        "/var/log",
        "/var/log/system",
        "/var/log/messages",
        "/var/log/syslog",
        "/var/log/nginx",
        "/var/log/apache2",
        "/var/log/httpd",
        // 可以添加更多常见日志目录
    ];
    
    let mut log_files = Vec::new();
    
    for dir in common_dirs {
        // 打开一个通道并执行命令列出目录中的文件
        let mut channel = match sess.channel_session() {
            Ok(c) => c,
            Err(_e) => continue, // 如果无法创建通道，尝试下一个目录
        };
        
        let command = format!("find \"{}\" -type f -name \"*.log\" -o -name \"*.out\" | grep -v \".gz\" | sort | head -50", dir);
        
        if let Err(_) = channel.exec(&command) {
            continue; // 如果命令执行失败，尝试下一个目录
        }
        
        // 读取命令输出 - 直接使用channel.read方法，不使用BufReader
        let mut buffer = vec![0; 4096];
        let mut output = Vec::new();
        
        loop {
            match channel.read(&mut buffer) {
                Ok(n) => {
                    if n == 0 {
                        break;
                    }
                    output.extend_from_slice(&buffer[0..n]);
                },
                Err(_) => break,
            }
        }
        
        // 将输出转换为字符串并分割成行
        if let Ok(output_str) = String::from_utf8(output) {
            for line in output_str.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                
                // 获取文件名部分
                let file_name = match std::path::Path::new(line).file_name() {
                    Some(name) => match name.to_str() {
                        Some(s) => s.to_string(),
                        None => continue,
                    },
                    None => continue,
                };
                
                log_files.push(LogFileInfo {
                    path: line.to_string(),
                    name: file_name,
                    is_remote: true,
                });
            }
        }
    }
    
    Ok(log_files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 在应用启动时初始化日志系统
    setup_logging();
    info!("Starting application...");

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            read_file, 
            log_to_frontend, 
            test_ssh_connection,
            read_remote_log,
            monitor_remote_log,
            stop_remote_log_monitor,
            stop_log_stream,
            validate_ssh_logs
        ])
        .setup(|app| {
            // 正确获取应用数据目录
            let app_dir = app.path().app_data_dir().expect("无法获取应用数据目录");
            std::fs::create_dir_all(&app_dir).unwrap();
            let highlighter_path = app_dir.join("highlighter.json");
            if !highlighter_path.exists() {
                let default_highlighter = HighlighterConfig {
                    items: vec![
                        HighlighterItem {
                            id: "error".to_string(),
                            pattern: "error|错误|异常|exception".to_string(),
                            color: "#FF5252".to_string(),
                            is_regex: true,
                            is_case_sensitive: false,
                            is_enabled: true,
                        },
                        HighlighterItem {
                            id: "warning".to_string(),
                            pattern: "warning|警告|warn".to_string(),
                            color: "#FFC107".to_string(),
                            is_regex: true,
                            is_case_sensitive: false,
                            is_enabled: true,
                        },
                        HighlighterItem {
                            id: "info".to_string(),
                            pattern: "info|信息".to_string(),
                            color: "#2196F3".to_string(),
                            is_regex: true,
                            is_case_sensitive: false,
                            is_enabled: true,
                        },
                        HighlighterItem {
                            id: "success".to_string(),
                            pattern: "success|成功".to_string(),
                            color: "#4CAF50".to_string(),
                            is_regex: true,
                            is_case_sensitive: false,
                            is_enabled: true,
                        },
                        HighlighterItem {
                            id: "debug".to_string(),
                            pattern: "debug|调试".to_string(),
                            color: "#9E9E9E".to_string(),
                            is_regex: true,
                            is_case_sensitive: false,
                            is_enabled: true,
                        },
                    ],
                };
                let json = serde_json::to_string_pretty(&default_highlighter).unwrap();
                std::fs::write(&highlighter_path, json).unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug, Deserialize, Clone, Serialize)]
struct HighlighterConfig {
    items: Vec<HighlighterItem>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
struct HighlighterItem {
    id: String,
    pattern: String,
    color: String,
    is_regex: bool,
    is_case_sensitive: bool,
    is_enabled: bool,
}
