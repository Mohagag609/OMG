'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavigationButtons from './NavigationButtons'

interface HeaderProps {
  title: string
  subtitle: string
  icon: string
  currentPath: string
}

const Header = ({ title, subtitle, icon, currentPath }: HeaderProps) => {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNavMenu, setShowNavMenu] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  const navigationItems = [
    { title: 'لوحة التحكم', icon: '🏠', path: '/', description: 'نظرة عامة على النظام' },
    { title: 'العملاء', icon: '👤', path: '/customers', description: 'إدارة العملاء' },
    { title: 'الوحدات', icon: '🏢', path: '/units', description: 'إدارة الوحدات العقارية' },
    { title: 'العقود', icon: '📋', path: '/contracts', description: 'إدارة العقود والمبيعات' },
    { title: 'السماسرة', icon: '🤝', path: '/brokers', description: 'إدارة السماسرة والعمولات' },
    { title: 'الأقساط', icon: '📅', path: '/installments', description: 'إدارة الأقساط والتحصيل' },
    { title: 'السندات', icon: '📄', path: '/vouchers', description: 'سندات القبض والدفع' },
    { title: 'الشركاء', icon: '👥', path: '/partners', description: 'إدارة الشركاء والمجموعات' },
    { title: 'ديون الشركاء', icon: '💰', path: '/partner-debts', description: 'إدارة ديون الشركاء' },
    { title: 'الخزينة', icon: '🏦', path: '/treasury', description: 'إدارة الخزائن والمعاملات' },
    { title: 'التقارير', icon: '📊', path: '/reports', description: 'التقارير والإحصائيات' },
    { title: 'النسخ الاحتياطية', icon: '🔄', path: '/backup-system', description: 'نظام النسخ الاحتياطية والاستعادة' }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/'
    }
    return currentPath.startsWith(path)
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and Navigation */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Title */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">{icon}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600">{subtitle}</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-2 space-x-reverse">
              {navigationItems.slice(0, 6).map((item, index) => (
                <button
                  key={index}
                  onClick={() => router.push(item.path)}
                  className={`
                    flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105
                    ${isActive(item.path) 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                    }
                  `}
                  title={item.description}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm font-medium">{item.title}</span>
                </button>
              ))}
              
              {/* More Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowNavMenu(!showNavMenu)}
                  className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-all duration-200 hover:scale-105"
                >
                  <span className="text-sm">📋</span>
                  <span className="text-sm font-medium">المزيد</span>
                  <span className="text-xs">▼</span>
                </button>

                {/* More Dropdown */}
                {showNavMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl shadow-gray-900/10 z-50">
                    <div className="p-2">
                      {navigationItems.slice(6).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            router.push(item.path)
                            setShowNavMenu(false)
                          }}
                          className={`
                            w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors duration-200
                            ${isActive(item.path) 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'hover:bg-gray-50 text-gray-700'
                            }
                          `}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <div className="text-right">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Mobile Navigation Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowNavMenu(!showNavMenu)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                title="القائمة"
              >
                <span className="text-gray-600">☰</span>
              </button>
            </div>

            {/* Navigation Buttons - Only show on non-dashboard pages */}
            {title !== 'لوحة التحكم' && (
              <NavigationButtons />
            )}
            
            {/* System Tab */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => router.push('/system')}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg"
                title="إدارة النظام"
              >
                <span className="text-lg">⚙️</span>
                <span className="font-medium">النظام</span>
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => window.location.reload()}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                title="تحديث الصفحة"
              >
                <span className="text-gray-600">🔄</span>
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 space-x-reverse p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👤</span>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-gray-900">المدير</div>
                  <div className="text-xs text-gray-500">نظام العقارات</div>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl shadow-gray-900/10 z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/profile')
                      }}
                      className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-lg">👤</span>
                      <span className="text-gray-700">الملف الشخصي</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/settings')
                      }}
                      className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-lg">⚙️</span>
                      <span className="text-gray-700">الإعدادات</span>
                    </button>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors duration-200"
                    >
                      <span className="text-lg">🚪</span>
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showNavMenu && (
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    router.push(item.path)
                    setShowNavMenu(false)
                  }}
                  className={`
                    flex items-center space-x-2 space-x-reverse p-3 rounded-lg transition-all duration-200
                    ${isActive(item.path) 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  <span className="text-sm">{item.icon}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Header