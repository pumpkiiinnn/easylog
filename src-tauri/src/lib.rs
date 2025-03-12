// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use log::{debug, error, info, trace, warn, LevelFilter};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader, Read};
use tokio;
use ssh2;
use tauri::Emitter;

// 初始化日志系统的函数
fn setup_logging() {
    env_logger::Builder::from_default_env()
        .filter_level(LevelFilter::Info)
        .format_timestamp(None)
        .init();
}

#[derive(Debug, Serialize, Clone)]
struct FileContent {
    content: String,
    file_name: String,
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

    let file_name = std::path::Path::new(&options.path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let result = FileContent { content, file_name };

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
        "trace" => trace!("{}", message),
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

#[derive(Debug, Serialize, Clone)]
pub struct LogStreamData {
    content: String,
    timestamp: u64,
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
    
    // 使用tail命令读取文件，如果follow为true则使用-f选项实时跟踪
    let command = if options.follow {
        format!("tail -n 1000 -f \"{}\"", options.log_file_path)
    } else {
        format!("cat \"{}\"", options.log_file_path)
    };
    
    if let Err(e) = channel.exec(&command) {
        return Err(format!("执行命令失败: {}", e));
    }
    
    // 读取输出
    let mut content = String::new();
    let mut buffer = Vec::new();
    if let Err(e) = channel.read_to_end(&mut buffer) {
        return Err(format!("读取输出失败: {}", e));
    }
    
    // 将二进制数据转换为字符串
    match String::from_utf8(buffer) {
        Ok(s) => content = s,
        Err(e) => return Err(format!("无法解析日志内容: {}", e))
    }
    
    // 获取退出状态
    let exit_status = channel.exit_status().unwrap_or(-1);
    if exit_status != 0 {
        return Err(format!("命令执行失败，退出码: {}", exit_status));
    }
    
    let file_name = std::path::Path::new(&options.log_file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    Ok(FileContent {
        content,
        file_name,
    })
}

// 实时监控远程日志文件（使用事件系统）
#[tauri::command]
async fn monitor_remote_log(
    window: tauri::Window,
    credentials: SshCredentials, 
    options: LogStreamOptions
) -> Result<(), String> {
    info!("Monitoring remote log file: {} from {}", options.log_file_path, credentials.host);
    
    let port = credentials.port.unwrap_or(22);
    let window_clone = window.clone();
    let log_path = options.log_file_path.clone();
    
    // 使用tokio线程来处理实时日志监控
    tokio::spawn(async move {
        // 创建TCP连接
        let tcp = match std::net::TcpStream::connect(format!("{}:{}", credentials.host, port)) {
            Ok(s) => s,
            Err(e) => {
                let err_msg = format!("无法连接到服务器: {}", e);
                error!("{}", err_msg);
                let _ = window_clone.emit("ssh-log-error", err_msg);
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
                return;
            }
        };
        
        sess.set_tcp_stream(tcp);
        if let Err(e) = sess.handshake() {
            let err_msg = format!("SSH握手失败: {}", e);
            error!("{}", err_msg);
            let _ = window_clone.emit("ssh-log-error", err_msg);
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
            return;
        }
        
        // 打开一个通道并执行命令读取日志文件
        let mut channel = match sess.channel_session() {
            Ok(c) => c,
            Err(e) => {
                let err_msg = format!("无法创建SSH通道: {}", e);
                error!("{}", err_msg);
                let _ = window_clone.emit("ssh-log-error", err_msg);
                return;
            }
        };
        
        // 使用tail -f命令来实时读取文件内容
        let command = format!("tail -f \"{}\"", log_path);
        
        if let Err(e) = channel.exec(&command) {
            let err_msg = format!("执行命令失败: {}", e);
            error!("{}", err_msg);
            let _ = window_clone.emit("ssh-log-error", err_msg);
            return;
        }
        
        // 通知前端连接成功
        let _ = window_clone.emit("ssh-log-connected", log_path.clone());
        
        // 读取输出并发送到前端
        let mut reader = BufReader::new(channel);
        for line in reader.lines() {
            match line {
                Ok(line) => {
                    let data = LogStreamData {
                        content: line,
                        timestamp: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                    };
                    
                    if let Err(e) = window_clone.emit("ssh-log-data", data) {
                        error!("发送日志数据到前端失败: {}", e);
                        break;
                    }
                },
                Err(e) => {
                    error!("读取日志行失败: {}", e);
                    let _ = window_clone.emit("ssh-log-error", format!("读取数据失败: {}", e));
                    break;
                }
            }
        }
        
        // 通知前端连接已关闭
        let _ = window_clone.emit("ssh-log-disconnected", log_path);
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
            stop_remote_log_monitor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
