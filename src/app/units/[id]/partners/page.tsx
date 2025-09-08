'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Unit, UnitPartner, Partner } from '@/types'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'

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

export default function UnitPartnersManagement() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    if (params.id) {
      fetchUnitData(params.id as string)
    }
  }, [params.id])

  const fetchUnitData = async (unitId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      
      const [unitResponse, unitPartnersResponse, partnersResponse] = await Promise.all([
        fetch(`/api/units/${unitId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/unit-partners', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/partners', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const [unitData, unitPartnersData, partnersData] = await Promise.all([
        unitResponse.json(),
        unitPartnersResponse.json(),
        partnersResponse.json()
      ])
      
      if (unitData.success) {
        setUnit(unitData.data)
      } else {
        setError(unitData.error || 'خطأ في تحميل الوحدة')
      }

      if (unitPartnersData.success) {
        const filteredPartners = unitPartnersData.data.filter((up: UnitPartner) => up.unitId === unitId)
        setUnitPartners(filteredPartners)
      }

      if (partnersData.success) {
        setPartners(partnersData.data)
      }
    } catch (err) {
      console.error('Error fetching unit data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : `شريك ${partnerId.slice(-4)}`
  }

  const handleRemovePartner = async (unitPartnerId: string) => {
    if (confirm('هل أنت متأكد من إزالة هذا الشريك من الوحدة؟')) {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/unit-partners/${unitPartnerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          addNotification({
            type: 'success',
            title: 'تم الحذف',
            message: 'تم إزالة الشريك من الوحدة بنجاح'
          })
          // إعادة تحميل البيانات
          fetchUnitData(params.id as string)
        } else {
          addNotification({
            type: 'error',
            title: 'خطأ',
            message: 'فشل في إزالة الشريك'
          })
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'خطأ',
          message: 'حدث خطأ في إزالة الشريك'
        })
      }
    }
  }

  if (loading) {
    return (
      <Layout title="إدارة شركاء الوحدة" subtitle="إدارة الشركاء المرتبطين بالوحدة" icon="👥">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !unit) {
    return (
      <Layout title="إدارة شركاء الوحدة" subtitle="إدارة الشركاء المرتبطين بالوحدة" icon="👥">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">خطأ في تحميل الوحدة</h2>
            <p className="text-gray-500 mb-4">{error || 'الوحدة غير موجودة'}</p>
            <ModernButton onClick={() => router.push('/units')}>
              العودة للوحدات
            </ModernButton>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="إدارة شركاء الوحدة" subtitle="إدارة الشركاء المرتبطين بالوحدة" icon="👥">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة شركاء الوحدة</h1>
              <p className="text-gray-600">{unit.code} - {unit.name || 'بدون اسم'}</p>
            </div>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <ModernButton variant="secondary" onClick={() => router.push(`/units/${unit.id}`)}>
              العودة لإدارة الوحدة
            </ModernButton>
            <ModernButton variant="secondary" onClick={() => router.push('/units')}>
              العودة للوحدات
            </ModernButton>
          </div>
        </div>

        {/* Unit Info */}
        <ModernCard className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">معلومات الوحدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">كود الوحدة:</span>
              <span className="font-bold text-gray-900">{unit.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">الاسم:</span>
              <span className="font-semibold text-gray-900">{unit.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">النوع:</span>
              <span className="font-semibold text-gray-900">{unit.unitType}</span>
            </div>
          </div>
        </ModernCard>

        {/* Partners List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">الشركاء المرتبطين</h3>
            <div className="text-sm text-gray-600">
              إجمالي النسب: {unitPartners.reduce((sum, up) => sum + up.percentage, 0)}%
            </div>
          </div>
          
          {unitPartners.length > 0 ? (
            <div className="space-y-4">
              {unitPartners.map((unitPartner) => (
                <div key={unitPartner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {getPartnerName(unitPartner.partnerId).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{getPartnerName(unitPartner.partnerId)}</h4>
                      <p className="text-sm text-gray-600">شريك في الوحدة</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{unitPartner.percentage}%</div>
                      <div className="text-sm text-gray-600">نسبة الملكية</div>
                    </div>
                    <ModernButton 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleRemovePartner(unitPartner.id)}
                    >
                      🗑️ إزالة
                    </ModernButton>
                  </div>
                </div>
              ))}
              
              {/* Total Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">المجموع:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {unitPartners.reduce((sum, up) => sum + up.percentage, 0)}%
                  </span>
                </div>
                {unitPartners.reduce((sum, up) => sum + up.percentage, 0) !== 100 && (
                  <div className="mt-2 text-sm text-yellow-600">
                    ⚠️ مجموع النسب يجب أن يكون 100%
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا يوجد شركاء</h3>
              <p className="text-gray-500 mb-6">هذه الوحدة لا تحتوي على شركاء مرتبطين</p>
              <ModernButton>
                إضافة شريك جديد
              </ModernButton>
            </div>
          )}
        </ModernCard>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}