'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BrokersPage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">🏛️</div>
          <h1>مدير الاستثمار العقاري — السماسرة</h1>
        </div>
        <div className="tools">
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab active">السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>السماسرة</h2>
            <p>صفحة السماسرة قيد التطوير...</p>
          </div>
        </div>
      </div>
    </div>
  )
}