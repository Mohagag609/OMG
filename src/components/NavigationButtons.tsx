'use client'

import { useRouter } from 'next/navigation'

interface NavigationButtonsProps {
  showBack?: boolean
  backLabel?: string
  showDashboard?: boolean
  dashboardLabel?: string
  className?: string
}

const NavigationButtons = ({ 
  showBack = true, 
  backLabel = 'العودة للخلف',
  showDashboard = true,
  dashboardLabel = 'العودة للوحة التحكم',
  className = ''
}: NavigationButtonsProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className={`flex items-center space-x-3 space-x-reverse ${className}`}>
      {showBack && (
        <button
          onClick={handleBack}
          className="group flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          title={backLabel}
        >
          <span className="text-lg group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">{backLabel}</span>
        </button>
      )}
      
      {showDashboard && (
        <button
          onClick={() => router.push('/')}
          className="group flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl shadow-blue-500/25"
          title={dashboardLabel}
        >
          <span className="text-lg group-hover:scale-110 transition-transform duration-200">🏠</span>
          <span className="font-medium">{dashboardLabel}</span>
        </button>
      )}
    </div>
  )
}

export default NavigationButtons