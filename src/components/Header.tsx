'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import SidebarToggle from './SidebarToggle'
import NavigationButtons from './NavigationButtons'

interface HeaderProps {
  title: string
  subtitle: string
  icon: string
  onMenuToggle: () => void
}

const Header = ({ title, subtitle, icon, onMenuToggle }: HeaderProps) => {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  return (
    <motion.div 
      className="bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Menu Toggle Button */}
            <SidebarToggle onToggle={onMenuToggle} />
            
            {/* Title */}
            <motion.div 
              className="flex items-center space-x-4 space-x-reverse"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground text-xl">{icon}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
              </div>
            </motion.div>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Navigation Buttons - Only show on non-dashboard pages */}
            {title !== 'لوحة التحكم' && (
              <NavigationButtons />
            )}
            
            {/* System Tab */}
            <div className="hidden md:flex items-center">
              <Button
                onClick={() => router.push('/system')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                title="إدارة النظام"
              >
                <span className="text-lg mr-2">⚙️</span>
                <span className="font-medium">النظام</span>
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2 space-x-reverse">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                className="hover:bg-accent"
                title="تحديث الصفحة"
              >
                <span className="text-muted-foreground">🔄</span>
              </Button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-accent"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-success to-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👤</span>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-foreground">المدير</div>
                  <div className="text-xs text-muted-foreground">نظام العقارات</div>
                </div>
                <span className="text-muted-foreground">▼</span>
              </Button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    className="absolute left-0 top-full mt-2 w-48 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/profile')
                        }}
                        className="w-full justify-start space-x-3 space-x-reverse p-3 hover:bg-accent"
                      >
                        <span className="text-lg">👤</span>
                        <span className="text-foreground">الملف الشخصي</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/settings')
                        }}
                        className="w-full justify-start space-x-3 space-x-reverse p-3 hover:bg-accent"
                      >
                        <span className="text-lg">⚙️</span>
                        <span className="text-foreground">الإعدادات</span>
                      </Button>
                      
                      <div className="border-t border-border my-2"></div>
                      
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowUserMenu(false)
                          handleLogout()
                        }}
                        className="w-full justify-start space-x-3 space-x-reverse p-3 hover:bg-destructive/10 text-destructive"
                      >
                        <span className="text-lg">🚪</span>
                        <span>تسجيل الخروج</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Header