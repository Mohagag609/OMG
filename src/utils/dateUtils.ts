// Date utilities for Gregorian calendar

// Format date to Arabic Gregorian format
export function formatDate(date: string | Date): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  })
}

// Format date to short Arabic Gregorian format
export function formatDateShort(date: string | Date): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    calendar: 'gregory'
  })
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory'
  })
}

// Get current date in Arabic Gregorian format
export function getCurrentDate(): string {
  return formatDate(new Date())
}

// Get current date and time in Arabic Gregorian format
export function getCurrentDateTime(): string {
  return formatDateTime(new Date())
}

// Parse date from Arabic Gregorian format
export function parseArabicDate(dateString: string): Date | null {
  if (!dateString) return null
  
  try {
    // Try to parse the date string
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date
  } catch (error) {
    return null
  }
}

// Format date for database storage (ISO format)
export function formatDateForDB(date: string | Date): string {
  if (!date) return new Date().toISOString()
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return new Date().toISOString()
  
  return dateObj.toISOString()
}