"use client"

import { useState, createContext, useContext } from "react"

type ToastVariant = "default" | "destructive" | "success"

interface Toast {
    id: string
    title: string
    description?: string
    variant?: ToastVariant
}

interface ToastContextType {
    toasts: Toast[]
    toast: (props: Omit<Toast, "id">) => void
    dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { id, title, description, variant }
        setToasts((prev) => [...prev, newToast])

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            dismiss(id)
        }, 5000)

        return id
    }

    const dismiss = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            {toasts.length > 0 && (
                <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`p-4 rounded-md shadow-md max-w-md transform transition-all duration-300 ease-in-out ${toast.variant === "destructive"
                                    ? "bg-red-100 border-l-4 border-red-500 text-red-700"
                                    : toast.variant === "success"
                                        ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                                        : "bg-white border-l-4 border-blue-500 text-gray-700"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">{toast.title}</h3>
                                    {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
                                </div>
                                <button
                                    onClick={() => dismiss(toast.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
