'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '../../../components/NotificationSystem'

interface DetailedReportData {
  unitFullName: string
  unitType: string
  customerName: string
  partnerName: string
  partnerGroupName: string
  installmentDate: string
  installmentAmount: number
  paidAmount: number
  remainingAmount: number
  isPaid: boolean
  status: string
  notes?: string
}

interface DetailedReportStats {
  totalInstallments: number
  paidInstallments: number
  unpaidInstallments: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  partnerStats: Record<string, {
    totalAmount: number
    paidAmount: number
    installments: number
  }>
}

export default function DetailedReportPage() {
  const [reportData, setReportData] = useState<DetailedReportData[]>([])
  const [stats, setStats] = useState<DetailedReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    partnerId: '',
    unitId: '',
    status: ''
  })
  const [partners, setPartners] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchPartners()
    fetchUnits()
    fetchReport()
  }, [])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      if (data.success) {
        setPartners(data.data)
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      const data = await response.json()
      if (data.success) {
        setUnits(data.data)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.month) params.append('month', filters.month)
      if (filters.year) params.append('year', filters.year)
      if (filters.partnerId) params.append('partnerId', filters.partnerId)
      if (filters.unitId) params.append('unitId', filters.unitId)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/reports/detailed?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data.report)
        setStats(data.data.stats)
      } else {
        addNotification({ title: 'خطأ', message: 'خطأ في جلب التقرير', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      addNotification({ title: 'خطأ', message: 'خطأ في جلب التقرير', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    fetchReport()
  }

  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/reports/detailed/export?' + new URLSearchParams(filters))
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `detailed-report-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      addNotification({ title: 'نجح', message: 'تم تصدير التقرير بنجاح', type: 'success' })
    } catch (error) {
      console.error('Error exporting report:', error)
      addNotification({ title: 'خطأ', message: 'خطأ في تصدير التقرير', type: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل التقرير...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">التقرير المفصل للأقساط والشركاء</h1>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الشهر</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الأشهر</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('ar-EG', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الشريك</label>
              <select
                value={filters.partnerId}
                onChange={(e) => handleFilterChange('partnerId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الشركاء</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
              <select
                value={filters.unitId}
                onChange={(e) => handleFilterChange('unitId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الوحدات</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name || unit.code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الحالات</option>
                <option value="مدفوع">مدفوع</option>
                <option value="غير مدفوع">غير مدفوع</option>
                <option value="معلق">معلق</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🔍 بحث
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              📊 تصدير Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الأقساط</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInstallments}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500">الأقساط المدفوعة</h3>
              <p className="text-2xl font-bold text-green-600">{stats.paidInstallments}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي المبلغ</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAmount.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500">المبلغ المدفوع</h3>
              <p className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString()} ج.م</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الوحدة - الدور - المبنى</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع الوحدة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الشريك</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مجموعة الشركاء</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ القسط</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">قيمة القسط</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدفوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتبقي</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((row, index) => (
                  <tr key={index} className={row.isPaid ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.unitFullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.unitType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.partnerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.partnerGroupName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.installmentDate).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.installmentAmount.toLocaleString()} ج.م
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.paidAmount.toLocaleString()} ج.م
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.remainingAmount.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {reportData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">لا توجد بيانات للعرض</p>
          </div>
        )}
      </div>
    </div>
  )
}