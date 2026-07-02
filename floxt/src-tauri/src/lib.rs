// File data structure
#[derive(serde::Serialize)]
struct OpenedFile {
  name: String,
  content: String,
  path: String,
}

// File execution command
#[tauri::command]
fn get_initial_file() -> Result<Option<OpenedFile>, String> {
    let args: Vec<String> = std::env::args().collect();
    
    if args.len() > 1 {
        let mut file_path = args[1].clone();
        
        // --- NEW: Strip Windows quotation marks if they exist ---
        if file_path.starts_with('"') && file_path.ends_with('"') {
            file_path = file_path[1..file_path.len()-1].to_string();
        }
        
        let path = std::path::Path::new(&file_path);
        
        if !path.exists() {
            return Err(format!("File does not exist: {}\nAll args: {:?}", file_path, args));
        }
        
        match std::fs::read_to_string(path) {
            Ok(content) => {
                let name = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                Ok(Some(OpenedFile {
                    name,
                    content,
                    path: file_path,
                }))
            },
            Err(e) => Err(format!("Found file but couldn't read it. Error: {}\nAll args: {:?}", e, args))
        }
    } else {
        // Normal launch from Start Menu, return nothing
        Ok(None)
    }
}

// Save file command
#[tauri::command]
fn save_document(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| format!("Failed to save file: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_initial_file, save_document])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
