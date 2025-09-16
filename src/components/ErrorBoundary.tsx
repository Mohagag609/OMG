'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'

// FIXED: Error boundary interface
interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// FIXED: Error boundary component for better error handling
class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // FIXED: Call onError callback if provided
    this.props.onError?.(error, errorInfo)

    // FIXED: Log error in development
    if (process.env.NODE_ENV === 'development') {
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // FIXED: Reset error boundary when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      )

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <motion.div
          className="error-boundary"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                ⚠️
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                حدث خطأ غير متوقع
              </h2>
              
              <p className="text-gray-600 mb-6">
                نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو تحديث الصفحة.
              </p>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {error.toString()}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={this.resetErrorBoundary}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 المحاولة مرة أخرى
                </motion.button>
                
                <motion.button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 تحديث الصفحة
                </motion.button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                إذا استمر هذا الخطأ، يرجى التواصل مع الدعم الفني
              </div>
            </div>
          </div>
        </motion.div>
      )
    }

    return children
  }
}

// FIXED: Hook for error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    
    // You can add error reporting service here
    // Example: Sentry.captureException(error)
  }
}

// FIXED: Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary