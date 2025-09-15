"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Users,
  FileText,
  Building2,
  UserCheck,
  Calculator,
  Wallet,
  BarChart3,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Bell,
  HelpCircle,
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

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
  badge?: string
  color?: string
}

const menuItems: MenuItem[] = [
  {
    title: "الرئيسية",
    href: "/",
    icon: Home,
    color: "text-blue-600",
  },
  {
    title: "العملاء",
    href: "/customers",
    icon: Users,
    color: "text-green-600",
    badge: "12",
  },
  {
    title: "العقود",
    href: "/contracts",
    icon: FileText,
    color: "text-purple-600",
    badge: "8",
  },
  {
    title: "الوحدات",
    href: "/units",
    icon: Building2,
    color: "text-orange-600",
  },
  {
    title: "الوسطاء",
    href: "/brokers",
    icon: UserCheck,
    color: "text-indigo-600",
  },
  {
    title: "الأقساط",
    href: "/installments",
    icon: Calculator,
    color: "text-pink-600",
  },
  {
    title: "الخزينة",
    href: "/treasury",
    icon: Wallet,
    color: "text-emerald-600",
  },
  {
    title: "الشركاء",
    icon: Users,
    color: "text-cyan-600",
    children: [
      {
        title: "قائمة الشركاء",
        href: "/partners",
        icon: Users,
        color: "text-cyan-500",
      },
      {
        title: "مجموعات الشركاء",
        href: "/partner-groups",
        icon: Users,
        color: "text-cyan-500",
      },
      {
        title: "ديون الشركاء",
        href: "/partner-debts",
        icon: CreditCard,
        color: "text-cyan-500",
      },
    ],
  },
  {
    title: "السندات",
    href: "/vouchers",
    icon: Receipt,
    color: "text-rose-600",
  },
  {
    title: "التقارير",
    icon: BarChart3,
    color: "text-amber-600",
    children: [
      {
        title: "التقارير العامة",
        href: "/reports",
        icon: BarChart3,
        color: "text-amber-500",
      },
      {
        title: "تقرير التدفق النقدي",
        href: "/reports/cashflow",
        icon: TrendingUp,
        color: "text-amber-500",
      },
      {
        title: "التقرير التفصيلي",
        href: "/reports/detailed",
        icon: BarChart3,
        color: "text-amber-500",
      },
    ],
  },
  {
    title: "النظام",
    icon: Settings,
    color: "text-gray-600",
    children: [
      {
        title: "إعدادات النظام",
        href: "/system",
        icon: Settings,
        color: "text-gray-500",
      },
      {
        title: "سجل التدقيق",
        href: "/audit",
        icon: Shield,
        color: "text-gray-500",
      },
      {
        title: "نظام النسخ الاحتياطي",
        href: "/backup-system",
        icon: HardDrive,
        color: "text-gray-500",
      },
      {
        title: "سلة المحذوفات",
        href: "/trash",
        icon: Trash2,
        color: "text-gray-500",
      },
      {
        title: "مراقبة النظام",
        href: "/monitoring/dashboard",
        icon: Monitor,
        color: "text-gray-500",
      },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const hasActiveChild = (children: MenuItem[]) => {
    return children.some(child => isActive(child.href!))
  }

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(title)) {
        newSet.delete(title)
      } else {
        newSet.add(title)
      }
      return newSet
    })
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
          "lg:translate-x-0 lg:z-40 lg:shadow-xl"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    إدارة العقارات
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    نظام إدارة شامل
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1" />
                عميل جديد
              </Button>
              <Button size="sm" variant="outline" className="h-9">
                <Search className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1" />
                بحث
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <MenuItem
                key={item.title}
                item={item}
                isActive={isActive(item.href || "")}
                hasActiveChild={item.children ? hasActiveChild(item.children) : false}
                isExpanded={expandedItems.has(item.title) || (item.children ? hasActiveChild(item.children) : false)}
                onToggle={() => toggleExpand(item.title)}
                onClose={onClose}
              />
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">أ</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  المستخدم الحالي
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  admin@example.com
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
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
        <Button
          variant="ghost"
          onClick={onToggle}
          className={cn(
            "w-full justify-start h-11 px-3 rounded-lg transition-all duration-200",
            hasActiveChild 
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm" 
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          )}
        >
          <Icon className={cn("w-5 h-5 ml-3 rtl:ml-0 rtl:mr-3", item.color)} />
          <span className="flex-1 text-right font-medium">{item.title}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </Button>
        {isExpanded && (
          <div className="overflow-hidden transition-all duration-200">
            <div className="mt-1 space-y-1 pr-6 rtl:pr-0 rtl:pl-6">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href!}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  <child.icon className={cn("w-4 h-4", child.color)} />
                  <span className="flex-1">{child.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      onClick={onClose}
      className={cn(
        "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm rounded-lg transition-all duration-200 h-11",
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      )}
    >
      <Icon className={cn("w-5 h-5", item.color)} />
      <span className="flex-1 font-medium">{item.title}</span>
      {item.badge && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs px-2 py-0.5">
          {item.badge}
        </Badge>
      )}
    </Link>
  )
}