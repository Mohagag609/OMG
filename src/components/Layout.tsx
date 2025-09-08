'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  icon: string
}

const Layout = ({ children, title, subtitle, icon }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Close sidebar on route change and when returning to dashboard
  useEffect(() => {
    const handleRouteChange = () => {
      // Always close sidebar when returning to dashboard
      if (window.location.pathname === '/') {
        setSidebarOpen(false)
      } else if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    // Listen for route changes
    const originalPush = router.push
    router.push = (...args) => {
      handleRouteChange()
      return originalPush.apply(router, args)
    }

    // Also close sidebar when component mounts (dashboard load)
    handleRouteChange()

    return () => {
      router.push = originalPush
    }
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'n':
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          icon={icon}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout