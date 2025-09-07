'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Contract, Unit, Customer, Safe, Broker } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

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
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContract, setNewContract] = useState({
    unitId: '',
    customerId: '',
    start: '',
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
      
      // Fetch contracts
      const contractsResponse = await fetch('/api/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const contractsData = await contractsResponse.json()
      if (contractsData.success) {
        setContracts(contractsData.data)
      } else {
        setError(contractsData.error || 'خطأ في تحميل العقود')
      }

      // Fetch units
      const unitsResponse = await fetch('/api/units', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const unitsData = await unitsResponse.json()
      if (unitsData.success) {
        setUnits(unitsData.data)
      }

      // Fetch customers
      const customersResponse = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const customersData = await customersResponse.json()
      if (customersData.success) {
        setCustomers(customersData.data)
      }

      // Fetch safes
      const safesResponse = await fetch('/api/safes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const safesData = await safesResponse.json()
      if (safesData.success) {
        setSafes(safesData.data)
      }

      // Fetch brokers
      const brokersResponse = await fetch('/api/brokers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const brokersData = await brokersResponse.json()
      if (brokersData.success) {
        setBrokers(brokersData.data)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
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
        setShowAddForm(false)
        setSuccess('تم إضافة العقد بنجاح!')
        setError(null)
        setNewContract({
          unitId: '',
          customerId: '',
          start: '',
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
    updateFormForPaymentType()
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
    updateTotalInstallments()
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

  if (loading) {
    return (
      <div className="container">
        <div className="panel">
          <h2>جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">📋</div>
          <h1>إدارة العقود</h1>
        </div>
        <div className="tools">
          <button className="btn primary" onClick={() => setShowAddForm(true)}>
            إضافة عقد جديد
          </button>
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للرئيسية
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab active">العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-debts')}>ديون الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          {showAddForm && (
            <div className="panel" style={{ marginBottom: '20px' }}>
              <h2>إضافة عقد جديد</h2>
              {success && <div className="success-message">{success}</div>}
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleAddContract}>
                <div className="grid-4" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">الوحدة *</label>
                    <select
                      className="form-select"
                      value={newContract.unitId}
                      onChange={(e) => {
                        setNewContract({...newContract, unitId: e.target.value})
                        updateFormForUnit(e.target.value)
                      }}
                      required
                    >
                      <option value="">اختر الوحدة...</option>
                      {units.filter(u => u.status === 'متاحة' || u.status === 'محجوزة').map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">العميل *</label>
                    <select
                      className="form-select"
                      value={newContract.customerId}
                      onChange={(e) => setNewContract({...newContract, customerId: e.target.value})}
                      required
                    >
                      <option value="">اختر العميل...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">السعر الكلي</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.totalPrice}
                      readOnly
                      style={{ background: 'var(--bg)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">نوع الدفع</label>
                    <select
                      className="form-select"
                      value={newContract.paymentType}
                      onChange={(e) => {
                        setNewContract({...newContract, paymentType: e.target.value})
                        updateFormForPaymentType()
                      }}
                    >
                      <option value="installment">تقسيط</option>
                      <option value="cash">كاش</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">المقدم</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.downPayment}
                      onChange={(e) => setNewContract({...newContract, downPayment: e.target.value})}
                      placeholder="المقدم"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">خزنة المقدم</label>
                    <select
                      className="form-select"
                      value={newContract.downPaymentSafeId}
                      onChange={(e) => setNewContract({...newContract, downPaymentSafeId: e.target.value})}
                    >
                      <option value="">اختر خزنة المقدم...</option>
                      {safes.map((safe) => (
                        <option key={safe.id} value={safe.id}>
                          {safe.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">مبلغ الخصم</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.discountAmount}
                      onChange={(e) => setNewContract({...newContract, discountAmount: e.target.value})}
                      placeholder="مبلغ الخصم"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">وديعة الصيانة</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.maintenanceDeposit}
                      onChange={(e) => setNewContract({...newContract, maintenanceDeposit: e.target.value})}
                      placeholder="وديعة الصيانة"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">اسم السمسار</label>
                    <select
                      className="form-select"
                      value={newContract.brokerName}
                      onChange={(e) => setNewContract({...newContract, brokerName: e.target.value})}
                    >
                      <option value="">اختر سمسار...</option>
                      {brokers.map((broker) => (
                        <option key={broker.id} value={broker.name}>
                          {broker.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">نسبة العمولة %</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.brokerPercent}
                      onChange={(e) => setNewContract({...newContract, brokerPercent: e.target.value})}
                      placeholder="نسبة العمولة %"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">خزنة العمولة</label>
                    <select
                      className="form-select"
                      value={newContract.commissionSafeId}
                      onChange={(e) => setNewContract({...newContract, commissionSafeId: e.target.value})}
                    >
                      <option value="">اختر خزنة العمولة...</option>
                      {safes.map((safe) => (
                        <option key={safe.id} value={safe.id}>
                          {safe.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">تاريخ البداية</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newContract.start}
                      onChange={(e) => setNewContract({...newContract, start: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {newContract.paymentType === 'installment' && (
                  <div className="panel" style={{ marginBottom: '16px' }}>
                    <h4>خيارات الأقساط</h4>
                    <div className="grid-2" style={{ gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">نوع الأقساط</label>
                        <select
                          className="form-select"
                          value={newContract.installmentType}
                          onChange={(e) => setNewContract({...newContract, installmentType: e.target.value})}
                        >
                          <option value="شهري">شهري</option>
                          <option value="ربع سنوي">ربع سنوي</option>
                          <option value="نصف سنوي">نصف سنوي</option>
                          <option value="سنوي">سنوي</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">عدد الدفعات</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newContract.installmentCount}
                          onChange={(e) => setNewContract({...newContract, installmentCount: e.target.value})}
                          placeholder="عدد الدفعات"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">عدد الدفعات السنوية (0-3)</label>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          max="3"
                          value={newContract.extraAnnual}
                          onChange={(e) => setNewContract({...newContract, extraAnnual: e.target.value})}
                          placeholder="عدد الدفعات السنوية (0-3)"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">قيمة الدفعة السنوية</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newContract.annualPaymentValue}
                          onChange={(e) => setNewContract({...newContract, annualPaymentValue: e.target.value})}
                          placeholder="قيمة الدفعة السنوية"
                        />
                      </div>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>
                      إجمالي عدد الأقساط: <span style={{ fontWeight: 'bold' }}>{updateTotalInstallments()}</span>
                    </div>
                  </div>
                )}
                
                <div className="tools">
                  <button type="submit" className="btn primary">
                    حفظ + توليد أقساط
                  </button>
                  <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="panel">
            <h2>قائمة العقود</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="tools" style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="بحث بالكود, الوحدة, العميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
              <button className="btn secondary">تصدير CSV</button>
              <button className="btn secondary">طباعة PDF</button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>كود العقد</th>
                    <th>الوحدة</th>
                    <th>العميل</th>
                    <th>السمسار</th>
                    <th>السعر</th>
                    <th>تاريخ البدء</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.filter(contract => 
                    search === '' || 
                    contract.unit?.code.toLowerCase().includes(search.toLowerCase()) ||
                    contract.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
                    (contract.brokerName && contract.brokerName.toLowerCase().includes(search.toLowerCase()))
                  ).map((contract) => (
                    <tr key={contract.id}>
                      <td>{contract.id}</td>
                      <td>{getUnitName(contract.unitId)}</td>
                      <td>{getCustomerName(contract.customerId)}</td>
                      <td>{contract.brokerName || '-'}</td>
                      <td>{formatCurrency(contract.totalPrice)}</td>
                      <td>{formatDate(contract.start)}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                        >
                          عرض
                        </button>
                        <button
                          className="btn gold"
                          style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                        >
                          تعديل
                        </button>
                        <button
                          className="btn warn"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}