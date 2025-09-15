'use client'
import ModernButton from '@/components/ModernButton'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Partner, UnitPartner, Voucher, PartnerDebt } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import NavigationButtons from '@/components/NavigationButtons'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

// Using imported ModernButton component

const KPICard = ({ title, value, icon, color, trend }: any) => (
  <ModernCard>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {trend && (
          <p className="text-xs text-gray-500 mt-1">{trend}</p>
        )}
      </div>
      <div className={`w-12 h-12 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-xl flex items-center justify-center`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  </ModernCard>
)

export default function PartnerDetails() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [partnerDebts, setPartnerDebts] = useState<PartnerDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Master-Detail Layout states
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const { notifications, addNotification, removeNotification } = useNotifications()

  const partnerId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchPartnerDetails()
  }, [partnerId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const fetchPartnerDetails = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      // Fetch partner details
      const partnerResponse = await fetch(`/api/partners/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const partnerData = await partnerResponse.json()
      if (partnerData.success) {
        setPartner(partnerData.data)
      } else {
        setError(partnerData.error || 'خطأ في تحميل بيانات الشريك')
      }

      // Fetch unit partners
      const unitPartnersResponse = await fetch(`/api/unit-partners?partnerId=${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const unitPartnersData = await unitPartnersResponse.json()
      if (unitPartnersData.success) {
        setUnitPartners(unitPartnersData.data)
      }

      // Fetch vouchers related to this partner
      const vouchersResponse = await fetch(`/api/vouchers?partnerId=${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const vouchersData = await vouchersResponse.json()
      if (vouchersData.success) {
        setVouchers(vouchersData.data)
      }

      // Fetch partner debts
      const debtsResponse = await fetch(`/api/partner-debts?partnerId=${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const debtsData = await debtsResponse.json()
      if (debtsData.success) {
        setPartnerDebts(debtsData.data)
      }

    } catch (err) {
      console.error('Error fetching partner details:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const calculatePartnerLedger = () => {
    let totalIncome = 0
    let totalExpense = 0
    const transactions: Array<{
      date: string
      description: string
      income: number
      expense: number
      balance: number
      isClosingEntry?: boolean
    }> = []

    // Process vouchers
    vouchers.forEach(voucher => {
      // Find unit partner by voucher's linked reference or unit relation
      const unitPartner = unitPartners.find(up => 
        up.unitId === voucher.linkedRef || 
        (voucher.unit && up.unitId === voucher.unit.id)
      )
      if (unitPartner) {
        const share = unitPartner.percentage / 100
        if (voucher.type === 'receipt') {
          const income = voucher.amount * share
          transactions.push({
            date: voucher.date.toString(),
            description: voucher.description,
            income,
            expense: 0,
            balance: 0 // Will be calculated later
          })
          totalIncome += income
        } else if (voucher.description.includes('عمولة سمسار')) {
          const expense = voucher.amount * share
          transactions.push({
            date: voucher.date.toString(),
            description: voucher.description,
            income: 0,
            expense,
            balance: 0 // Will be calculated later
          })
          totalExpense += expense
        }
      }
    })

    // Process partner debts
    partnerDebts.forEach(debt => {
      if (debt.status === 'مدفوع') {
        transactions.push({
          date: debt.dueDate.toString(),
          description: `دين شريك - ${debt.notes || 'بدون ملاحظات'}`,
          income: debt.amount,
          expense: 0,
          balance: 0 // Will be calculated later
        })
        totalIncome += debt.amount
      }
    })

    // Sort transactions by date
    transactions.sort((a, b) => a.date.localeCompare(b.date))

    // Group transactions by date and add daily closing entries
    const dailyTransactions: Array<{
      date: string
      description: string
      income: number
      expense: number
      balance: number
      isClosingEntry?: boolean
    }> = []

    const transactionsByDate = new Map<string, typeof transactions>()
    
    // Group transactions by date
    transactions.forEach(transaction => {
      const dateKey = transaction.date.split('T')[0] // Get only the date part
      if (!transactionsByDate.has(dateKey)) {
        transactionsByDate.set(dateKey, [])
      }
      transactionsByDate.get(dateKey)!.push(transaction)
    })

    // Process each day
    let runningBalance = 0
    const sortedDates = Array.from(transactionsByDate.keys()).sort()

    sortedDates.forEach((dateKey, dayIndex) => {
      const dayTransactions = transactionsByDate.get(dateKey)!
      let dayIncome = 0
      let dayExpense = 0

      // Process all transactions for this day
      dayTransactions.forEach(transaction => {
        dayIncome += transaction.income
        dayExpense += transaction.expense
        runningBalance += transaction.income - transaction.expense
        
        dailyTransactions.push({
          ...transaction,
          balance: runningBalance
        })
      })

      // Add daily closing entry (except for the last day)
      if (dayIndex < sortedDates.length - 1) {
        dailyTransactions.push({
          date: dateKey,
          description: `إقفال يوم ${new Date(dateKey).toLocaleDateString('en-GB')}`,
          income: 0,
          expense: 0,
          balance: runningBalance,
          isClosingEntry: true
        })
      }
    })

    return {
      transactions: dailyTransactions,
      totalIncome,
      totalExpense,
      netPosition: totalIncome - totalExpense
    }
  }

  const getTransactionsByDay = () => {
    const transactionsByDay = new Map<string, any[]>()
    
    ledger.transactions.forEach(transaction => {
      const dateKey = transaction.date.split('T')[0]
      if (!transactionsByDay.has(dateKey)) {
        transactionsByDay.set(dateKey, [])
      }
      transactionsByDay.get(dateKey)!.push(transaction)
    })
    
    return transactionsByDay
  }

  const getDaySummary = (dateKey: string) => {
    const dayTransactions = getTransactionsByDay().get(dateKey) || []
    const dayIncome = dayTransactions.reduce((sum, tx) => sum + tx.income, 0)
    const dayExpense = dayTransactions.reduce((sum, tx) => sum + tx.expense, 0)
    const dayBalance = dayTransactions.length > 0 ? dayTransactions[dayTransactions.length - 1].balance : 0
    
    return {
      date: dateKey,
      income: dayIncome,
      expense: dayExpense,
      balance: dayBalance,
      transactionCount: dayTransactions.filter(tx => !tx.isClosingEntry).length
    }
  }

  const handleDayClick = (dateKey: string) => {
    setSelectedDay(dateKey)
    setShowDetailPanel(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        
        <div className={`transition-all duration-300 `}>
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⚠️</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">خطأ</h1>
                    <p className="text-gray-600">{error || 'لم يتم العثور على الشريك'}</p>
                  </div>
                </div>
                <ModernButton variant="secondary" onClick={() => router.push('/partners')}>
                  العودة للشركاء
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ledger = calculatePartnerLedger()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Main Content */}
      <div className={`transition-all duration-300 `}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">تفاصيل الشريك: {partner.name}</h1>
                  <p className="text-gray-600">بيانات شاملة وحسابات مفصلة</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <NavigationButtons 
                  backLabel="العودة للشركاء"
                  dashboardLabel="العودة للوحة التحكم"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Partner Info */}
          <ModernCard className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">بيانات الشريك</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <p className="text-lg font-semibold text-gray-900">{partner.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الهاتف</label>
                <p className="text-lg font-semibold text-gray-900">{partner.phone || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <p className="text-lg font-semibold text-gray-900">{partner.notes || '-'}</p>
              </div>
            </div>
          </ModernCard>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard
              title="إجمالي الدخل"
              value={formatCurrency(ledger.totalIncome)}
              icon="💰"
              color="text-green-600"
              trend="من جميع المعاملات"
            />
            <KPICard
              title="إجمالي المصروفات"
              value={formatCurrency(ledger.totalExpense)}
              icon="📉"
              color="text-red-600"
              trend="العمولات والمصروفات"
            />
            <KPICard
              title="صافي الموقف"
              value={formatCurrency(ledger.netPosition)}
              icon="📊"
              color="text-blue-600"
              trend="الرصيد النهائي"
            />
          </div>

          {/* Units and Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModernCard>
              <h3 className="text-lg font-bold text-gray-900 mb-6">الوحدات المملوكة</h3>
              {unitPartners.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">🏠</span>
                  </div>
                  <p className="text-gray-500">لا توجد وحدات مملوكة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">الوحدة</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">نسبة الملكية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitPartners.map((up) => (
                        <tr key={up.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{(up as any).unit?.code || 'غير محدد'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-blue-600">{up.percentage}%</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ModernCard>

            <ModernCard>
              <h3 className="text-lg font-bold text-gray-900 mb-6">كشف الحساب التفصيلي</h3>
              <div className="max-h-96 overflow-y-auto">
                {ledger.transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">📊</span>
                    </div>
                    <p className="text-gray-500">لا توجد معاملات</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from(getTransactionsByDay().keys()).sort().map((dateKey) => {
                      const daySummary = getDaySummary(dateKey)
                      return (
                        <div
                          key={dateKey}
                          onClick={() => handleDayClick(dateKey)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedDay === dateKey 
                              ? 'bg-blue-50 border-blue-200 shadow-md' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">
                                  {new Date(dateKey).getDate()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {new Date(dateKey).toLocaleDateString('en-GB', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {daySummary.transactionCount} معاملة
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(daySummary.balance)}
                              </div>
                              <div className="text-xs text-gray-500">
                                رصيد اليوم
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <span className="text-green-600">+</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(daySummary.income)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <span className="text-red-600">-</span>
                                <span className="font-medium text-red-600">
                                  {formatCurrency(daySummary.expense)}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-500">
                              {daySummary.income > 0 || daySummary.expense > 0 ? 'معاملات' : 'لا توجد معاملات'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ModernCard>
          </div>

          {/* Detail Panel */}
          {showDetailPanel && selectedDay && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      تفاصيل يوم {new Date(selectedDay).toLocaleDateString('en-GB')}
                    </h2>
                    <button
                      onClick={() => setShowDetailPanel(false)}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {(() => {
                    const dayTransactions = getTransactionsByDay().get(selectedDay) || []
                    const daySummary = getDaySummary(selectedDay)
                    
                    return (
                      <div>
                        {/* Day Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-green-50 rounded-xl p-4">
                            <div className="text-sm font-medium text-green-600 mb-1">إجمالي الدخل</div>
                            <div className="text-xl font-bold text-green-700">
                              {formatCurrency(daySummary.income)}
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-xl p-4">
                            <div className="text-sm font-medium text-red-600 mb-1">إجمالي المصروفات</div>
                            <div className="text-xl font-bold text-red-700">
                              {formatCurrency(daySummary.expense)}
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-4">
                            <div className="text-sm font-medium text-blue-600 mb-1">رصيد اليوم</div>
                            <div className="text-xl font-bold text-blue-700">
                              {formatCurrency(daySummary.balance)}
                            </div>
                          </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">الوقت</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">البيان</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">دخل</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">صرف</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">الرصيد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayTransactions.map((tx, index) => (
                                <tr 
                                  key={index} 
                                  className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150 ${
                                    tx.isClosingEntry ? 'bg-gray-50 font-semibold' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4">
                                    <div className={`text-sm ${tx.isClosingEntry ? 'text-gray-700 font-semibold' : 'text-gray-600'}`}>
                                      {tx.isClosingEntry ? 'إقفال' : (tx.date ? new Date(tx.date).toLocaleTimeString('ar-SA', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      }) : 'غير محدد')}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className={`text-sm ${tx.isClosingEntry ? 'text-gray-800 font-semibold' : 'font-medium text-gray-900'}`}>
                                      {tx.isClosingEntry ? (
                                        <span className="flex items-center">
                                          <span className="mr-2">📊</span>
                                          {tx.description}
                                        </span>
                                      ) : (
                                        tx.description
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {tx.income > 0 ? (
                                      <span className={`text-sm font-semibold ${tx.isClosingEntry ? 'text-gray-600' : 'text-green-600'}`}>
                                        {formatCurrency(tx.income)}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {tx.expense > 0 ? (
                                      <span className={`text-sm font-semibold ${tx.isClosingEntry ? 'text-gray-600' : 'text-red-600'}`}>
                                        {formatCurrency(tx.expense)}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <strong className={`text-sm font-bold ${tx.isClosingEntry ? 'text-gray-800' : 'text-blue-600'}`}>
                                      {formatCurrency(tx.balance)}
                                    </strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}