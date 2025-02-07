// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use log::{debug, error, info, trace, warn, LevelFilter};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader};

// 初始化日志系统的函数
fn setup_logging() {
    env_logger::Builder::from_default_env()
        .filter_level(LevelFilter::Info)
        .format_timestamp(None)
        .init();
}

#[derive(Debug, Serialize)]
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
        .invoke_handler(tauri::generate_handler![greet, read_file, log_to_frontend])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
