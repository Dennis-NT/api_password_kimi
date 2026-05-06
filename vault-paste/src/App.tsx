import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2 } from "lucide-react";
import { ToastProvider } from "./hooks/useToast";
import { MainView } from "./components/MainView";

const DEFAULT_PASSWORD = "vaultpaste";

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Auto unlock database on startup
  useEffect(() => {
    const autoUnlock = async () => {
      try {
        const initialized = await invoke<boolean>("check_database_exists");
        if (initialized) {
          try {
            await invoke("unlock_database", { password: DEFAULT_PASSWORD });
          } catch {
            // Old database with different password - delete and recreate
            await invoke("delete_database");
            await invoke("create_database", { password: DEFAULT_PASSWORD });
          }
        } else {
          await invoke("create_database", { password: DEFAULT_PASSWORD });
        }
        setIsLocked(false);
      } catch (error) {
        console.error("Auto unlock failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    autoUnlock();
  }, []);

  const handleLock = useCallback(() => {
    setIsLocked(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {isLocked ? (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-text-secondary">无法加载数据库，请重启应用</p>
          </div>
        ) : (
          <MainView onLock={handleLock} />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
