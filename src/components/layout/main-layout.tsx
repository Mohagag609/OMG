"use client"

import React, { useState, useEffect } from "react"
// Removed framer-motion import
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Handle dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar - Fixed on the right */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main Content - Takes remaining space */}
      <div className="lg:mr-64 transition-all duration-300">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}