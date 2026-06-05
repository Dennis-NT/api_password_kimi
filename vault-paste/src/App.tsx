import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, Lock, Unlock } from "lucide-react";
import { ToastProvider } from "./hooks/useToast";
import { MainView } from "./components/MainView";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);

  // Auto initialize database on startup
  useEffect(() => {
    const initDb = async () => {
      try {
        const exists = await invoke<boolean>("check_database_exists");
        if (exists) {
          await invoke("unlock_database");
        } else {
          await invoke("create_database");
        }
        setIsLocked(false);
      } catch (error) {
        console.error("Database init failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initDb();
  }, []);

  const handleLock = useCallback(() => {
    setIsLocked(true);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
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
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text mb-2">已锁定</h1>
              <p className="text-text-secondary mb-6">点击下方按钮解锁应用</p>
              <button
                onClick={handleUnlock}
                className="btn-primary px-8 py-3 inline-flex items-center gap-2"
              >
                <Unlock className="w-5 h-5" />
                解锁
              </button>
            </div>
          </div>
        ) : (
          <MainView onLock={handleLock} />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
