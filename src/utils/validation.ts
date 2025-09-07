import { errorCatalog } from '../constants/errors'

// Phone validation: Egyptian mobile numbers
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]{9}$/
  return phoneRegex.test(phone)
}

// National ID validation: 14 digits
export const validateNationalId = (nationalId: string): boolean => {
  const nationalIdRegex = /^[0-9]{14}$/
  return nationalIdRegex.test(nationalId)
}

// Amount validation: positive number
export const validateAmount = (amount: number): boolean => {
  return amount >= 0 && isFinite(amount)
}

// Percentage validation: 0-100
export const validatePercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100
}

// Date validation: YYYY-MM-DD format
export const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false
  
  const parsedDate = new Date(date)
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
}

// Unit code validation: A-XXX format
export const validateUnitCode = (code: string): boolean => {
  const codeRegex = /^[A-Z]-[0-9]+$/
  return codeRegex.test(code)
}

// Required field validation
export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

// Validation error messages
export const getValidationError = (field: string, type: string): string => {
  const fieldErrors: Record<string, Record<string, string>> = {
    phone: {
      required: errorCatalog.validation.required,
      invalid: errorCatalog.validation.invalid_phone
    },
    nationalId: {
      required: errorCatalog.validation.required,
      invalid: errorCatalog.validation.invalid_national_id
    },
    amount: {
      required: errorCatalog.validation.required,
      invalid: errorCatalog.validation.invalid_amount
    },
    date: {
      required: errorCatalog.validation.required,
      invalid: errorCatalog.validation.invalid_date
    },
    percentage: {
      required: errorCatalog.validation.required,
      invalid: errorCatalog.validation.invalid_percentage
    }
  }
  
  return fieldErrors[field]?.[type] || errorCatalog.validation.required
}

// Business rule validations
export const validateBusinessRules = {
  // Check if unit can be deleted (not linked to contracts)
  canDeleteUnit: async (unitId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    // This will be implemented with actual database check
    return { canDelete: true }
  },
  
  // Check if customer can be deleted (not linked to contracts)
  canDeleteCustomer: async (customerId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    // This will be implemented with actual database check
    return { canDelete: true }
  },
  
  // Check if safe can be deleted (no balance or transactions)
  canDeleteSafe: async (safeId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    // This will be implemented with actual database check
    return { canDelete: true }
  }
}