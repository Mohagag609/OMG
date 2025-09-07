'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Contract } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
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
    brokerAmount: '',
    notes: ''
  })
  const [customers, setCustomers] = useState([])
  const [units, setUnits] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchContracts()
    fetchCustomers()
    fetchUnits()
  }, [])

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/contracts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken')
          router.push('/login')
          return
        }
        throw new Error('فشل في تحميل العقود')
      }

      const data = await response.json()
      if (data.success) {
        setContracts(data.data || [])
      } else {
        setError(data.error || 'خطأ في تحميل العقود')
      }
    } catch (err) {
      console.error('Contracts error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCustomers(data.data || [])
        }
      }
    } catch (err) {
      console.error('Customers error:', err)
    }
  }

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnits(data.data || [])
        }
      }
    } catch (err) {
      console.error('Units error:', err)
    }
  }

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault()
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
          totalPrice: parseFloat(newContract.totalPrice),
          discountAmount: parseFloat(newContract.discountAmount),
          brokerAmount: parseFloat(newContract.brokerAmount)
        })
      })

      if (!response.ok) {
        throw new Error('فشل في إضافة العقد')
      }

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
          brokerAmount: '',
          notes: ''
        })
        fetchContracts()
      } else {
        setError(data.error || 'خطأ في إضافة العقد')
        setSuccess(null)
      }
    } catch (err) {
      console.error('Add contract error:', err)
      setError('خطأ في إضافة العقد')
      setSuccess(null)
    }
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">الوحدة</label>
                    <select
                      className="form-select"
                      value={newContract.unitId}
                      onChange={(e) => setNewContract({...newContract, unitId: e.target.value})}
                      required
                    >
                      <option value="">اختر الوحدة</option>
                      {units.map((unit: any) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.code} - {unit.type} - {unit.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">العميل</label>
                    <select
                      className="form-select"
                      value={newContract.customerId}
                      onChange={(e) => setNewContract({...newContract, customerId: e.target.value})}
                      required
                    >
                      <option value="">اختر العميل</option>
                      {customers.map((customer: any) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
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
                  
                  <div className="form-group">
                    <label className="form-label">السعر الإجمالي</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.totalPrice}
                      onChange={(e) => setNewContract({...newContract, totalPrice: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">مبلغ الخصم</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.discountAmount}
                      onChange={(e) => setNewContract({...newContract, discountAmount: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">اسم السمسار</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newContract.brokerName}
                      onChange={(e) => setNewContract({...newContract, brokerName: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">مبلغ السمسار</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newContract.brokerAmount}
                      onChange={(e) => setNewContract({...newContract, brokerAmount: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">ملاحظات</label>
                    <textarea
                      className="form-textarea"
                      value={newContract.notes}
                      onChange={(e) => setNewContract({...newContract, notes: e.target.value})}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn primary">
                    إضافة العقد
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
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في العقود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>الوحدة</th>
                    <th>العميل</th>
                    <th>تاريخ البداية</th>
                    <th>السعر الإجمالي</th>
                    <th>مبلغ الخصم</th>
                    <th>اسم السمسار</th>
                    <th>مبلغ السمسار</th>
                    <th>تاريخ الإضافة</th>
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
                      <td>{contract.unit?.code || '-'}</td>
                      <td>{contract.customer?.name || '-'}</td>
                      <td>{formatDate(contract.start)}</td>
                      <td>{formatCurrency(contract.totalPrice)}</td>
                      <td>{formatCurrency(contract.discountAmount)}</td>
                      <td>{contract.brokerName || '-'}</td>
                      <td>{formatCurrency(contract.brokerAmount)}</td>
                      <td>{contract.createdAt ? formatDate(contract.createdAt) : '-'}</td>
                      <td>
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
    </div>
  )
}