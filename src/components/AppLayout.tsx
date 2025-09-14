'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLayout } from '@/contexts/LayoutContext'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { sidebarOpen, setSidebarOpen, currentPage } = useLayout()
  const router = useRouter()
  const pathname = usePathname()

  // Page configurations
  const pageConfigs: { [key: string]: { title: string; subtitle: string; icon: string } } = {
    '/': { title: 'لوحة التحكم', subtitle: 'نظام إدارة العقارات المتطور', icon: '🏢' },
    '/customers': { title: 'العملاء', subtitle: 'إدارة العملاء والمستثمرين', icon: '👤' },
    '/units': { title: 'الوحدات', subtitle: 'إدارة الوحدات العقارية', icon: '🏢' },
    '/contracts': { title: 'العقود', subtitle: 'إدارة العقود والمبيعات', icon: '📋' },
    '/brokers': { title: 'السماسرة', subtitle: 'إدارة السماسرة والعمولات', icon: '🤝' },
    '/installments': { title: 'الأقساط', subtitle: 'إدارة الأقساط والتحصيل', icon: '📅' },
    '/vouchers': { title: 'السندات', subtitle: 'سندات القبض والدفع', icon: '📄' },
    '/partners': { title: 'الشركاء', subtitle: 'إدارة الشركاء والمجموعات', icon: '👥' },
    '/partner-debts': { title: 'ديون الشركاء', subtitle: 'إدارة ديون الشركاء', icon: '💰' },
    '/treasury': { title: 'الخزينة', subtitle: 'إدارة الخزائن والمعاملات', icon: '🏦' },
    '/reports': { title: 'التقارير', subtitle: 'التقارير والإحصائيات', icon: '📊' },
    '/reports/cashflow': { title: 'تدفقات الشركاء', subtitle: 'تقرير التدفقات النقدية للشركاء', icon: '💰' },
    '/reports/detailed': { title: 'التقرير المفصل', subtitle: 'تقرير مفصل للأقساط والشركاء', icon: '📋' },
    '/backup-system': { title: 'النسخ الاحتياطية', subtitle: 'نظام النسخ الاحتياطية والاستعادة', icon: '🔄' },
    '/settings': { title: 'الإعدادات', subtitle: 'إعدادات النظام', icon: '⚙️' },
    '/profile': { title: 'الملف الشخصي', subtitle: 'إدارة الملف الشخصي', icon: '👤' },
    '/system': { title: 'إدارة النظام', subtitle: 'إعدادات وإدارة النظام', icon: '⚙️' },
    '/audit': { title: 'سجل العمليات', subtitle: 'تتبع العمليات والتغييرات', icon: '📝' },
    '/test-connection': { title: 'اختبار الاتصال', subtitle: 'اختبار اتصال قاعدة البيانات', icon: '🔗' },
    '/debug-treasury': { title: 'تصحيح الخزينة', subtitle: 'أدوات تصحيح الخزينة', icon: '🔧' },
    '/test-safes': { title: 'اختبار الخزائن', subtitle: 'اختبار وإدارة الخزائن', icon: '🏦' }
  }

  // Update page info when route changes
  useEffect(() => {
    const config = pageConfigs[pathname] || pageConfigs['/']
    // This will be handled by the context, but we can set it here for immediate update
  }, [pathname])

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token && pathname !== '/login' && pathname !== '/forgot-password' && pathname !== '/reset-password') {
      router.push('/login')
    }
  }, [pathname, router])

  // Don't show layout for auth pages
  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return <>{children}</>
  }

  const config = pageConfigs[pathname] || pageConfigs['/']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <Header 
          title={config.title}
          subtitle={config.subtitle}
          icon={config.icon}
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

export default AppLayout