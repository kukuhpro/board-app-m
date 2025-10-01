import { useToast } from '@/contexts/ToastContext'
import { useCallback } from 'react'

/**
 * Custom hook for showing common toast notifications
 */
export const useToastNotification = () => {
  const { showToast } = useToast()

  const success = useCallback((title: string, message?: string) => {
    showToast('success', title, message)
  }, [showToast])

  const error = useCallback((title: string, message?: string) => {
    showToast('error', title, message)
  }, [showToast])

  const warning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message)
  }, [showToast])

  const info = useCallback((title: string, message?: string) => {
    showToast('info', title, message)
  }, [showToast])

  // Common application toasts
  const jobCreated = useCallback(() => {
    success('Job Created', 'Your job posting has been successfully created and is now live.')
  }, [success])

  const jobUpdated = useCallback(() => {
    success('Job Updated', 'Your job posting has been successfully updated.')
  }, [success])

  const jobDeleted = useCallback(() => {
    success('Job Deleted', 'Your job posting has been successfully removed.')
  }, [success])

  const authSuccess = useCallback((action: 'login' | 'register' | 'logout') => {
    const messages = {
      login: 'Welcome back! You have been successfully logged in.',
      register: 'Account created! Welcome to Job Board.',
      logout: 'You have been successfully logged out.'
    }
    success(`${action === 'login' ? 'Logged In' : action === 'register' ? 'Account Created' : 'Logged Out'}`, messages[action])
  }, [success])

  const networkError = useCallback(() => {
    error('Network Error', 'Unable to connect to the server. Please check your internet connection and try again.')
  }, [error])

  const validationError = useCallback((message?: string) => {
    error('Validation Error', message || 'Please check your input and try again.')
  }, [error])

  const permissionError = useCallback(() => {
    error('Permission Denied', 'You do not have permission to perform this action.')
  }, [error])

  const notFoundError = useCallback((resource: string = 'Resource') => {
    error('Not Found', `${resource} not found. It may have been moved or deleted.`)
  }, [error])

  return {
    success,
    error,
    warning,
    info,
    jobCreated,
    jobUpdated,
    jobDeleted,
    authSuccess,
    networkError,
    validationError,
    permissionError,
    notFoundError
  }
}