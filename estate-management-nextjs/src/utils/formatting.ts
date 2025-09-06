import { formatSpecs } from '../constants/formats'

// Currency formatting: Arabic Egyptian Pound
export const formatCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return `${formatter.format(amount)} ج.م`
}

// Percentage formatting
export const formatPercentage = (value: number): string => {
  const formatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return `${formatter.format(value)}%`
}

// Date formatting: DD/MM/YYYY for display
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Date formatting for storage: YYYY-MM-DD
export const formatDateForStorage = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// Phone formatting: 01XXXXXXXXX
export const formatPhone = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as 01XXXXXXXXX
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits
  }
  
  return phone
}

// National ID formatting: 14 digits
export const formatNationalId = (nationalId: string): string => {
  // Remove any non-digit characters
  const digits = nationalId.replace(/\D/g, '')
  
  // Ensure exactly 14 digits
  if (digits.length === 14) {
    return digits
  }
  
  return nationalId
}

// Unit code formatting: A-XXX
export const formatUnitCode = (code: string): string => {
  // Convert to uppercase and ensure proper format
  const upperCode = code.toUpperCase()
  
  // If it doesn't match the pattern, try to fix it
  if (!/^[A-Z]-[0-9]+$/.test(upperCode)) {
    // Extract letter and numbers
    const match = upperCode.match(/^([A-Z])?[^0-9]*([0-9]+)$/)
    if (match) {
      const letter = match[1] || 'A'
      const number = match[2]
      return `${letter}-${number}`
    }
  }
  
  return upperCode
}

// Number parsing: Remove non-numeric characters except decimal point
export const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value
  
  const cleaned = String(value).replace(/[^\d.]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// Round to 2 decimal places
export const roundToTwo = (value: number): number => {
  return Math.round(value * 100) / 100
}

// Generate unique ID with prefix
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

// Get today's date in YYYY-MM-DD format
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0]
}