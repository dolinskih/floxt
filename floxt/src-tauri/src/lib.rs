use serde::Serialize;
use std::fs;

#[derive(Serialize)]
pub struct ProjectFileInfo {
    name: String,
    path: String,
}

#[tauri::command]
fn read_project_dir(dir_path: String) -> Result<Vec<ProjectFileInfo>, String> {
    let mut files = Vec::new();
    let entries =
        fs::read_dir(&dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "floxt" {
                    if let Some(name) = path.file_stem() {
                        files.push(ProjectFileInfo {
                            name: name.to_string_lossy().into_owned(),
                            path: path.to_string_lossy().into_owned(),
                        });
                    }
                }
            }
        }
    }

    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(files)
}

// File data structure
#[derive(serde::Serialize)]
struct OpenedFile {
    name: String,
    content: String,
    path: String,
}

// File execution commands
fn parse_initial_file_from_args(args: Vec<String>) -> Result<Option<OpenedFile>, String> {
    if args.len() > 1 {
        let mut file_path = args[1].clone();

        if file_path.starts_with('"') && file_path.ends_with('"') {
            file_path = file_path[1..file_path.len() - 1].to_string();
        } 

        let path = std::path::Path::new(&file_path);

        if !path.exists() {
            return Err(format!(
                "File does not exist: {}\nAll args: {:?}",
                file_path, args
            ));
        }

        match std::fs::read_to_string(path) {
            Ok(content) => {
                let name = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                Ok(Some(OpenedFile {
                    name,
                    content,
                    path: file_path,
                }))
            }
            Err(e) => Err(format!(
                "Found file but couldn't read it. Error: {}\nAll args: {:?}",
                e, args
            )),
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn get_initial_file() -> Result<Option<OpenedFile>, String> {
    parse_initial_file_from_args(std::env::args().collect())
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
                let is_case_change = current_path.to_string_lossy().to_lowercase()
                    == new_path.to_string_lossy().to_lowercase();

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

#[tauri::command]
fn read_document(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_document(path: String) -> Result<(), String> {
    std::fs::remove_file(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_initial_file,
            save_document,
            read_project_dir,
            read_document,
            delete_document
        ])
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_read_project_dir() {
        use std::fs::{self, File};

        // Create a unique temporary directory for the test
        let temp_dir = std::env::temp_dir().join("floxt_test_dir");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        // Create a mix of valid (floxt) files and invalid (exe, txt, md) files
        File::create(temp_dir.join("zebra.floxt")).unwrap();
        File::create(temp_dir.join("apple.md")).unwrap();
        File::create(temp_dir.join("apple2.floxt")).unwrap();
        File::create(temp_dir.join("notes.txt")).unwrap();
        File::create(temp_dir.join("baddie.exe")).unwrap();

        // Call read_project_dir
        let result = read_project_dir(temp_dir.to_str().unwrap().to_string());

        // ASSERT: Function read project directory
        assert!(result.is_ok(), "The function failed to read the directory.");

        let files = result.unwrap();

        // ASSERT: Filtered out everything except 2 .floxt files
        assert_eq!(
            files.len(),
            2,
            "The function did not filter out non-floxt files correctly."
        );

        // ASSERT: Alphabetical sorting
        assert_eq!(files[0].name, "apple2");
        assert_eq!(files[1].name, "zebra");

        // Clean up temporary directory
        fs::remove_dir_all(&temp_dir).unwrap();
    }

    #[test]
    fn should_get_initial_file() {
        use std::fs::{self, File};
        use std::io::Write;

        // Scenario A. Normal App Launch - no file passed
        let empty_args = vec!["floxt.exe".to_string()];
        let empty_result = parse_initial_file_from_args(empty_args);

        // ASSERT: Empty result
        assert!(empty_result.is_ok(), "Failed on empty args");
        assert!(empty_result.unwrap().is_none(), "Expected None when no file arg is passed");

        // Scenario B. File Launch (via File Explorer)
        let temp_dir = std::env::temp_dir().join("floxt_initial_test_dir");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let test_file_path = temp_dir.join("my_note.floxt");

        // Create a file and add some content to it
        let mut file = File::create(&test_file_path).unwrap();
        file.write_all(b"Hello Floxt!").unwrap();

        // Simulate Windows wrapping the path in quotes
        let valid_args = vec![
            "floxt.exe".to_string(),
            format!("\"{}\"", test_file_path.to_str().unwrap()),
        ];

        let valid_result = parse_initial_file_from_args(valid_args);

        // ASSERT: Valid result from given file argument
        assert!(valid_result.is_ok(), "Failed to parse valid file argument");

        let opened_file = valid_result.unwrap().expect("Expected Some(OpenedFile)");

        // ASSERT: Stripped the quotes and read the right file
        assert_eq!(opened_file.name, "my_note");
        assert_eq!(opened_file.content, "Hello Floxt!");

        // Clean up temporary directory
        fs::remove_dir_all(&temp_dir).unwrap();
    }

    #[test]
    fn should_save_document() {
        use std::fs::{self, File};
        use std::io::Read;

        // Create a temporary directory and an initial file
        let temp_dir = std::env::temp_dir().join("floxt_save_test_dir");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let initial_path = temp_dir.join("original.floxt");
        fs::write(&initial_path, "Initial content").unwrap();

        // Scenario A. Simple save without rename
        let result_simple = save_document(
            initial_path.to_string_lossy().into_owned(),
            "".to_string(),
            "Updated content.".to_string(),
        );

        // ASSERT: Got result of simple save
        assert!(result_simple.is_ok(), "Simple save failed.");
        
        // Read the file from the disk
        let saved_path_str = result_simple.unwrap();
        let mut read_content = String::new();
        File::open(&saved_path_str).unwrap().read_to_string(&mut read_content).unwrap();

        // ASSERT: Content updated
        assert_eq!(read_content, "Updated content.", "Content was not updated.");

        // Scenario B. Save & rename
        let result_rename = save_document(
            saved_path_str.clone(),
            "renamed_note".to_string(),
            "Content after rename.".to_string(),
        );

        // ASSERT: Got result from save & rename
        assert!(result_rename.is_ok(), "Save and rename failed.");
        
        // ASSERT: File renamed
        let new_saved_path_str = result_rename.unwrap();
        assert!(new_saved_path_str.ends_with("renamed_note.floxt"), "File was not renamed.");

        // ASSERT: Old file does not exist
        assert!(fs::metadata(&saved_path_str).is_err(), "Old file was left behind after rename.");

        // Scenario C. Save & rename (case change only)
        let result_case_change = save_document(
            new_saved_path_str.clone(),
            "Renamed_Note".to_string(),
            "Content after case change.".to_string(),
        );

        // ASSERT: Got result from case change
        assert!(result_case_change.is_ok(), "Case change rename failed.");

        // ASSERT: File renamed
        let case_changed_path = result_case_change.unwrap();
        assert!(case_changed_path.ends_with("Renamed_Note.floxt"), "Case was not updated.");

        // Clean up temporary directory
        fs::remove_dir_all(&temp_dir).unwrap();
    }

    #[test]
    fn should_read_document() {
        use std::fs::{self, File};
        use std::io::Write;

        // Create a temporary directory and a test file
        let temp_dir = std::env::temp_dir().join("floxt_read_test_dir");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let test_file_path = temp_dir.join("test_note.floxt");
        let expected_content = "This is the content of the Floxt note.";

        // Write data to the disk using standard IO
        let mut file = File::create(&test_file_path).unwrap();
        file.write_all(expected_content.as_bytes()).unwrap();

        // Scenario A. Read an existing file
        let result_success = read_document(test_file_path.to_string_lossy().into_owned());

        // ASSERT: Read the file
        assert!(result_success.is_ok(), "Failed to read the document.");
        
        // ASSERT: Content matches
        let read_content = result_success.unwrap();
        assert_eq!(read_content, expected_content, "The read content does not match what was written to disk.");

        // Scenario B. Attempt to read a missing file
        let fake_path = temp_dir.join("does_not_exist.floxt");
        let result_failure = read_document(fake_path.to_string_lossy().into_owned());

        // ASSERT: Could not read the file
        assert!(result_failure.is_err(), "Function should have returned an error for a missing file.");

        // Clean up temporary directory
        fs::remove_dir_all(&temp_dir).unwrap();

    }

    #[test]
    fn should_delete_document() {
        use std::fs::{self, File};

        // Create a temporary directory and a test file
        let temp_dir = std::env::temp_dir().join("floxt_delete_test_dir");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let file_to_delete = temp_dir.join("delete_me.floxt");
        File::create(&file_to_delete).unwrap();

        // ASSERT: File was created
        assert!(file_to_delete.exists(), "Setup failed: file was not created.");

        // Scenario A. Successfully delete an existing file
        let result_success = delete_document(file_to_delete.to_string_lossy().into_owned());

        // ASSERT: Deleted the document
        assert!(result_success.is_ok(), "Failed to delete the document.");

        // ASSERT: Document is not on the disk
        assert!(!file_to_delete.exists(), "File is still on the disk after calling the delete function.");

        // Scenario B. Attempt to delete a missing file
        let fake_path = temp_dir.join("ghost_file.floxt");
        let result_failure = delete_document(fake_path.to_string_lossy().into_owned());

        // ASSERT: Got error from trying to delete a missing file
        assert!(result_failure.is_err(), "Function should return an error when deleting a missing file.");

        // Clean up temporary directory
        fs::remove_dir_all(&temp_dir).unwrap();
    }
}
