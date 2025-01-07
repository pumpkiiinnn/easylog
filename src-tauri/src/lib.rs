// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{self, BufRead, BufReader};

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
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file(options: FileReadOptions) -> Result<FileContent, String> {
    let file = File::open(&options.path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    let mut content = String::new();

    // 如果指定了最大行数，就只读取指定行数
    if let Some(max_lines) = options.max_lines {
        for (i, line) in reader.lines().enumerate() {
            if i >= max_lines {
                break;
            }
            if let Ok(line) = line {
                content.push_str(&line);
                content.push('\n');
            }
        }
    } else {
        // 否则读取整个文件
        for line in reader.lines() {
            if let Ok(line) = line {
                content.push_str(&line);
                content.push('\n');
            }
        }
    }

    Ok(FileContent {
        content,
        file_name: std::path::Path::new(&options.path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
