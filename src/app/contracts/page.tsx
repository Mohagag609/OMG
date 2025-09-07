'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Contract, Unit, Customer, Safe, Broker } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25'
  }
  
  const sizes: { [key: string]: string } = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const ModernInput = ({ label, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${className}`}
      {...props}
    />
  </div>
)

const ModernSelect = ({ label, children, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
)

const SmartAutoComplete = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "اكتب للبحث...",
  className = "" 
}: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 10)
    return options.filter((option: any) => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.code?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10)
  }, [options, searchTerm])
  
  const selectedOption = options.find((opt: any) => opt.id === value)
  
  return (
    <div className="space-y-2 relative">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={selectedOption ? `${selectedOption.name} ${selectedOption.code ? `(${selectedOption.code})` : ''}` : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${className}`}
        />
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {filteredOptions.map((option: any) => (
              <div
                key={option.id}
                onClick={() => {
                  onChange(option.id)
                  setSearchTerm('')
                  setIsOpen(false)
                }}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
              >
                <div className="font-medium text-gray-900">{option.name}</div>
                {option.code && <div className="text-sm text-gray-500">{option.code}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [safes, setSafes] = useState<Safe[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [newContract, setNewContract] = useState({
    unitId: '',
    customerId: '',
    start: new Date().toISOString().split('T')[0],
    totalPrice: '',
    discountAmount: '',
    brokerName: '',
    brokerPercent: '',
    brokerAmount: '',
    commissionSafeId: '',
    downPaymentSafeId: '',
    paymentType: 'installment',
    installmentType: 'شهري',
    installmentCount: '',
    downPayment: '',
    extraAnnual: '',
    annualPaymentValue: '',
    maintenanceDeposit: ''
  })
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            setShowAddModal(true)
            break
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setShowAddModal(false)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      const [contractsRes, unitsRes, customersRes, safesRes, brokersRes] = await Promise.all([
        fetch('/api/contracts', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/units', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/safes', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/brokers', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const [contractsData, unitsData, customersData, safesData, brokersData] = await Promise.all([
        contractsRes.json(),
        unitsRes.json(),
        customersRes.json(),
        safesRes.json(),
        brokersRes.json()
      ])

      if (contractsData.success) setContracts(contractsData.data)
      if (unitsData.success) setUnits(unitsData.data)
      if (customersData.success) setCustomers(customersData.data)
      if (safesData.success) setSafes(safesData.data)
      if (brokersData.success) setBrokers(brokersData.data)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newContract.unitId || !newContract.customerId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء اختيار الوحدة والعميل'
      })
      return
    }

    const totalPrice = parseFloat(newContract.totalPrice)
    const downPayment = parseFloat(newContract.downPayment)
    const brokerPercent = parseFloat(newContract.brokerPercent)
    const brokerAmount = totalPrice * brokerPercent / 100

    if (brokerAmount > 0 && !newContract.commissionSafeId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء تحديد الخزنة التي سيتم دفع العمولة منها'
      })
      return
    }

    if (downPayment > 0 && !newContract.downPaymentSafeId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء تحديد الخزنة التي سيتم إيداع المقدم بها'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newContract,
          totalPrice: totalPrice,
          discountAmount: parseFloat(newContract.discountAmount),
          brokerAmount: brokerAmount,
          brokerPercent: brokerPercent,
          installmentCount: parseInt(newContract.installmentCount),
          downPayment: downPayment,
          extraAnnual: parseInt(newContract.extraAnnual),
          annualPaymentValue: parseFloat(newContract.annualPaymentValue),
          maintenanceDeposit: parseFloat(newContract.maintenanceDeposit)
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowAddModal(false)
        setCurrentStep(1)
        setSuccess('تم إضافة العقد بنجاح!')
        setError(null)
        setNewContract({
          unitId: '',
          customerId: '',
          start: new Date().toISOString().split('T')[0],
          totalPrice: '',
          discountAmount: '',
          brokerName: '',
          brokerPercent: '',
          brokerAmount: '',
          commissionSafeId: '',
          downPaymentSafeId: '',
          paymentType: 'installment',
          installmentType: 'شهري',
          installmentCount: '',
          downPayment: '',
          extraAnnual: '',
          annualPaymentValue: '',
          maintenanceDeposit: ''
        })
        fetchData()
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة العقد بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في إضافة العقد')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة العقد'
        })
      }
    } catch (err) {
      console.error('Add contract error:', err)
      setError('خطأ في إضافة العقد')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة العقد'
      })
    }
  }

  const updateFormForUnit = (unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    if (unit) {
      setNewContract(prev => ({
        ...prev,
        totalPrice: unit.totalPrice.toString()
      }))
    }
  }

  const updateFormForPaymentType = () => {
    const paymentType = newContract.paymentType
    const total = parseFloat(newContract.totalPrice)

    if (paymentType === 'cash') {
      setNewContract(prev => ({
        ...prev,
        downPayment: total.toString()
      }))
    }
  }

  const updateTotalInstallments = () => {
    const count = parseInt(newContract.installmentCount || '0', 10)
    const extra = parseInt(newContract.extraAnnual || '0', 10)
    return count + extra
  }

  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    return unit ? unit.code : 'غير محدد'
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer ? customer.name : 'غير محدد'
  }

  const copyFromContract = (contract: Contract) => {
    setNewContract({
      unitId: '',
      customerId: '',
      start: new Date().toISOString().split('T')[0],
      totalPrice: '',
      discountAmount: contract.discountAmount.toString(),
      brokerName: contract.brokerName || '',
      brokerPercent: contract.brokerPercent.toString(),
      brokerAmount: '',
      commissionSafeId: contract.commissionSafeId || '',
      downPaymentSafeId: contract.downPaymentSafeId || '',
      paymentType: contract.paymentType,
      installmentType: contract.installmentType,
      installmentCount: contract.installmentCount.toString(),
      downPayment: '',
      extraAnnual: contract.extraAnnual.toString(),
      annualPaymentValue: contract.annualPaymentValue.toString(),
      maintenanceDeposit: contract.maintenanceDeposit.toString()
    })
    setShowAddModal(true)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة العقود</h1>
                <p className="text-gray-600">نظام متطور لإدارة العقود والعقارات</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton onClick={() => setShowAddModal(true)}>
                <span className="mr-2">➕</span>
                إضافة عقد جديد
                <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
              </ModernButton>
              <ModernButton variant="secondary" onClick={() => router.push('/')}>
                العودة للرئيسية
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="🔍 ابحث في العقود... (Ctrl+F)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <ModernButton variant="secondary" size="sm">
                📊 تصدير CSV
              </ModernButton>
              <ModernButton variant="secondary" size="sm">
                🖨️ طباعة PDF
              </ModernButton>
            </div>
            <div className="text-sm text-gray-500">
              {contracts.length} عقد
            </div>
          </div>
        </ModernCard>

        {/* Contracts List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة العقود</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500">آخر تحديث:</span>
              <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('ar-SA')}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">كود العقد</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الوحدة</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">العميل</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">السمسار</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">السعر</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ البدء</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {contracts.filter(contract => 
                  search === '' || 
                  contract.unit?.code.toLowerCase().includes(search.toLowerCase()) ||
                  contract.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
                  (contract.brokerName && contract.brokerName.toLowerCase().includes(search.toLowerCase()))
                ).map((contract) => (
                  <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{contract.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{getUnitName(contract.unitId)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{getCustomerName(contract.customerId)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{contract.brokerName || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-green-600">{formatCurrency(contract.totalPrice)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{formatDate(contract.start)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <ModernButton size="sm" variant="secondary">
                          👁️ عرض
                        </ModernButton>
                        <ModernButton size="sm" variant="secondary">
                          ✏️ تعديل
                        </ModernButton>
                        <ModernButton size="sm" variant="secondary" onClick={() => copyFromContract(contract)}>
                          📋 نسخ
                        </ModernButton>
                        <ModernButton size="sm" variant="danger">
                          🗑️ حذف
                        </ModernButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModernCard>
      </div>

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">إضافة عقد جديد</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAddContract} className="p-6">
              {/* Step 1: Basic Info */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartAutoComplete
                    label="الوحدة *"
                    options={units.filter(u => u.status === 'متاحة' || u.status === 'محجوزة')}
                    value={newContract.unitId}
                    onChange={(unitId: string) => {
                      setNewContract({...newContract, unitId})
                      updateFormForUnit(unitId)
                    }}
                    placeholder="ابحث عن الوحدة..."
                  />
                  
                  <SmartAutoComplete
                    label="العميل *"
                    options={customers}
                    value={newContract.customerId}
                    onChange={(customerId: string) => setNewContract({...newContract, customerId})}
                    placeholder="ابحث عن العميل..."
                  />
                  
                  <ModernInput
                    label="السعر الكلي"
                    type="number"
                    value={newContract.totalPrice}
                    readOnly
                    className="bg-gray-50"
                  />

                  <ModernSelect
                    label="نوع الدفع"
                    value={newContract.paymentType}
                    onChange={(e: any) => {
                      setNewContract({...newContract, paymentType: e.target.value})
                      updateFormForPaymentType()
                    }}
                  >
                    <option value="installment">تقسيط</option>
                    <option value="cash">كاش</option>
                  </ModernSelect>

                  <ModernInput
                    label="المقدم"
                    type="number"
                    value={newContract.downPayment}
                    onChange={(e: any) => setNewContract({...newContract, downPayment: e.target.value})}
                    placeholder="مبلغ المقدم"
                  />

                  <ModernSelect
                    label="خزنة المقدم"
                    value={newContract.downPaymentSafeId}
                    onChange={(e: any) => setNewContract({...newContract, downPaymentSafeId: e.target.value})}
                  >
                    <option value="">اختر خزنة المقدم...</option>
                    {safes.map((safe) => (
                      <option key={safe.id} value={safe.id}>
                        {safe.name}
                      </option>
                    ))}
                  </ModernSelect>

                  <ModernInput
                    label="مبلغ الخصم"
                    type="number"
                    value={newContract.discountAmount}
                    onChange={(e: any) => setNewContract({...newContract, discountAmount: e.target.value})}
                    placeholder="مبلغ الخصم"
                  />

                  <ModernInput
                    label="وديعة الصيانة"
                    type="number"
                    value={newContract.maintenanceDeposit}
                    onChange={(e: any) => setNewContract({...newContract, maintenanceDeposit: e.target.value})}
                    placeholder="وديعة الصيانة"
                  />

                  <ModernSelect
                    label="اسم السمسار"
                    value={newContract.brokerName}
                    onChange={(e: any) => setNewContract({...newContract, brokerName: e.target.value})}
                  >
                    <option value="">اختر سمسار...</option>
                    {brokers.map((broker) => (
                      <option key={broker.id} value={broker.name}>
                        {broker.name}
                      </option>
                    ))}
                  </ModernSelect>

                  <ModernInput
                    label="نسبة العمولة %"
                    type="number"
                    value={newContract.brokerPercent}
                    onChange={(e: any) => setNewContract({...newContract, brokerPercent: e.target.value})}
                    placeholder="نسبة العمولة %"
                  />

                  <ModernSelect
                    label="خزنة العمولة"
                    value={newContract.commissionSafeId}
                    onChange={(e: any) => setNewContract({...newContract, commissionSafeId: e.target.value})}
                  >
                    <option value="">اختر خزنة العمولة...</option>
                    {safes.map((safe) => (
                      <option key={safe.id} value={safe.id}>
                        {safe.name}
                      </option>
                    ))}
                  </ModernSelect>

                  <ModernInput
                    label="تاريخ البداية"
                    type="date"
                    value={newContract.start}
                    onChange={(e: any) => setNewContract({...newContract, start: e.target.value})}
                    required
                  />
                </div>

                {/* Installment Options */}
                {newContract.paymentType === 'installment' && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">خيارات الأقساط</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ModernSelect
                        label="نوع الأقساط"
                        value={newContract.installmentType}
                        onChange={(e: any) => setNewContract({...newContract, installmentType: e.target.value})}
                      >
                        <option value="شهري">شهري</option>
                        <option value="ربع سنوي">ربع سنوي</option>
                        <option value="نصف سنوي">نصف سنوي</option>
                        <option value="سنوي">سنوي</option>
                      </ModernSelect>

                      <ModernInput
                        label="عدد الدفعات"
                        type="number"
                        value={newContract.installmentCount}
                        onChange={(e: any) => setNewContract({...newContract, installmentCount: e.target.value})}
                        placeholder="عدد الدفعات"
                      />

                      <ModernInput
                        label="عدد الدفعات السنوية (0-3)"
                        type="number"
                        min="0"
                        max="3"
                        value={newContract.extraAnnual}
                        onChange={(e: any) => setNewContract({...newContract, extraAnnual: e.target.value})}
                        placeholder="عدد الدفعات السنوية (0-3)"
                      />

                      <ModernInput
                        label="قيمة الدفعة السنوية"
                        type="number"
                        value={newContract.annualPaymentValue}
                        onChange={(e: any) => setNewContract({...newContract, annualPaymentValue: e.target.value})}
                        placeholder="قيمة الدفعة السنوية"
                      />
                    </div>
                    <div className="mt-4 p-4 bg-blue-100 rounded-xl">
                      <div className="text-sm text-blue-800">
                        إجمالي عدد الأقساط: <span className="font-bold text-lg">{updateTotalInstallments()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => setShowAddModal(false)}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  حفظ + توليد أقساط
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}