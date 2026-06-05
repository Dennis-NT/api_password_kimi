use rusqlite::{params, Connection, OptionalExtension};
use std::path::Path;
use crate::crypto::CryptoManager;
use crate::models::{Account, NewAccount, UpdateAccount};

pub struct Database {
    conn: Connection,
    crypto: CryptoManager,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let conn = Connection::open(path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        let crypto = CryptoManager::new(None)?;
        let mut db = Self { conn, crypto };
        db.init_tables()?;
        
        Ok(db)
    }

    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let conn = Connection::open(path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        // Read salt from database header
        let salt_hex: String = conn
            .query_row(
                "SELECT value FROM metadata WHERE key = 'salt'",
                [],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("Failed to read salt: {}", e))?
            .ok_or("Database not initialized")?;

        let salt = hex::decode(&salt_hex)
            .map_err(|e| format!("Failed to decode salt: {}", e))?;

        if salt.len() != 16 {
            return Err("Invalid salt length".to_string());
        }

        let mut salt_array = [0u8; 16];
        salt_array.copy_from_slice(&salt);

        let crypto = CryptoManager::new(Some(salt_array))?;

        Ok(Self { conn, crypto })
    }

    fn init_tables(&mut self) -> Result<(), String> {
        // Create metadata table for salt and version info
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            )",
            [],
        ).map_err(|e| format!("Failed to create metadata table: {}", e))?;

        // Store salt
        let salt = self.crypto.get_salt();
        let salt_hex = hex::encode(&salt);
        self.conn.execute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES ('salt', ?1)",
            [&salt_hex],
        ).map_err(|e| format!("Failed to store salt: {}", e))?;

        // Store test value to verify password
        let test_encrypted = self.crypto.encrypt("test")?;
        self.conn.execute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES ('test', ?1)",
            [&test_encrypted],
        ).map_err(|e| format!("Failed to store test value: {}", e))?;

        // Create accounts table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                site_name TEXT NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                totp_secret TEXT,
                api_key TEXT,
                phone TEXT,
                access_token TEXT,
                notes TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        ).map_err(|e| format!("Failed to create accounts table: {}", e))?;

        // Create index for search
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_accounts_site_name ON accounts(site_name)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;

        Ok(())
    }

    fn merge_optional(update: Option<String>, existing: Option<String>) -> Option<String> {
        match update {
            Some(s) if s.is_empty() => None,
            Some(s) => Some(s),
            None => existing,
        }
    }

    pub fn add_account(&self, account: &NewAccount) -> Result<Account, String> {
        use uuid::Uuid;
        use chrono::Utc;

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp();

        // Filter out empty strings for optional fields
        let totp_secret = account.totp_secret.clone().filter(|s| !s.is_empty());
        let api_key = account.api_key.clone().filter(|s| !s.is_empty());
        let phone = account.phone.clone().filter(|s| !s.is_empty());
        let access_token = account.access_token.clone().filter(|s| !s.is_empty());
        let notes = account.notes.clone().filter(|s| !s.is_empty());

        // Encrypt sensitive fields
        let password_enc = self.crypto.encrypt(&account.password)?;
        let totp_secret_enc = totp_secret.as_ref()
            .map(|s| self.crypto.encrypt(s))
            .transpose()?;
        let api_key_enc = api_key.as_ref()
            .map(|s| self.crypto.encrypt(s))
            .transpose()?;
        let access_token_enc = access_token.as_ref()
            .map(|s| self.crypto.encrypt(s))
            .transpose()?;

        self.conn.execute(
            "INSERT INTO accounts (id, site_name, username, password, totp_secret, api_key, phone, access_token, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                id,
                account.site_name,
                account.username,
                password_enc,
                totp_secret_enc,
                api_key_enc,
                phone,
                access_token_enc,
                notes,
                now,
                now,
            ],
        ).map_err(|e| format!("Failed to insert account: {}", e))?;

        Ok(Account {
            id,
            site_name: account.site_name.clone(),
            username: account.username.clone(),
            password: account.password.clone(),
            totp_secret,
            api_key,
            phone,
            access_token,
            notes,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn get_accounts(&self, search: Option<&str>) -> Result<Vec<Account>, String> {
        let has_search = search.map(|s| !s.is_empty()).unwrap_or(false);
        
        if has_search {
            let sql = "SELECT id, site_name, username, password, totp_secret, api_key, phone, access_token, notes, created_at, updated_at 
                       FROM accounts WHERE site_name LIKE ?1 ORDER BY updated_at DESC";
            let mut stmt = self.conn.prepare(sql)
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;
            let pattern = format!("%{}%", search.unwrap());
            let rows = stmt.query_map([&pattern], |row| self.row_to_account(row));
            let accounts: Result<Vec<_>, _> = rows
                .map_err(|e| format!("Query failed: {}", e))?
                .collect();
            accounts.map_err(|e| format!("Failed to map row: {}", e))
        } else {
            let sql = "SELECT id, site_name, username, password, totp_secret, api_key, phone, access_token, notes, created_at, updated_at 
                       FROM accounts ORDER BY updated_at DESC";
            let mut stmt = self.conn.prepare(sql)
                .map_err(|e| format!("Failed to prepare statement: {}", e))?;
            let rows = stmt.query_map([], |row| self.row_to_account(row));
            let accounts: Result<Vec<_>, _> = rows
                .map_err(|e| format!("Query failed: {}", e))?
                .collect();
            accounts.map_err(|e| format!("Failed to map row: {}", e))
        }
    }

    pub fn get_account(&self, id: &str) -> Result<Option<Account>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, site_name, username, password, totp_secret, api_key, phone, access_token, notes, created_at, updated_at 
             FROM accounts WHERE id = ?1"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        stmt.query_row([id], |row| self.row_to_account(row))
            .optional()
            .map_err(|e| format!("Query failed: {}", e))
    }

    pub fn update_account(&self, id: &str, update: &UpdateAccount) -> Result<Account, String> {
        use chrono::Utc;

        let existing = self.get_account(id)?
            .ok_or("Account not found")?;

        let now = Utc::now().timestamp();

        let site_name = update.site_name.as_ref().unwrap_or(&existing.site_name);
        let username = update.username.as_ref().unwrap_or(&existing.username);
        let password = update.password.as_ref().unwrap_or(&existing.password);
        let totp_secret = Self::merge_optional(update.totp_secret.clone(), existing.totp_secret.clone());
        let api_key = Self::merge_optional(update.api_key.clone(), existing.api_key.clone());
        let phone = Self::merge_optional(update.phone.clone(), existing.phone.clone());
        let access_token = Self::merge_optional(update.access_token.clone(), existing.access_token.clone());
        let notes = Self::merge_optional(update.notes.clone(), existing.notes.clone());

        // Encrypt sensitive fields
        let password_enc = self.crypto.encrypt(password)?;
        let totp_secret_enc = totp_secret.as_ref().map(|s| self.crypto.encrypt(s)).transpose()?;
        let api_key_enc = api_key.as_ref().map(|s| self.crypto.encrypt(s)).transpose()?;
        let access_token_enc = access_token.as_ref().map(|s| self.crypto.encrypt(s)).transpose()?;

        self.conn.execute(
            "UPDATE accounts SET
                site_name = ?1,
                username = ?2,
                password = ?3,
                totp_secret = ?4,
                api_key = ?5,
                phone = ?6,
                access_token = ?7,
                notes = ?8,
                updated_at = ?9
             WHERE id = ?10",
            params![
                site_name,
                username,
                password_enc,
                totp_secret_enc,
                api_key_enc,
                phone,
                access_token_enc,
                notes,
                now,
                id,
            ],
        ).map_err(|e| format!("Failed to update account: {}", e))?;

        Ok(Account {
            id: id.to_string(),
            site_name: site_name.clone(),
            username: username.clone(),
            password: password.clone(),
            totp_secret: totp_secret.clone(),
            api_key: api_key.clone(),
            phone: phone.clone(),
            access_token: access_token.clone(),
            notes: notes.clone(),
            created_at: existing.created_at,
            updated_at: now,
        })
    }

    pub fn delete_account(&self, id: &str) -> Result<(), String> {
        self.conn.execute(
            "DELETE FROM accounts WHERE id = ?1",
            [id],
        ).map_err(|e| format!("Failed to delete account: {}", e))?;

        Ok(())
    }

    fn row_to_account(&self, row: &rusqlite::Row) -> Result<Account, rusqlite::Error> {
        // Decrypt sensitive fields
        let password_enc: String = row.get(3)?;
        let password = self.crypto.decrypt(&password_enc).unwrap_or_default();

        let totp_secret_enc: Option<String> = row.get(4)?;
        let totp_secret = totp_secret_enc
            .and_then(|s| self.crypto.decrypt(&s).ok());

        let api_key_enc: Option<String> = row.get(5)?;
        let api_key = api_key_enc
            .and_then(|s| self.crypto.decrypt(&s).ok());

        let access_token_enc: Option<String> = row.get(7)?;
        let access_token = access_token_enc
            .and_then(|s| self.crypto.decrypt(&s).ok());

        Ok(Account {
            id: row.get(0)?,
            site_name: row.get(1)?,
            username: row.get(2)?,
            password,
            totp_secret,
            api_key,
            phone: row.get(6)?,
            access_token,
            notes: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }
}

// Helper for hex encoding/decoding
mod hex {
    pub fn encode(data: &[u8]) -> String {
        data.iter()
            .map(|b| format!("{:02x}", b))
            .collect()
    }

    pub fn decode(s: &str) -> Result<Vec<u8>, String> {
        if s.len() % 2 != 0 {
            return Err("Invalid hex string length".to_string());
        }

        (0..s.len())
            .step_by(2)
            .map(|i| {
                u8::from_str_radix(&s[i..i + 2], 16)
                    .map_err(|e| format!("Invalid hex: {}", e))
            })
            .collect()
    }
}
