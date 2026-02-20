import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  details?: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
  };

  const bgMap = {
    success: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",
    error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
    warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700",
  };

  const textMap = {
    success: "text-green-800 dark:text-green-200",
    error: "text-red-800 dark:text-red-200",
    info: "text-blue-800 dark:text-blue-200",
    warning: "text-yellow-800 dark:text-yellow-200",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex items-start gap-3 shadow-lg max-w-md animate-in fade-in slide-in-from-right-5",
        bgMap[toast.type]
      )}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm", textMap[toast.type])}>
          {toast.message}
        </p>
        {toast.details && (
          <p className={cn("text-xs mt-1 opacity-90", textMap[toast.type])}>
            {toast.details}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className={cn(
          "flex-shrink-0 opacity-50 hover:opacity-100 transition",
          textMap[toast.type]
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration ?? 4000 }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, details?: string) => {
    return addToast({ message, type: "success", details, duration: 4000 });
  };

  const error = (message: string, details?: string) => {
    return addToast({ message, type: "error", details, duration: 5000 });
  };

  const info = (message: string, details?: string) => {
    return addToast({ message, type: "info", details, duration: 3000 });
  };

  const warning = (message: string, details?: string) => {
    return addToast({ message, type: "warning", details, duration: 4000 });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}
