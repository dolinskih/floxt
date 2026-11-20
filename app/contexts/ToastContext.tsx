"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastOptions {
    type?: ToastType;
    title: string;
    message?: string;
    detail?: string;
    duration?: number;
}

interface ToastItem extends ToastOptions {
    id: number;
    type: ToastType;
    isLeaving: boolean;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextIdRef = useRef(1);
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const dismissToast = useCallback((id: number) => {
        const existingTimer = timersRef.current.get(id);
        if (existingTimer) {
            clearTimeout(existingTimer);
            timersRef.current.delete(id);
        }

        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
        );

        const removeTimer = setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            timersRef.current.delete(id);
        }, 180);

        timersRef.current.set(id, removeTimer);
    }, []);

    const showToast = useCallback(
        (options: ToastOptions) => {
            const id = nextIdRef.current++;
            const duration = options.duration ?? 4000;
            const newToast: ToastItem = {
                ...options,
                id,
                type: options.type ?? "success",
                isLeaving: false,
            };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                const timer = setTimeout(() => {
                    dismissToast(id);
                }, duration);
                timersRef.current.set(id, timer);
            }
        },
        [dismissToast]
    );

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <style jsx global>{`
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(6px) scale(0.96);
                    }
                }
                .anim-toast-in {
                    animation: toastSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .anim-toast-out {
                    animation: toastSlideOut 180ms ease-in forwards;
                }
            `}</style>

            {toasts.length > 0 && (
                <div
                    className="fixed bottom-5 right-5 z-[10001] flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
                    aria-live="polite"
                    aria-atomic="false"
                >
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            role={toast.type === "error" ? "alert" : "status"}
                            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-colors ${
                                toast.isLeaving ? "anim-toast-out" : "anim-toast-in"
                            } ${
                                toast.type === "error"
                                    ? "bg-white/95 dark:bg-neutral-900/95 border-red-300 dark:border-red-800/80"
                                    : "bg-white/95 dark:bg-neutral-900/95 border-neutral-300 dark:border-neutral-700"
                            }`}
                        >
                            {toast.type === "error" ? (
                                <AlertCircle
                                    size={18}
                                    className="text-red-500 dark:text-red-400 shrink-0 mt-0.5"
                                />
                            ) : (
                                <CheckCircle2
                                    size={18}
                                    className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                                />
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
                                    {toast.title}
                                </p>
                                {toast.message && (
                                    <p
                                        className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 truncate"
                                        title={toast.detail || toast.message}
                                    >
                                        {toast.message}
                                    </p>
                                )}
                                {toast.detail && (
                                    <p
                                        className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate font-mono"
                                        title={toast.detail}
                                    >
                                        {toast.detail}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => dismissToast(toast.id)}
                                aria-label="Dismiss notification"
                                className="p-0.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
