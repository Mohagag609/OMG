'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '../../../components/NotificationSystem'

// Modern Card Component
const ModernCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 ${className}`}>
    {children}
  </div>
)

// Modern Button Component
const ModernButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  size = 'md',
  className = '',
  type = 'button'
}: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit' | 'reset'
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

interface PartnerCashflow {
  partnerId: string
  partnerName: string
  phone: string
  notes: string
  totalMonthlyCashflow: number
  totalAnnualCashflow: number
  unitDetails: Array<{
    unitId: string
    unitCode: string
    unitName: string
    area: string
    building: string
    floor: string
    totalPrice: number
    percentage: number
    monthlyInstallment: number
    annualInstallment: number
    partnerMonthlyShare: number
    partnerAnnualShare: number
  }>
}

interface CashflowStats {
  totalPartners: number
  totalUnits: number
  totalMonthlyCashflow: number
  totalAnnualCashflow: number
  averageMonthlyPerPartner: number
}

export default function CashflowReportPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [partners, setPartners] = useState<PartnerCashflow[]>([])
  const [stats, setStats] = useState<CashflowStats | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({})
  const { addNotification } = useNotifications()

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]

  useEffect(() => {
    fetchCashflowData()
  }, [selectedMonth, selectedYear])

  const fetchCashflowData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports/cashflow?month=${selectedMonth}&year=${selectedYear}`)
      const result = await response.json()

      if (result.success) {
        setPartners(result.data.partners)
        setStats(result.data.stats)
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في جلب البيانات',
          message: result.error || 'فشل في جلب تقرير التدفقات النقدية'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في الاتصال بالخادم'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDetails = (partnerId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }))
  }

  const exportToExcel = async () => {
    try {
      const response = await fetch(`/api/reports/cashflow/export?month=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `partner-cashflow-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        addNotification({
          type: 'success',
          title: 'تم التصدير بنجاح',
          message: 'تم تحميل ملف Excel بنجاح'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التصدير',
        message: 'فشل في تصدير الملف'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تقرير التدفقات النقدية للشركاء</h1>
                <p className="text-gray-600">تدفقات الأقساط الشهرية للشركاء</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton
                onClick={exportToExcel}
                variant="success"
                size="sm"
                disabled={isLoading}
              >
                تصدير Excel
              </ModernButton>
              <ModernButton
                onClick={fetchCashflowData}
                variant="primary"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ModernCard className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">فلترة البيانات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الشهر</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <ModernButton
                onClick={fetchCashflowData}
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                تطبيق الفلتر
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <ModernCard className="bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalPartners}</div>
                <div className="text-sm text-gray-600">عدد الشركاء</div>
              </div>
            </ModernCard>
            <ModernCard className="bg-gradient-to-r from-green-50 to-green-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalUnits}</div>
                <div className="text-sm text-gray-600">عدد الوحدات</div>
              </div>
            </ModernCard>
            <ModernCard className="bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(stats.totalMonthlyCashflow)}
                </div>
                <div className="text-sm text-gray-600">التدفق الشهري</div>
              </div>
            </ModernCard>
            <ModernCard className="bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(stats.totalAnnualCashflow)}
                </div>
                <div className="text-sm text-gray-600">التدفق السنوي</div>
              </div>
            </ModernCard>
          </div>
        )}

        {/* Partners List */}
        <div className="space-y-6">
          {partners.map((partner) => (
            <ModernCard key={partner.partnerId}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{partner.partnerName}</h3>
                  <p className="text-gray-600">{partner.phone}</p>
                  {partner.notes && (
                    <p className="text-sm text-gray-500">{partner.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(partner.totalMonthlyCashflow)}
                  </div>
                  <div className="text-sm text-gray-600">التدفق الشهري</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {partner.unitDetails.length} وحدة • 
                  التدفق السنوي: {formatCurrency(partner.totalAnnualCashflow)}
                </div>
                <ModernButton
                  onClick={() => toggleDetails(partner.partnerId)}
                  variant="secondary"
                  size="sm"
                >
                  {showDetails[partner.partnerId] ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </ModernButton>
              </div>

              {showDetails[partner.partnerId] && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الوحدات</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">كود الوحدة</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">اسم الوحدة</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">المبنى</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">نسبة المشاركة</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">القسط الشهري</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">حصة الشريك</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partner.unitDetails.map((unit, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900">{unit.unitCode}</td>
                            <td className="py-3 px-4 text-gray-600">{unit.unitName || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{unit.building || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{unit.percentage}%</td>
                            <td className="py-3 px-4 text-gray-600">{formatCurrency(unit.monthlyInstallment)}</td>
                            <td className="py-3 px-4 text-green-600 font-semibold">
                              {formatCurrency(unit.partnerMonthlyShare)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </ModernCard>
          ))}
        </div>

        {partners.length === 0 && !isLoading && (
          <ModernCard className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-600">لم يتم العثور على بيانات للفترة المحددة</p>
          </ModernCard>
        )}

        {isLoading && (
          <ModernCard className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">جاري التحميل...</h3>
            <p className="text-gray-600">يرجى الانتظار بينما نقوم بجلب البيانات</p>
          </ModernCard>
        )}
      </div>
    </div>
  )
}