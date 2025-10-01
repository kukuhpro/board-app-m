'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastProps, ToastType } from '@/components/atoms/Toast'
import ToastContainer from '@/components/organisms/ToastContainer'

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  hideToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9)

    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onClose: hideToast
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const value = {
    showToast,
    hideToast,
    clearAllToasts
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}