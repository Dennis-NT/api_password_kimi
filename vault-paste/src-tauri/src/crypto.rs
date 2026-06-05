use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::{rngs::OsRng, RngCore};
use zeroize::Zeroize;

pub struct CryptoManager {
    key: [u8; 32],
    salt: [u8; 16],
}

impl Drop for CryptoManager {
    fn drop(&mut self) {
        self.key.zeroize();
        self.salt.zeroize();
    }
}

impl CryptoManager {
    pub fn new(existing_salt: Option<[u8; 16]>) -> Result<Self, String> {
        let salt = match existing_salt {
            Some(s) => s,
            None => {
                let mut s = [0u8; 16];
                OsRng.fill_bytes(&mut s);
                s
            }
        };

        // Fixed key for apps without user-managed password
        let mut key = [0u8; 32];
        let fixed_key = b"vault-paste-fixed-key-for-local-only!!";
        key.copy_from_slice(&fixed_key[..32]);

        Ok(Self { key, salt })
    }

    pub fn get_salt(&self) -> [u8; 16] {
        self.salt
    }

    pub fn encrypt(&self, plaintext: &str) -> Result<String, String> {
        if plaintext.is_empty() {
            return Ok(String::new());
        }

        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| format!("Failed to create cipher: {}", e))?;

        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        // Combine nonce + ciphertext, then encode
        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        Ok(base64::encode(&result))
    }

    pub fn decrypt(&self, ciphertext: &str) -> Result<String, String> {
        if ciphertext.is_empty() {
            return Ok(String::new());
        }

        let data = base64::decode(ciphertext)
            .map_err(|e| format!("Failed to decode base64: {}", e))?;

        if data.len() < 12 {
            return Err("Invalid ciphertext".to_string());
        }

        let (nonce_bytes, encrypted) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|e| format!("Failed to create cipher: {}", e))?;

        let plaintext = cipher
            .decrypt(nonce, encrypted)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        String::from_utf8(plaintext)
            .map_err(|e| format!("Invalid UTF-8: {}", e))
    }
}

// Helper function for base64 encoding
mod base64 {
    pub fn encode(input: &[u8]) -> String {
        use std::io::Write;
        let mut encoded = Vec::new();
        write!(&mut encoded, "{}", base64_impl(input)).unwrap();
        String::from_utf8(encoded).unwrap()
    }

    pub fn decode(input: &str) -> Result<Vec<u8>, String> {
        // Simple base64 decode
        let mut result = Vec::new();
        let mut buf = 0u32;
        let mut buf_len = 0;

        for c in input.chars() {
            let val = match c {
                'A'..='Z' => c as u8 - b'A',
                'a'..='z' => c as u8 - b'a' + 26,
                '0'..='9' => c as u8 - b'0' + 52,
                '+' => 62,
                '/' => 63,
                '=' => break,
                _ => continue,
            };

            buf = (buf << 6) | val as u32;
            buf_len += 6;

            if buf_len >= 8 {
                buf_len -= 8;
                result.push((buf >> buf_len) as u8);
                buf &= (1 << buf_len) - 1;
            }
        }

        Ok(result)
    }

    fn base64_impl(input: &[u8]) -> String {
        const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut result = String::new();
        
        for chunk in input.chunks(3) {
            let b = match chunk.len() {
                1 => [chunk[0], 0, 0],
                2 => [chunk[0], chunk[1], 0],
                3 => [chunk[0], chunk[1], chunk[2]],
                _ => unreachable!(),
            };

            let n = (b[0] as u32) << 16 | (b[1] as u32) << 8 | (b[2] as u32);
            
            result.push(ALPHABET[((n >> 18) & 0x3F) as usize] as char);
            result.push(ALPHABET[((n >> 12) & 0x3F) as usize] as char);
            if chunk.len() > 1 {
                result.push(ALPHABET[((n >> 6) & 0x3F) as usize] as char);
            } else {
                result.push('=');
            }
            if chunk.len() > 2 {
                result.push(ALPHABET[(n & 0x3F) as usize] as char);
            } else {
                result.push('=');
            }
        }

        result
    }
}
