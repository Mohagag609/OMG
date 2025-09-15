'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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

  // Handle sidebar state based on route
  useEffect(() => {
    const handleRouteChange = () => {
      // Always open sidebar on dashboard, close on mobile
      if (window.location.pathname === '/') {
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
  }, [])

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

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <motion.div 
        className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          icon={icon}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Page Content */}
        <motion.div 
          className="max-w-7xl mx-auto px-6 py-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Layout