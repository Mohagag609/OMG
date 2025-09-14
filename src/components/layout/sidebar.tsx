"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Calculator,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Home,
  UserCheck,
  Building,
  Receipt,
  CreditCard,
  TrendingUp,
  Shield,
  Archive,
  Trash2,
  Database,
  HardDrive,
  Monitor,
  LogOut,
} from "lucide-react"

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
  badge?: string
}

const menuItems: MenuItem[] = [
  {
    title: "الرئيسية",
    href: "/",
    icon: Home,
  },
  {
    title: "لوحة التحكم",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "العقارات",
    icon: Building2,
    children: [
      { title: "الوحدات", href: "/units", icon: Building },
      { title: "العقود", href: "/contracts", icon: FileText },
      { title: "القسط", href: "/installments", icon: Calculator },
    ],
  },
  {
    title: "العملاء",
    href: "/customers",
    icon: Users,
  },
  {
    title: "الشركاء",
    icon: UserCheck,
    children: [
      { title: "الشركاء", href: "/partners", icon: UserCheck },
      { title: "مجموعات الشركاء", href: "/partner-groups", icon: Users },
      { title: "ديون الشركاء", href: "/partner-debts", icon: CreditCard },
    ],
  },
  {
    title: "الوسطاء",
    href: "/brokers",
    icon: UserCheck,
  },
  {
    title: "الخزائن",
    href: "/treasury",
    icon: Wallet,
  },
  {
    title: "السندات",
    href: "/vouchers",
    icon: Receipt,
  },
  {
    title: "التقارير",
    icon: BarChart3,
    children: [
      { title: "التقارير", href: "/reports", icon: BarChart3 },
      { title: "التدفق النقدي", href: "/reports/cashflow", icon: TrendingUp },
      { title: "التقرير التفصيلي", href: "/reports/detailed", icon: FileText },
    ],
  },
  {
    title: "النظام",
    icon: Settings,
    children: [
      { title: "إعدادات النظام", href: "/system", icon: Settings },
      { title: "سجل العمليات", href: "/audit", icon: Shield },
      { title: "نظام النسخ الاحتياطي", href: "/backup-system", icon: HardDrive },
      { title: "المحذوفات", href: "/trash", icon: Trash2 },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href
  }

  const hasActiveChild = (children?: MenuItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "100%",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg",
          "lg:fixed lg:translate-x-0 lg:z-40"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  إدارة العقارات
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  نظام إدارة شامل
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              {menuItems.map((item) => (
                <MenuItem
                  key={item.title}
                  item={item}
                  isActive={isActive(item.href)}
                  hasActiveChild={hasActiveChild(item.children)}
                  isExpanded={expandedItems.includes(item.title)}
                  onToggle={() => item.children && toggleExpanded(item.title)}
                  onClose={onClose}
                />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  المستخدم الحالي
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  admin@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

interface MenuItemProps {
  item: MenuItem
  isActive: boolean
  hasActiveChild: boolean
  isExpanded: boolean
  onToggle: () => void
  onClose: () => void
}

function MenuItem({ item, isActive, hasActiveChild, isExpanded, onToggle, onClose }: MenuItemProps) {
  const Icon = item.icon

  if (item.children) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
            hasActiveChild
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          )}
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Icon className="w-5 h-5" />
            <span>{item.title}</span>
            {item.badge && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1 pr-6 rtl:pr-0 rtl:pl-6">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href!}
                    onClick={onClose}
                    className={cn(
                      "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    )}
                  >
                    <child.icon className="w-4 h-4" />
                    <span>{child.title}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      onClick={onClose}
      className={cn(
        "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{item.title}</span>
      {item.badge && (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  )
}