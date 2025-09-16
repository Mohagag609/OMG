// Simple formatting utilities

// تنسيق العملة
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// تنسيق النسبة المئوية
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(value) + '%'
}

// تنسيق التاريخ
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// تنسيق الرقم
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-SA').format(value)
}