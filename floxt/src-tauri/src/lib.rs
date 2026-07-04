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
fn save_document(path: String, new_name: String, content: String) -> Result<String, String> {
    use std::fs;
    use std::path::PathBuf;

    let mut current_path = PathBuf::from(&path);
    let clean_name = new_name.trim();

    if !clean_name.is_empty() {
        if let (Some(parent), Some(ext)) = (current_path.parent(), current_path.extension()) {
            let new_file_name = format!("{}.{}", clean_name, ext.to_string_lossy());
            let new_path = parent.join(new_file_name);

            if current_path != new_path {
                let is_case_change = current_path.to_string_lossy().to_lowercase() == new_path.to_string_lossy().to_lowercase();
                
                if !new_path.exists() || is_case_change {
                    if let Err(e) = fs::rename(&current_path, &new_path) {
                        return Err(format!("Failed to rename file: {}", e));
                    }
                    current_path = new_path; 
                }
            }
        }
    }

    if let Err(e) = fs::write(&current_path, content) {
        return Err(format!("Failed to write file: {}", e));
    }

    Ok(current_path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
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
