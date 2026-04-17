import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ToastMessage } from "../types";

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border min-w-[300px] max-w-[400px]
        animate-slide-up
        ${toast.type === "success" ? "bg-success/10 border-success/20 text-success" : ""}
        ${toast.type === "error" ? "bg-danger/10 border-danger/20 text-danger" : ""}
        ${toast.type === "info" ? "bg-primary/10 border-primary/20 text-primary" : ""}
      `}
    >
      {toast.type === "success" && <CheckCircle className="w-5 h-5 shrink-0" />}
      {toast.type === "error" && <XCircle className="w-5 h-5 shrink-0" />}
      {toast.type === "info" && <Info className="w-5 h-5 shrink-0" />}
      
      <div className="flex-1 min-w-0">
        <p className="font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-80 mt-1">{toast.message}</p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id, duration: toast.duration ?? 3000 };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
