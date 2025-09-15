'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Users, 
  Building2, 
  FileText, 
  Handshake, 
  Calendar, 
  Receipt, 
  UserCheck, 
  DollarSign, 
  Banknote, 
  BarChart3, 
  Database,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface ModernSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const ModernSidebar = ({ isOpen, onToggle }: ModernSidebarProps) => {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: Home,
      path: '/',
      description: 'نظرة عامة على النظام',
      badge: null
    },
    {
      title: 'العملاء',
      icon: Users,
      path: '/customers',
      description: 'إدارة العملاء',
      badge: null
    },
    {
      title: 'الوحدات',
      icon: Building2,
      path: '/units',
      description: 'إدارة الوحدات العقارية',
      badge: null
    },
    {
      title: 'العقود',
      icon: FileText,
      path: '/contracts',
      description: 'إدارة العقود والمبيعات',
      badge: null
    },
    {
      title: 'السماسرة',
      icon: Handshake,
      path: '/brokers',
      description: 'إدارة السماسرة والعمولات',
      badge: null
    },
    {
      title: 'الأقساط',
      icon: Calendar,
      path: '/installments',
      description: 'إدارة الأقساط والتحصيل',
      badge: 'جديد'
    },
    {
      title: 'السندات',
      icon: Receipt,
      path: '/vouchers',
      description: 'سندات القبض والدفع',
      badge: null
    },
    {
      title: 'الشركاء',
      icon: UserCheck,
      path: '/partners',
      description: 'إدارة الشركاء والمجموعات',
      badge: null
    },
    {
      title: 'ديون الشركاء',
      icon: DollarSign,
      path: '/partner-debts',
      description: 'إدارة ديون الشركاء',
      badge: null
    },
    {
      title: 'الخزينة',
      icon: Banknote,
      path: '/treasury',
      description: 'إدارة الخزائن والمعاملات',
      badge: null
    },
    {
      title: 'التقارير',
      icon: BarChart3,
      path: '/reports',
      description: 'التقارير والإحصائيات',
      badge: null
    },
    {
      title: 'النسخ الاحتياطية',
      icon: Database,
      path: '/backup-system',
      description: 'نظام النسخ الاحتياطية والاستعادة',
      badge: null
    }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full bg-card border-l border-border shadow-2xl z-50 transition-all duration-300 ease-in-out",
        isOpen ? 'translate-x-0' : 'translate-x-full',
        "w-80 lg:w-72"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">نظام العقارات</h1>
              <p className="text-xs text-muted-foreground">إدارة متطورة</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Button
                key={index}
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-4 text-right",
                  active && "bg-primary text-primary-foreground shadow-md"
                )}
                onClick={() => {
                  router.push(item.path)
                  if (window.innerWidth < 1024) {
                    onToggle()
                  }
                }}
              >
                <div className="flex items-center space-x-3 space-x-reverse w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    active 
                      ? "bg-primary-foreground/20" 
                      : "bg-muted group-hover:bg-muted/80"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="font-medium flex items-center justify-between">
                      {item.title}
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div className={cn(
                      "text-xs",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/50">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">
              آخر تحديث: {new Date().toLocaleString('ar-SA')}
            </div>
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">النظام يعمل بشكل طبيعي</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ModernSidebar