"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  X,
  ChevronDown,
  ChevronRight,
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
}

const menuItems: MenuItem[] = [
  {
    title: "الرئيسية",
    href: "/",
    icon: Home,
  },
  {
    title: "العملاء",
    href: "/customers",
    icon: Users,
  },
  {
    title: "العقود",
    href: "/contracts",
    icon: FileText,
  },
  {
    title: "الوحدات",
    href: "/units",
    icon: Building2,
  },
  {
    title: "الوسطاء",
    href: "/brokers",
    icon: UserCheck,
  },
  {
    title: "الأقساط",
    href: "/installments",
    icon: Calculator,
  },
  {
    title: "الخزينة",
    href: "/treasury",
    icon: Wallet,
  },
  {
    title: "الشركاء",
    href: "/partners",
    icon: Building,
  },
  {
    title: "التقارير",
    href: "/reports",
    icon: BarChart3,
    children: [
      {
        title: "التقارير العامة",
        href: "/reports",
        icon: BarChart3,
      },
      {
        title: "تقرير التدفق النقدي",
        href: "/reports/cashflow",
        icon: TrendingUp,
      },
      {
        title: "التقرير التفصيلي",
        href: "/reports/detailed",
        icon: Receipt,
      },
    ],
  },
  {
    title: "النظام",
    href: "/system",
    icon: Settings,
    children: [
      {
        title: "إعدادات النظام",
        href: "/system",
        icon: Settings,
      },
      {
        title: "النسخ الاحتياطية",
        href: "/backup-system",
        icon: HardDrive,
      },
      {
        title: "سجل العمليات",
        href: "/audit",
        icon: Shield,
      },
      {
        title: "المهملات",
        href: "/trash",
        icon: Trash2,
      },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const hasActiveChild = (children: MenuItem[]) => {
    return children.some(child => isActive(child.href!))
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-64 bg-card border-l border-border shadow-lg transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
          "lg:translate-x-0 lg:z-40"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  إدارة العقارات
                </h1>
                <p className="text-xs text-muted-foreground">
                  نظام إدارة شامل
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <MenuItem
                key={item.title}
                item={item}
                isActive={isActive(item.href || "")}
                hasActiveChild={item.children ? hasActiveChild(item.children) : false}
                onClose={onClose}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 rtl:space-x-reverse text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">المستخدم الحالي</p>
                <p className="text-xs">admin@example.com</p>
              </div>
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
  onClose: () => void
}

function MenuItem({ item, isActive, hasActiveChild, onClose }: MenuItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(hasActiveChild)
  const Icon = item.icon

  if (item.children) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full justify-start h-10 px-3",
            hasActiveChild && "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="w-4 h-4 ml-3 rtl:ml-0 rtl:mr-3" />
          <span className="flex-1 text-right">{item.title}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
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
                    "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <child.icon className="w-4 h-4" />
                  <span>{child.title}</span>
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
        "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 text-sm rounded-md transition-colors h-10",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  )
}