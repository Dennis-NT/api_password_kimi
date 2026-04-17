use arboard::Clipboard;
use std::thread;
use std::time::Duration;

pub struct ClipboardManager;

impl ClipboardManager {
    pub fn new() -> Result<Self, String> {
        Ok(Self)
    }

    pub fn copy_text(&self, text: &str) -> Result<(), String> {
        let mut clipboard = Clipboard::new()
            .map_err(|e| format!("Failed to access clipboard: {}", e))?;
        
        clipboard.set_text(text)
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
        
        Ok(())
    }

    pub fn copy_multiple(&self, texts: Vec<String>, delay_ms: u64) -> Result<u32, String> {
        let mut count = 0u32;
        
        for text in texts {
            if text.is_empty() {
                continue;
            }
            
            // Create a fresh Clipboard handle each time so Windows sees a distinct
            // open/set/close cycle. Windows Clipboard History relies on CloseClipboard
            // to record a new entry, and keeping one handle open across the loop can
            // cause intermediate items to be lost.
            let mut clipboard = Clipboard::new()
                .map_err(|e| format!("Failed to access clipboard: {}", e))?;
            
            clipboard.set_text(&text)
                .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
            count += 1;
            
            if delay_ms > 0 {
                thread::sleep(Duration::from_millis(delay_ms));
            }
        }
        
        // Hold the final clipboard content a bit longer to ensure the last item is recorded.
        thread::sleep(Duration::from_millis(500));
        
        Ok(count)
    }
}
