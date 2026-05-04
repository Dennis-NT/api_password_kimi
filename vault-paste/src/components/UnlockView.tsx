import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { useToast } from "../hooks/useToast";


interface UnlockViewProps {
  isInitialized: boolean;
  onUnlock: () => void;
}

export function UnlockView({ isInitialized, onUnlock }: UnlockViewProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      showToast({ type: "error", title: "请输入密码" });
      return;
    }

    if (!isInitialized && password !== confirmPassword) {
      showToast({ type: "error", title: "两次输入的密码不一致" });
      return;
    }

    if (!isInitialized && password.length < 6) {
      showToast({ type: "error", title: "密码至少需要 6 位" });
      return;
    }

    setIsLoading(true);

    try {
      if (isInitialized) {
        await invoke("unlock_database", { password });
      } else {
        await invoke("create_database", { password });
      }
      showToast({ type: "success", title: isInitialized ? "解锁成功" : "数据库创建成功" });
      onUnlock();
    } catch (error) {
      showToast({ 
        type: "error", 
        title: isInitialized ? "密码错误" : "创建失败", 
        message: String(error) 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">VaultPaste</h1>
          <p className="text-text-secondary">
            {isInitialized ? "输入主密码解锁数据库" : "设置主密码创建数据库"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="主密码"
              className="input pl-12 pr-12"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isInitialized && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认密码"
                className="input pl-12"
                disabled={isLoading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                {isInitialized ? "解锁" : "创建数据库"}
              </>
            )}
          </button>
        </form>

        {/* Security Tips */}
        {!isInitialized && (
          <div className="mt-6 p-4 bg-surface border border-border rounded-lg">
            <h3 className="text-sm font-medium text-text mb-2">安全提示</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• 密码用于加密数据库，丢失无法恢复</li>
              <li>• 建议密码长度至少 6 位</li>
              <li>• 定期备份数据库文件</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
