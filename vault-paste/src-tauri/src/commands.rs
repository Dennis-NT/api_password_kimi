use tauri::{AppHandle, Manager};
use crate::{
    models::{Account, NewAccount, TotpResult, UpdateAccount},
    database::Database,
    clipboard::ClipboardManager,
    APP_STATE,
};
use std::path::PathBuf;
use std::sync::MutexGuard;

fn get_app_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_dir(app)?.join("vault.db"))
}

fn with_db<F, R>(f: F) -> Result<R, String>
where
    F: FnOnce(MutexGuard<Option<Database>>) -> Result<R, String>,
{
    let db = APP_STATE.db.lock()
        .map_err(|e| format!("Failed to lock database: {}", e))?;
    f(db)
}

fn with_crypto<F, R>(f: F) -> Result<R, String>
where
    F: FnOnce(MutexGuard<Option<crate::crypto::CryptoManager>>) -> Result<R, String>,
{
    let crypto = APP_STATE.crypto.lock()
        .map_err(|e| format!("Failed to lock crypto: {}", e))?;
    f(crypto)
}

#[tauri::command]
pub fn check_database_exists(app: AppHandle) -> Result<bool, String> {
    let db_path = get_db_path(&app)?;
    Ok(db_path.exists())
}

#[tauri::command]
pub fn create_database(app: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    
    let db = Database::new(&db_path)?;
    
    let mut db_lock = APP_STATE.db.lock()
        .map_err(|e| format!("Failed to lock: {}", e))?;
    *db_lock = Some(db);
    
    Ok(())
}

#[tauri::command]
pub fn unlock_database(app: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    if !db_path.exists() {
        return Err("Database does not exist".to_string());
    }

    let db = Database::open(&db_path)?;

    let mut db_lock = APP_STATE.db.lock()
        .map_err(|e| format!("Failed to lock: {}", e))?;
    *db_lock = Some(db);

    Ok(())
}

#[tauri::command]
pub fn delete_database(app: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;

    if db_path.exists() {
        std::fs::remove_file(&db_path)
            .map_err(|e| format!("Failed to delete database: {}", e))?;
    }

    // Clear in-memory state
    let mut db_lock = APP_STATE.db.lock()
        .map_err(|e| format!("Failed to lock: {}", e))?;
    *db_lock = None;

    Ok(())
}

#[tauri::command]
pub fn get_accounts(search: Option<String>) -> Result<Vec<Account>, String> {
    with_db(|db| {
        db.as_ref()
            .ok_or("Database not initialized")?
            .get_accounts(search.as_deref())
    })
}

#[tauri::command]
pub fn add_account(account: NewAccount) -> Result<Account, String> {
    with_db(|db| {
        db.as_ref()
            .ok_or("Database not initialized")?
            .add_account(&account)
    })
}

#[tauri::command]
pub fn update_account(id: String, account: UpdateAccount) -> Result<Account, String> {
    with_db(|db| {
        db.as_ref()
            .ok_or("Database not initialized")?
            .update_account(&id, &account)
    })
}

#[tauri::command]
pub fn delete_account(id: String) -> Result<(), String> {
    with_db(|db| {
        db.as_ref()
            .ok_or("Database not initialized")?
            .delete_account(&id)
    })
}

#[tauri::command]
pub fn copy_account_fields(id: String) -> Result<u32, String> {
    // Get account data
    let account = with_db(|db| {
        db.as_ref()
            .ok_or("Database not initialized")?
            .get_account(&id)
            .and_then(|acc| acc.ok_or("Account not found".to_string()))
    })?;

    // Generate TOTP if secret exists
    let totp_code = if let Some(secret) = &account.totp_secret {
        match crate::totp::generate_totp(secret) {
            Ok(result) => Some(result.code),
            Err(e) => {
                log::warn!("Failed to generate TOTP for account {}: {}", account.id, e);
                None
            }
        }
    } else {
        None
    };

    // Prepare copy list in order
    let mut to_copy: Vec<String> = Vec::new();

    // 1. Username
    if !account.username.is_empty() {
        to_copy.push(account.username.clone());
    }

    // 2. Password
    if !account.password.is_empty() {
        to_copy.push(account.password.clone());
    }

    // 3. TOTP Code
    if let Some(code) = totp_code {
        to_copy.push(code);
    }

    // 4. API Key
    if let Some(api_key) = &account.api_key {
        if !api_key.is_empty() {
            to_copy.push(api_key.clone());
        }
    }

    // 5. Phone
    if let Some(phone) = &account.phone {
        if !phone.is_empty() {
            to_copy.push(phone.clone());
        }
    }

    // 6. Access Token
    if let Some(token) = &account.access_token {
        if !token.is_empty() {
            to_copy.push(token.clone());
        }
    }

    // 7. Notes
    if let Some(notes) = &account.notes {
        if !notes.is_empty() {
            to_copy.push(notes.clone());
        }
    }

    // Copy all to clipboard with delay
    let clipboard = ClipboardManager::new()?;
    let count = clipboard.copy_multiple(to_copy, 400)?;

    Ok(count)
}

#[tauri::command]
pub fn generate_totp_command(secret: String) -> Result<TotpResult, String> {
    crate::totp::generate_totp(&secret)
}
