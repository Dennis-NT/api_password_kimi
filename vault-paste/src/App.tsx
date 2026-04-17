import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2 } from "lucide-react";
import { ToastProvider } from "./hooks/useToast";
import { UnlockView } from "./components/UnlockView";
import { MainView } from "./components/MainView";

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if database exists
  useEffect(() => {
    const checkInit = async () => {
      try {
        const initialized = await invoke<boolean>("check_database_exists");
        setIsInitialized(initialized);
      } catch (error) {
        console.error("Failed to check database:", error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkInit();
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
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
          <UnlockView 
            isInitialized={isInitialized ?? false} 
            onUnlock={handleUnlock} 
          />
        ) : (
          <MainView onLock={handleLock} />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
