'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: '🏠',
      path: '/',
      description: 'نظرة عامة على النظام'
    },
    {
      title: 'العملاء',
      icon: '👤',
      path: '/customers',
      description: 'إدارة العملاء'
    },
    {
      title: 'الوحدات',
      icon: '🏢',
      path: '/units',
      description: 'إدارة الوحدات العقارية'
    },
    {
      title: 'العقود',
      icon: '📋',
      path: '/contracts',
      description: 'إدارة العقود والمبيعات'
    },
    {
      title: 'السماسرة',
      icon: '🤝',
      path: '/brokers',
      description: 'إدارة السماسرة والعمولات'
    },
    {
      title: 'الأقساط',
      icon: '📅',
      path: '/installments',
      description: 'إدارة الأقساط والتحصيل'
    },
    {
      title: 'السندات',
      icon: '📄',
      path: '/vouchers',
      description: 'سندات القبض والدفع'
    },
    {
      title: 'الشركاء',
      icon: '👥',
      path: '/partners',
      description: 'إدارة الشركاء والمجموعات'
    },
    {
      title: 'ديون الشركاء',
      icon: '💰',
      path: '/partner-debts',
      description: 'إدارة ديون الشركاء'
    },
    {
      title: 'الخزينة',
      icon: '🏦',
      path: '/treasury',
      description: 'إدارة الخزائن والمعاملات'
    },
    {
      title: 'التقارير',
      icon: '📊',
      path: '/reports',
      description: 'التقارير والإحصائيات'
    },
      {
        title: 'تدفقات الشركاء',
        icon: '💰',
        path: '/reports/cashflow',
        description: 'تقرير التدفقات النقدية للشركاء'
      },
      {
        title: 'التقرير المفصل',
        icon: '📋',
        path: '/reports/detailed',
        description: 'تقرير مفصل للأقساط والشركاء'
      },
    {
      title: 'النسخ الاحتياطية',
      icon: '🔄',
      path: '/backup-system',
      description: 'نظام النسخ الاحتياطية والاستعادة'
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
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={`
          fixed top-0 right-0 h-full bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-2xl z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          w-80 lg:w-72
        `}
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between p-6 border-b border-border/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground text-lg">🏢</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">نظام العقارات</h1>
              <p className="text-xs text-muted-foreground">إدارة متطورة</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-8 h-8 hover:bg-accent"
          >
            <span className="text-muted-foreground">✕</span>
          </Button>
        </motion.div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <Button
                onClick={() => {
                  router.push(item.path)
                  if (window.innerWidth < 1024) {
                    onToggle()
                  }
                }}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`
                  w-full justify-start space-x-3 space-x-reverse p-4 h-auto
                  ${isActive(item.path) 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'hover:bg-accent text-foreground hover:text-accent-foreground'
                  }
                  group transition-all duration-200
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-primary-foreground/20' 
                    : 'bg-muted group-hover:bg-accent'
                  }
                `}>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <div className="flex-1 text-right">
                  <div className="font-medium">{item.title}</div>
                  <div className={`text-xs ${isActive(item.path) ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {item.description}
                  </div>
                </div>
                {isActive(item.path) && (
                  <motion.div 
                    className="w-2 h-2 bg-primary-foreground rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Button>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="p-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-2">
                آخر تحديث: {new Date().toLocaleString('ar-SA')}
              </div>
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <motion.div 
                  className="w-2 h-2 bg-success rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-success font-medium">النظام يعمل بشكل طبيعي</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </>
  )
}

export default Sidebar