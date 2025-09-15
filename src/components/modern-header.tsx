'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  RefreshCw,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface ModernHeaderProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  onMenuToggle: () => void
}

const ModernHeader = ({ title, subtitle, icon, onMenuToggle }: ModernHeaderProps) => {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Title */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث في النظام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-background/50 border-border/50 focus:bg-background"
                />
              </div>
            </form>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Search Button for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                // Implement mobile search
                console.log('Mobile search')
              }}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                // Implement notifications
                console.log('Notifications')
              }}
            >
              <Bell className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              title="تحديث الصفحة"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 space-x-reverse p-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-card-foreground">المدير</div>
                  <div className="text-xs text-muted-foreground">نظام العقارات</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50">
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/profile')
                      }}
                    >
                      <User className="w-4 h-4 ml-2" />
                      الملف الشخصي
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/settings')
                      }}
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      الإعدادات
                    </Button>
                    
                    <div className="border-t border-border my-2"></div>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernHeader