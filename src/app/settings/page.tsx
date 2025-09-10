'use client'

import { Settings } from '@/components/Settings'

// This is a dummy handler for the onSettingsChange prop.
// In a real app, this might be connected to a global state management system.
const handleSettingsChange = (newSettings: any) => {
  console.log('Settings changed:', newSettings)
}

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إدارة الإعدادات</h1>
      <Settings onSettingsChange={handleSettingsChange} />
    </div>
  )
}
