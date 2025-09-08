'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, UnitPartner } from '@/types'
import { formatCurrency, formatDate, calculateRemainingAmount } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { checkDuplicateCode } from '@/utils/duplicateCheck'

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
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg shadow-yellow-500/25',
    info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25'
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
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
      {...props}
    />
  </div>
)

const ModernSelect = ({ label, children, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <select 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
)

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [installments, setInstallments] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [partnerGroups, setPartnerGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUnitDetailsModal, setShowUnitDetailsModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnits, setDeletingUnits] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null)
  const [newPartner, setNewPartner] = useState({
    partnerId: '',
    percentage: ''
  })
  const [newUnit, setNewUnit] = useState({
    code: '',
    name: '',
    unitType: '',
    area: '',
    floor: '',
    building: '',
    totalPrice: '',
    status: 'متاحة',
    notes: '',
    partnerGroupId: ''
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
            setEditingUnit(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [unitsResponse, unitPartnersResponse, contractsResponse, installmentsResponse, vouchersResponse, partnersResponse, partnerGroupsResponse] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/unit-partners'),
        fetch('/api/contracts'),
        fetch('/api/installments'),
        fetch('/api/vouchers'),
        fetch('/api/partners'),
        fetch('/api/partner-groups')
      ])
      
      const [unitsData, unitPartnersData, contractsData, installmentsData, vouchersData, partnersData, partnerGroupsData] = await Promise.all([
        unitsResponse.json(),
        unitPartnersResponse.json(),
        contractsResponse.json(),
        installmentsResponse.json(),
        vouchersResponse.json(),
        partnersResponse.json(),
        partnerGroupsResponse.json()
      ])
      
      if (unitsData.success) {
        setUnits(unitsData.data)
        
        // Extract unit partners from units data
        const allUnitPartners: any[] = []
        unitsData.data.forEach((unit: any) => {
          if (unit.unitPartners && unit.unitPartners.length > 0) {
            allUnitPartners.push(...unit.unitPartners)
          }
        })
        setUnitPartners(allUnitPartners)
      } else {
        setError(unitsData.error || 'خطأ في تحميل الوحدات')
      }

      if (unitPartnersData.success) {
        // Only set if we don't have unit partners from units data
        if (allUnitPartners.length === 0) {
          setUnitPartners(unitPartnersData.data)
        }
      }

      if (contractsData.success) {
        setContracts(contractsData.data)
      }

      if (installmentsData.success) {
        setInstallments(installmentsData.data)
      }

      if (vouchersData.success) {
        setVouchers(vouchersData.data)
      }

      if (partnersData.success) {
        setPartners(partnersData.data)
      }

      if (partnerGroupsData.success) {
        setPartnerGroups(partnerGroupsData.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUnit.name || !newUnit.floor || !newUnit.building || !newUnit.totalPrice || !newUnit.partnerGroupId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة'
      })
      return
    }

    // Generate code from building, floor, and name
    const code = `${newUnit.building.replace(/\s/g, '')}-${newUnit.floor.replace(/\s/g, '')}-${newUnit.name.replace(/\s/g, '')}`
    
    // فحص تكرار كود الوحدة
    if (units.some(u => u.code.toLowerCase() === code.toLowerCase())) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'وحدة بنفس الاسم والدور والبرج موجودة بالفعل'
      })
      return
    }

    // Check if partner group exists and has 100% total
    const partnerGroup = partnerGroups.find(g => g.id === newUnit.partnerGroupId)
    if (!partnerGroup) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'مجموعة الشركاء غير موجودة'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setSuccess('تم إضافة الوحدة بنجاح!')
    setError(null)
    
    // إضافة الوحدة للقائمة فوراً مع ID مؤقت
    const tempUnit = {
      ...newUnit,
      id: `temp-${Date.now()}`,
      totalPrice: parseFloat(newUnit.totalPrice),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setUnits(prev => [tempUnit, ...prev])

    // إعادة تعيين النموذج
    setNewUnit({
      code: '',
      name: '',
      unitType: '',
      area: '',
      floor: '',
      building: '',
      totalPrice: '',
      status: 'متاحة',
      notes: '',
      partnerGroupId: ''
    })

    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newUnit,
          totalPrice: parseFloat(newUnit.totalPrice),
          partnerGroupId: newUnit.partnerGroupId
        })
      })

      const data = await response.json()
      if (data.success) {
        // استبدال الوحدة المؤقتة بالوحدة الحقيقية
        setUnits(prev => prev.map(unit => 
          unit.id === tempUnit.id ? data.data : unit
        ))
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الوحدة بنجاح'
        })
      } else {
        // في حالة فشل الحفظ، نزيل الوحدة المؤقتة ونعيد النافذة
        setUnits(prev => prev.filter(unit => unit.id !== tempUnit.id))
        setShowAddModal(true)
        setError(data.error || 'خطأ في إضافة الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الوحدة'
        })
      }
    } catch (err) {
      console.error('Add unit error:', err)
      // في حالة فشل الحفظ، نزيل الوحدة المؤقتة ونعيد النافذة
      setUnits(prev => prev.filter(unit => unit.id !== tempUnit.id))
      setShowAddModal(true)
      setError('خطأ في إضافة الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الوحدة'
      })
    }
  }

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUnit) return

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setEditingUnit(null)
    setSuccess('تم تحديث الوحدة بنجاح!')
    setError(null)

    // تحديث الوحدة في القائمة فوراً
    const updatedUnit = {
      ...editingUnit,
      ...newUnit,
      totalPrice: parseFloat(newUnit.totalPrice),
      updatedAt: new Date().toISOString()
    }
    setUnits(prev => prev.map(unit => 
      unit.id === editingUnit.id ? updatedUnit : unit
    ))

    // إعادة تعيين النموذج
    setNewUnit({
      code: '',
      name: '',
      unitType: '',
      area: '',
      floor: '',
      building: '',
      totalPrice: '',
      status: 'متاحة',
      notes: '',
      partnerGroupId: ''
    })

    try {
      const response = await fetch(`/api/units/${editingUnit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newUnit,
          totalPrice: parseFloat(newUnit.totalPrice)
        })
      })

      const data = await response.json()
      if (data.success) {
        // استبدال الوحدة المحدثة بالبيانات الحقيقية من الخادم
        setUnits(prev => prev.map(unit => 
          unit.id === editingUnit.id ? data.data : unit
        ))
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث الوحدة بنجاح'
        })
      } else {
        // في حالة فشل التحديث، نعيد البيانات الأصلية
        fetchData()
        setError(data.error || 'خطأ في تحديث الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث الوحدة'
        })
      }
    } catch (err) {
      console.error('Update unit error:', err)
      // في حالة فشل التحديث، نعيد البيانات الأصلية
      fetchData()
      setError('خطأ في تحديث الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث الوحدة'
      })
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return

    // إضافة الوحدة لقائمة الحذف وإظهار الحركة فوراً
    setDeletingUnits(prev => {
      const newSet = new Set(prev)
      newSet.add(unitId)
      return newSet
    })

    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
        headers: {}
      })

      const data = await response.json()
      if (data.success) {
        // إزالة الوحدة من القائمة فوراً مع الحركة
        setUnits(prev => prev.filter(unit => unit.id !== unitId))
        setSuccess('تم حذف الوحدة بنجاح!')
        setError(null)
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف الوحدة بنجاح'
        })
      } else {
        // إعادة تحميل البيانات لإظهار الوحدة مرة أخرى
        await fetchData()
        setError(data.error || 'خطأ في حذف الوحدة. قد تكون الوحدة مرتبطة بعقد قائم.')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف الوحدة. قد تكون الوحدة مرتبطة بعقد قائم.'
        })
      }
    } catch (err) {
      console.error('Delete unit error:', err)
      // إعادة تحميل البيانات لإظهار الوحدة مرة أخرى
      await fetchData()
      setError('خطأ في حذف الوحدة. تحقق من اتصال الإنترنت وحاول مرة أخرى.')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف الوحدة. تحقق من اتصال الإنترنت وحاول مرة أخرى.'
      })
    } finally {
      // إزالة الوحدة من قائمة الحذف
      setDeletingUnits(prev => {
        const newSet = new Set(prev)
        newSet.delete(unitId)
        return newSet
      })
    }
  }

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit)
    setNewUnit({
      code: unit.code,
      name: unit.name || '',
      unitType: unit.unitType,
      area: unit.area || '',
      floor: unit.floor || '',
      building: unit.building || '',
      totalPrice: unit.totalPrice.toString(),
      status: unit.status,
      notes: unit.notes || ''
    })
    setShowAddModal(true)
  }

  const getUnitPartners = (unitId: string) => {
    // First try to get from unitPartners state
    const statePartners = unitPartners.filter(up => up.unitId === unitId)
    if (statePartners.length > 0) {
      return statePartners
    }
    
    // If not found in state, try to get from unit data
    const unit = units.find(u => u.id === unitId)
    if (unit && (unit as any).unitPartners) {
      return (unit as any).unitPartners
    }
    
    return []
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : `شريك ${partnerId.slice(-4)}`
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortedUnits = () => {
    let sortedUnits = [...units]
    
    if (sortConfig) {
      sortedUnits.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Unit]
        let bValue: any = b[sortConfig.key as keyof Unit]
        
        if (sortConfig.key === 'remaining') {
          aValue = calculateRemainingAmount(a, contracts, installments, vouchers)
          bValue = calculateRemainingAmount(b, contracts, installments, vouchers)
        }
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    
    return sortedUnits
  }

  const getFilteredUnits = () => {
    const sortedUnits = getSortedUnits()
    
    if (!search) return sortedUnits
    
    return sortedUnits.filter(unit => {
      const searchable = `${unit.code || ''} ${unit.name || ''} ${unit.floor || ''} ${unit.building || ''} ${unit.status || ''} ${unit.area || ''} ${unit.unitType || ''}`.toLowerCase()
      return searchable.includes(search.toLowerCase())
    })
  }

  const exportToCSV = () => {
    const headers = ['كود الوحدة', 'الاسم', 'النوع', 'المساحة', 'الطابق', 'المبنى', 'السعر', 'المتبقي', 'الحالة', 'الشركاء', 'ملاحظات']
    const rows = getFilteredUnits().map(unit => {
      const partners = getUnitPartners(unit.id)
        .map(up => `${getPartnerName(up.partnerId)} (${up.percentage}%)`)
        .join(' | ')
      const remaining = calculateRemainingAmount(unit, contracts, installments, vouchers)
      
      return [
        unit.code,
        unit.name || '',
        unit.unitType,
        unit.area || '',
        unit.floor || '',
        unit.building || '',
        unit.totalPrice,
        remaining,
        unit.status,
        partners || 'لا يوجد شركاء',
        unit.notes || ''
      ]
    })
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `units-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printPDF = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>تقرير الوحدات</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: left; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير الوحدات</h1>
            <div class="date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>كود الوحدة</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>المساحة</th>
                <th>الطابق</th>
                <th>المبنى</th>
                <th>السعر</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>الشركاء</th>
              </tr>
            </thead>
            <tbody>
              ${getFilteredUnits().map(unit => {
                const partners = getUnitPartners(unit.id)
                  .map(up => `${getPartnerName(up.partnerId)} (${up.percentage}%)`)
                  .join(', ')
                const remaining = calculateRemainingAmount(unit, contracts, installments, vouchers)
                
                return `
                  <tr>
                    <td>${unit.code}</td>
                    <td>${unit.name || ''}</td>
                    <td>${unit.unitType}</td>
                    <td>${unit.area || ''}</td>
                    <td>${unit.floor || ''}</td>
                    <td>${unit.building || ''}</td>
                    <td>${formatCurrency(unit.totalPrice)}</td>
                    <td>${formatCurrency(remaining)}</td>
                    <td>${unit.status}</td>
                    <td>${partners || 'لا يوجد شركاء'}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const openUnitDetails = (unit: Unit) => {
    setSelectedUnit(unit)
    setShowUnitDetailsModal(true)
    setNewPartner({ partnerId: '', percentage: '' })
  }

  const addPartnerToUnit = async () => {
    if (!selectedUnit || !newPartner.partnerId || !newPartner.percentage) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال جميع البيانات المطلوبة'
      })
      return
    }

    const percentage = parseFloat(newPartner.percentage)
    if (percentage <= 0 || percentage > 100) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'النسبة المئوية يجب أن تكون بين 0 و 100'
      })
      return
    }

    // Check total percentage
    const currentPartners = getUnitPartners(selectedUnit.id)
    const totalPercentage = currentPartners.reduce((sum, up) => sum + up.percentage, 0)
    if (totalPercentage + percentage > 100) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: `إجمالي النسب سيكون ${totalPercentage + percentage}% ويجب أن يكون 100% أو أقل`
      })
      return
    }

    try {
      const response = await fetch('/api/unit-partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          unitId: selectedUnit.id,
          partnerId: newPartner.partnerId,
          percentage: percentage
        })
      })

      const data = await response.json()
      if (data.success) {
        setUnitPartners(prev => [...prev, data.data])
        setNewPartner({ partnerId: '', percentage: '' })
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الشريك للوحدة بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الشريك'
        })
      }
    } catch (err) {
      console.error('Add partner error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الشريك'
      })
    }
  }

  const removePartnerFromUnit = async (unitPartnerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك من الوحدة؟')) return

    try {
      const response = await fetch(`/api/unit-partners/${unitPartnerId}`, {
        method: 'DELETE',
        headers: {}
      })

      const data = await response.json()
      if (data.success) {
        setUnitPartners(prev => prev.filter(up => up.id !== unitPartnerId))
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف الشريك من الوحدة بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف الشريك'
        })
      }
    } catch (err) {
      console.error('Remove partner error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف الشريك'
      })
    }
  }

  const updatePartnerPercentage = async (unitPartnerId: string, newPercentage: number) => {
    if (newPercentage <= 0 || newPercentage > 100) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'النسبة المئوية يجب أن تكون بين 0 و 100'
      })
      return
    }

    try {
      const response = await fetch(`/api/unit-partners/${unitPartnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ percentage: newPercentage })
      })

      const data = await response.json()
      if (data.success) {
        setUnitPartners(prev => prev.map(up => 
          up.id === unitPartnerId ? { ...up, percentage: newPercentage } : up
        ))
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث نسبة الشريك بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث نسبة الشريك'
        })
      }
    } catch (err) {
      console.error('Update partner percentage error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث نسبة الشريك'
      })
    }
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
                <span className="text-white text-xl">🏠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة الوحدات</h1>
                <p className="text-gray-600">نظام متطور لإدارة الوحدات العقارية</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton onClick={() => setShowAddModal(true)}>
                <span className="mr-2">➕</span>
                إضافة وحدة جديدة
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
                  placeholder="🔍 ابحث في الوحدات... (Ctrl+F)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
                />
              </div>
              <ModernButton variant="secondary" size="sm" onClick={exportToCSV}>
                📊 تصدير CSV
              </ModernButton>
              <ModernButton variant="secondary" size="sm" onClick={printPDF}>
                🖨️ طباعة PDF
              </ModernButton>
            </div>
            <div className="text-sm text-gray-500">
              {units.length} وحدة
            </div>
          </div>
        </ModernCard>

        {/* Units List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الوحدات</h2>
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

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('code')}
                  >
                    كود الوحدة {sortConfig?.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    الاسم {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('unitType')}
                  >
                    النوع {sortConfig?.key === 'unitType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('area')}
                  >
                    المساحة {sortConfig?.key === 'area' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('floor')}
                  >
                    الطابق {sortConfig?.key === 'floor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('building')}
                  >
                    المبنى {sortConfig?.key === 'building' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('totalPrice')}
                  >
                    السعر {sortConfig?.key === 'totalPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('remaining')}
                  >
                    المتبقي {sortConfig?.key === 'remaining' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    الحالة {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الشركاء</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredUnits().map((unit) => {
                  const partners = getUnitPartners(unit.id)
                  return (
                    <tr 
                      key={unit.id} 
                      className={`
                        border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300
                        ${deletingUnits.has(unit.id) 
                          ? 'transform translate-x-full opacity-0 scale-95' 
                          : 'transform translate-x-0 opacity-100 scale-100'
                        }
                      `}
                    >
                      <td className="py-4 px-6">
                        <div className="text-gray-900 font-bold text-base">{unit.code}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.name || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.unitType}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.area || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.floor || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.building || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-green-800">{formatCurrency(unit.totalPrice)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-blue-800">
                          {formatCurrency(calculateRemainingAmount(unit, contracts, installments, vouchers))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          unit.status === 'متاحة' 
                            ? 'bg-green-100 text-green-800' 
                            : unit.status === 'محجوزة'
                            ? 'bg-yellow-100 text-yellow-800'
                            : unit.status === 'مباعة'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {partners.length > 0 ? (
                            <div>
                              {partners.map((partner, index) => (
                                <div key={index} className="text-gray-800">
                                  {getPartnerName(partner.partnerId)} ({partner.percentage}%)
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">لا يوجد شركاء</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ModernButton size="sm" variant="info" onClick={() => openUnitDetails(unit)}>
                            ⚙️ إدارة
                          </ModernButton>
                          <ModernButton size="sm" variant="secondary" onClick={() => openEditModal(unit)}>
                            ✏️ تعديل
                          </ModernButton>
                          <ModernButton size="sm" variant="danger" onClick={() => handleDeleteUnit(unit.id)}>
                            🗑️ حذف
                          </ModernButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ModernCard>
      </div>

      {/* Add/Edit Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUnit(null)
                    setNewUnit({
                      code: '',
                      name: '',
                      unitType: '',
                      area: '',
                      floor: '',
                      building: '',
                      totalPrice: '',
                      status: 'متاحة',
                      notes: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={editingUnit ? handleEditUnit : handleAddUnit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="كود الوحدة *"
                  type="text"
                  value={newUnit.code}
                  onChange={(e: any) => setNewUnit({...newUnit, code: e.target.value})}
                  placeholder="كود الوحدة"
                />
                
                <ModernInput
                  label="اسم الوحدة"
                  type="text"
                  value={newUnit.name}
                  onChange={(e: any) => setNewUnit({...newUnit, name: e.target.value})}
                  placeholder="اسم الوحدة"
                />
                
                <ModernSelect
                  label="نوع الوحدة *"
                  value={newUnit.unitType}
                  onChange={(e: any) => setNewUnit({...newUnit, unitType: e.target.value})}
                >
                  <option value="">اختر نوع الوحدة...</option>
                  <option value="شقة">شقة</option>
                  <option value="فيلا">فيلا</option>
                  <option value="محل">محل</option>
                  <option value="مكتب">مكتب</option>
                  <option value="مستودع">مستودع</option>
                </ModernSelect>
                
                <ModernInput
                  label="المساحة"
                  type="text"
                  value={newUnit.area}
                  onChange={(e: any) => setNewUnit({...newUnit, area: e.target.value})}
                  placeholder="المساحة بالمتر المربع"
                />
                
                <ModernInput
                  label="الطابق"
                  type="text"
                  value={newUnit.floor}
                  onChange={(e: any) => setNewUnit({...newUnit, floor: e.target.value})}
                  placeholder="رقم الطابق"
                />
                
                <ModernInput
                  label="المبنى"
                  type="text"
                  value={newUnit.building}
                  onChange={(e: any) => setNewUnit({...newUnit, building: e.target.value})}
                  placeholder="اسم المبنى"
                />
                
                <ModernInput
                  label="السعر الإجمالي *"
                  type="number"
                  value={newUnit.totalPrice}
                  onChange={(e: any) => setNewUnit({...newUnit, totalPrice: e.target.value})}
                  placeholder="السعر الإجمالي"
                />
                
                <ModernSelect
                  label="الحالة"
                  value={newUnit.status}
                  onChange={(e: any) => setNewUnit({...newUnit, status: e.target.value})}
                >
                  <option value="متاحة">متاحة</option>
                  <option value="محجوزة">محجوزة</option>
                  <option value="مباعة">مباعة</option>
                  <option value="مرتجعة">مرتجعة</option>
                </ModernSelect>
                
                <ModernSelect
                  label="مجموعة الشركاء *"
                  value={newUnit.partnerGroupId}
                  onChange={(e: any) => setNewUnit({...newUnit, partnerGroupId: e.target.value})}
                >
                  <option value="">اختر مجموعة شركاء...</option>
                  {partnerGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </ModernSelect>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                    <textarea
                      value={newUnit.notes}
                      onChange={(e: any) => setNewUnit({...newUnit, notes: e.target.value})}
                      placeholder="ملاحظات إضافية"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => {
                  setShowAddModal(false)
                  setEditingUnit(null)
                  setNewUnit({
                    code: '',
                    name: '',
                    unitType: '',
                    area: '',
                    floor: '',
                    building: '',
                    totalPrice: '',
                    status: 'متاحة',
                    notes: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  {editingUnit ? 'تحديث الوحدة' : 'إضافة الوحدة'}
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Details Modal */}
      {showUnitDetailsModal && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  إدارة الوحدة - {selectedUnit.code}
                </h2>
                <button
                  onClick={() => {
                    setShowUnitDetailsModal(false)
                    setSelectedUnit(null)
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Unit Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات الوحدة</h3>
                  <div className="space-y-3">
                    <div><span className="font-semibold text-gray-800">الاسم:</span> <span className="text-gray-700">{selectedUnit.name || '-'}</span></div>
                    <div><span className="font-semibold text-gray-800">النوع:</span> <span className="text-gray-700">{selectedUnit.unitType}</span></div>
                    <div><span className="font-semibold text-gray-800">المساحة:</span> <span className="text-gray-700">{selectedUnit.area || '-'}</span></div>
                    <div><span className="font-semibold text-gray-800">الطابق:</span> <span className="text-gray-700">{selectedUnit.floor || '-'}</span></div>
                    <div><span className="font-semibold text-gray-800">المبنى:</span> <span className="text-gray-700">{selectedUnit.building || '-'}</span></div>
                    <div><span className="font-semibold text-gray-800">السعر:</span> <span className="text-gray-700">{formatCurrency(selectedUnit.totalPrice)}</span></div>
                    <div><span className="font-semibold text-gray-800">المتبقي:</span> <span className="text-gray-700">{formatCurrency(calculateRemainingAmount(selectedUnit, contracts, installments, vouchers))}</span></div>
                    <div><span className="font-semibold text-gray-800">الحالة:</span> <span className="text-gray-700">{selectedUnit.status}</span></div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">الشركاء الحاليون</h3>
                  <div className="space-y-2">
                    {getUnitPartners(selectedUnit.id).map((partner, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-semibold text-gray-800">{getPartnerName(partner.partnerId)}</span>
                          <span className="text-gray-600 mr-2">({partner.percentage}%)</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            defaultValue={partner.percentage}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-800"
                            onBlur={(e) => {
                              const newPercentage = parseFloat(e.target.value)
                              if (newPercentage !== partner.percentage) {
                                updatePartnerPercentage(partner.id, newPercentage)
                              }
                            }}
                          />
                          <ModernButton 
                            size="sm" 
                            variant="danger" 
                            onClick={() => removePartnerFromUnit(partner.id)}
                          >
                            حذف
                          </ModernButton>
                        </div>
                      </div>
                    ))}
                    {getUnitPartners(selectedUnit.id).length === 0 && (
                      <div className="text-gray-500 text-center py-4">لا يوجد شركاء</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add New Partner */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة شريك جديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ModernSelect
                    label="اختر الشريك"
                    value={newPartner.partnerId}
                    onChange={(e: any) => setNewPartner({...newPartner, partnerId: e.target.value})}
                  >
                    <option value="">اختر شريك...</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>{partner.name}</option>
                    ))}
                  </ModernSelect>
                  
                  <ModernInput
                    label="النسبة المئوية"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newPartner.percentage}
                    onChange={(e: any) => setNewPartner({...newPartner, percentage: e.target.value})}
                    placeholder="النسبة %"
                  />
                  
                  <div className="flex items-end">
                    <ModernButton onClick={addPartnerToUnit} className="w-full">
                      إضافة شريك
                    </ModernButton>
                  </div>
                </div>
              </div>
            </div>
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