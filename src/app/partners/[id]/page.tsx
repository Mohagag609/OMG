'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Partner, UnitPartner, Voucher, PartnerDebt } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

export default function PartnerDetails() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [partnerDebts, setPartnerDebts] = useState<PartnerDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      const unitPartnersResponse = await fetch(`/api/unit-partners?unitId=${partnerId}`, {
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
            expense: 0
          })
          totalIncome += income
        } else if (voucher.description.includes('عمولة سمسار')) {
          const expense = voucher.amount * share
          transactions.push({
            date: voucher.date.toString(),
            description: voucher.description,
            income: 0,
            expense
          })
          totalExpense += expense
        }
      }
    })

    // Process partner debts
    partnerDebts.forEach(debt => {
      if (debt.status === 'مدفوع') {
        // This is simplified - in real implementation you'd need to track which partner owes/pays
        transactions.push({
          date: debt.dueDate.toString(),
          description: `دين شريك - ${debt.notes || 'بدون ملاحظات'}`,
          income: debt.amount,
          expense: 0
        })
        totalIncome += debt.amount
      }
    })

    transactions.sort((a, b) => a.date.localeCompare(b.date))

    return {
      transactions,
      totalIncome,
      totalExpense,
      netPosition: totalIncome - totalExpense
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

  if (error || !partner) {
    return (
      <div className="container">
        <div className="panel">
          <h2>خطأ</h2>
          <p>{error || 'لم يتم العثور على الشريك'}</p>
          <button className="btn secondary" onClick={() => router.push('/partners')}>
            العودة للشركاء
          </button>
        </div>
      </div>
    )
  }

  const ledger = calculatePartnerLedger()

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">👤</div>
          <h1>تفاصيل الشريك: {partner.name}</h1>
        </div>
        <div className="tools">
          <button className="btn secondary" onClick={() => router.push('/partners')}>
            العودة للشركاء
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab active">الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-debts')}>ديون الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          {/* Partner Info */}
          <div className="panel">
            <h2>بيانات الشريك</h2>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <label className="form-label">الاسم</label>
                <p className="form-value">{partner.name}</p>
              </div>
              <div>
                <label className="form-label">الهاتف</label>
                <p className="form-value">{partner.phone || '-'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">ملاحظات</label>
                <p className="form-value">{partner.notes || '-'}</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid-3" style={{ gap: '16px', marginTop: '20px' }}>
            <div className="card">
              <h4>إجمالي الدخل</h4>
              <div className="big" style={{ color: 'var(--ok)' }}>
                {formatCurrency(ledger.totalIncome)}
              </div>
            </div>
            <div className="card">
              <h4>إجمالي المصروفات</h4>
              <div className="big" style={{ color: 'var(--warn)' }}>
                {formatCurrency(ledger.totalExpense)}
              </div>
            </div>
            <div className="card">
              <h4>صافي الموقف</h4>
              <div className="big" style={{ color: 'var(--brand)' }}>
                {formatCurrency(ledger.netPosition)}
              </div>
            </div>
          </div>

          {/* Units and Ledger */}
          <div className="grid-2" style={{ gap: '16px', marginTop: '20px' }}>
            <div className="panel">
              <h3>الوحدات المملوكة</h3>
              {unitPartners.length === 0 ? (
                <p>لا توجد وحدات مملوكة</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>الوحدة</th>
                      <th>نسبة الملكية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitPartners.map((up) => (
                      <tr key={up.id}>
                        <td>{(up as any).unit?.code || 'غير محدد'}</td>
                        <td>{up.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="panel">
              <h3>كشف الحساب التفصيلي</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {ledger.transactions.length === 0 ? (
                  <p>لا توجد معاملات</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>البيان</th>
                        <th>دخل</th>
                        <th>صرف</th>
                        <th>الرصيد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.transactions.map((tx, index) => {
                        let balance = 0
                        for (let i = 0; i <= index; i++) {
                          balance += ledger.transactions[i].income - ledger.transactions[i].expense
                        }
                        return (
                          <tr key={index}>
                            <td>{formatDate(tx.date)}</td>
                            <td>{tx.description}</td>
                            <td>
                              {tx.income > 0 ? (
                                <span style={{ color: 'var(--ok)' }}>
                                  {formatCurrency(tx.income)}
                                </span>
                              ) : '—'}
                            </td>
                            <td>
                              {tx.expense > 0 ? (
                                <span style={{ color: 'var(--warn)' }}>
                                  {formatCurrency(tx.expense)}
                                </span>
                              ) : '—'}
                            </td>
                            <td>
                              <strong style={{ color: 'var(--brand)' }}>
                                {formatCurrency(balance)}
                              </strong>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
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