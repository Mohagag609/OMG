'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface LayoutContextType {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  currentPage: {
    title: string
    subtitle: string
    icon: string
  }
  setCurrentPage: (page: { title: string; subtitle: string; icon: string }) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

interface LayoutProviderProps {
  children: ReactNode
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState({
    title: 'لوحة التحكم',
    subtitle: 'نظام إدارة العقارات المتطور',
    icon: '🏢'
  })
  const router = useRouter()
  const pathname = usePathname()

  // Handle sidebar state based on route
  useEffect(() => {
    const handleRouteChange = () => {
      // Always open sidebar on dashboard, close on mobile
      if (pathname === '/') {
        setSidebarOpen(window.innerWidth >= 1024)
      } else if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    // Set initial state when component mounts
    handleRouteChange()

    // Listen for window resize
    const handleResize = () => {
      handleRouteChange()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pathname])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'u':
            e.preventDefault()
            router.push('/units')
            break
          case 'p':
            e.preventDefault()
            router.push('/partners')
            break
          case 'c':
            e.preventDefault()
            router.push('/contracts')
            break
          case 't':
            e.preventDefault()
            router.push('/treasury')
            break
          case 'i':
            e.preventDefault()
            router.push('/installments')
            break
          case 's':
            e.preventDefault()
            router.push('/customers')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen, router])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        currentPage,
        setCurrentPage
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}