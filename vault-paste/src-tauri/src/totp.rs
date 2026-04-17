use totp_rs::{Algorithm, Secret, TOTP};
use crate::models::TotpResult;

pub fn generate_totp(secret: &str) -> Result<TotpResult, String> {
    // Support otpauth:// URIs by extracting the secret parameter
    let secret_raw = if secret.starts_with("otpauth://") {
        extract_secret_from_otpauth(secret)
            .ok_or("Invalid otpauth URI: missing secret")?
    } else {
        secret.to_string()
    };

    // Remove spaces and convert to uppercase
    let secret_clean = secret_raw.replace(" ", "").to_uppercase();

    let secret_bytes = Secret::Encoded(secret_clean)
        .to_bytes()
        .map_err(|e| format!("Invalid TOTP secret: {}", e))?;

    let totp = TOTP::new_unchecked(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("VaultPaste".to_string()),
        "Account".to_string(),
    );

    let code = totp.generate_current()
        .map_err(|e| format!("Failed to generate code: {}", e))?;

    // Calculate remaining seconds
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Time error: {}", e))?
        .as_secs();
    
    let remaining = 30 - (now % 30);

    Ok(TotpResult {
        code,
        remaining,
    })
}

fn extract_secret_from_otpauth(uri: &str) -> Option<String> {
    // otpauth://totp/...?secret=XXXX&...
    uri.split('&')
        .find(|part| part.starts_with("secret="))
        .map(|part| part.trim_start_matches("secret=").to_string())
        .or_else(|| {
            // secret might be the last parameter without trailing &
            uri.split('?')
                .nth(1)?
                .split('&')
                .find(|part| part.starts_with("secret="))
                .map(|part| part.trim_start_matches("secret=").to_string())
        })
}

#[allow(dead_code)]
pub fn generate_secret() -> String {
    let secret = Secret::generate_secret();
    secret.to_encoded().to_string()
}
