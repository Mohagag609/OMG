'use client'

import React, { Suspense, memo } from 'react'
import { motion } from 'framer-motion'

// FIXED: Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
}

const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  text = 'جاري التحميل...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {text && (
        <motion.p
          className="mt-4 text-gray-600 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

// FIXED: Skeleton loader for different content types
interface SkeletonProps {
  type?: 'text' | 'card' | 'table' | 'form'
  lines?: number
  className?: string
}

const Skeleton = memo<SkeletonProps>(({ 
  type = 'text', 
  lines = 3, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        )

      case 'table':
        return (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-100 border-b"></div>
              {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="h-16 border-b last:border-b-0">
                  <div className="flex items-center h-full px-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'form':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="animate-pulse space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )

      default: // text
        return (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={`h-4 bg-gray-200 rounded ${
                  i === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {renderSkeleton()}
    </motion.div>
  )
})

Skeleton.displayName = 'Skeleton'

// FIXED: Enhanced Suspense wrapper
interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingText?: string
  skeletonType?: SkeletonProps['type']
  skeletonLines?: number
  className?: string
}

const SuspenseWrapper = memo<SuspenseWrapperProps>(({
  children,
  fallback,
  loadingText = 'جاري التحميل...',
  skeletonType = 'card',
  skeletonLines = 3,
  className = ''
}) => {
  const defaultFallback = (
    <div className={className}>
      <LoadingSpinner text={loadingText} />
      <Skeleton type={skeletonType} lines={skeletonLines} className="mt-4" />
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
})

SuspenseWrapper.displayName = 'SuspenseWrapper'

// FIXED: Lazy loading wrapper
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    loadingText?: string
    skeletonType?: SkeletonProps['type']
    skeletonLines?: number
  }
) {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
  )

  const WrappedComponent = (props: P) => (
    <SuspenseWrapper
      loadingText={options?.loadingText}
      skeletonType={options?.skeletonType}
      skeletonLines={options?.skeletonLines}
    >
      <LazyComponent {...props} />
    </SuspenseWrapper>
  )
  
  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`
  return WrappedComponent
}

export { LoadingSpinner, Skeleton, SuspenseWrapper }
export default SuspenseWrapper