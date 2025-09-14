"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Building2,
  FileText,
} from "lucide-react"

interface HeaderProps {
  onMenuClick: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onClose?: () => void
}

export function Header({ onMenuClick, isDarkMode, onToggleDarkMode, onClose }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleClose = () => {
    setIsCollapsed(true)
    if (onClose) {
      onClose()
    }
  }

  return (
    <header className={`fixed top-0 right-0 z-40 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${isCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
      <div className="flex flex-col h-full">
        {/* Header Top - Close button and title */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">لوحة التحكم</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Search Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في النظام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 w-full"
              dir="rtl"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">الإجراءات السريعة</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 ml-2" />
              إضافة عميل جديد
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="h-4 w-4 ml-2" />
              إضافة وحدة جديدة
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 ml-2" />
              إنشاء عقد جديد
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">الإشعارات</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">دفعة جديدة مستحقة</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">منذ 5 دقائق</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">عقد جديد تم إنشاؤه</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">منذ ساعة</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">تم دفع قسط بنجاح</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">منذ 3 ساعات</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">المستخدم الحالي</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* User dropdown */}
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-md p-2 space-y-1"
            >
              <button className="w-full text-right px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2 rtl:space-x-reverse">
                <User className="h-4 w-4" />
                <span>الملف الشخصي</span>
              </button>
              <button className="w-full text-right px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2 rtl:space-x-reverse">
                <Settings className="h-4 w-4" />
                <span>الإعدادات</span>
              </button>
              <button className="w-full text-right px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2 rtl:space-x-reverse">
                <LogOut className="h-4 w-4" />
                <span>تسجيل الخروج</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  )
}