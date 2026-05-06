use std::sync::Mutex;
use once_cell::sync::Lazy;
use tauri::Manager;

mod commands;
mod crypto;
mod database;
mod totp;
mod models;
mod clipboard;

use crypto::CryptoManager;
use database::Database;

// Global state
pub struct AppState {
    pub db: Mutex<Option<Database>>,
    pub crypto: Mutex<Option<CryptoManager>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            db: Mutex::new(None),
            crypto: Mutex::new(None),
        }
    }
}

pub static APP_STATE: Lazy<AppState> = Lazy::new(AppState::new);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            // Ensure app data directory exists
            let app_dir = app.path().app_data_dir()?;
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir)?;
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_database_exists,
            commands::create_database,
            commands::unlock_database,
            commands::delete_database,
            commands::get_accounts,
            commands::add_account,
            commands::update_account,
            commands::delete_account,
            commands::copy_account_fields,
            commands::generate_totp_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
