'use client'

import { useState, useCallback, useMemo } from 'react'
import { debounce } from '@/lib/performance'

// FIXED: Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface FormErrors {
  [key: string]: string | null
}

export interface FormTouched {
  [key: string]: boolean
}

// FIXED: Form validation hook
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules,
  options: {
    validateOnChange?: boolean
    validateOnBlur?: boolean
    debounceMs?: number
  } = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // FIXED: Validation function
  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = validationRules[name]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.message || `${name} مطلوب`
    }

    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === '') {
      return null
    }

    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      return rule.message || `${name} يجب أن يكون ${rule.minLength} أحرف على الأقل`
    }

    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return rule.message || `${name} يجب أن يكون ${rule.maxLength} أحرف على الأكثر`
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return rule.message || `${name} غير صحيح`
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [validationRules])

  // FIXED: Validate all fields
  const validateAll = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}
    
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
      }
    })

    setErrors(newErrors)
    return newErrors
  }, [values, validateField, validationRules])

  // FIXED: Debounced validation
  const debouncedValidate = useMemo(
    () => debounce((name: string, value: any) => {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }, debounceMs),
    [validateField, debounceMs]
  )

  // FIXED: Handle field change
  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    if (validateOnChange) {
      debouncedValidate(name, value)
    }
  }, [validateOnChange, debouncedValidate])

  // FIXED: Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    if (validateOnBlur) {
      const error = validateField(name, values[name])
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [validateOnBlur, validateField, values])

  // FIXED: Handle form submit
  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true)
    
    try {
      // Mark all fields as touched
      const allTouched: FormTouched = {}
      Object.keys(validationRules).forEach(name => {
        allTouched[name] = true
      })
      setTouched(allTouched)

      // Validate all fields
      const newErrors = validateAll()
      
      if (Object.keys(newErrors).length > 0) {
        throw new Error('الرجاء تصحيح الأخطاء في النموذج')
      }

      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [validateAll, values, validationRules])

  // FIXED: Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // FIXED: Set field value programmatically
  const setFieldValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    if (validateOnChange) {
      debouncedValidate(name, value)
    }
  }, [validateOnChange, debouncedValidate])

  // FIXED: Set field error programmatically
  const setFieldError = useCallback((name: string, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [])

  // FIXED: Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           Object.values(errors).every(error => !error)
  }, [errors])

  // FIXED: Check if form has been touched
  const isTouched = useMemo(() => {
    return Object.values(touched).some(touched => touched)
  }, [touched])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateField,
    validateAll
  }
}

// FIXED: Common validation rules
export const commonValidationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'هذا الحقل مطلوب'
  }),
  
  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'البريد الإلكتروني غير صحيح'
  }),
  
  phone: (message?: string): ValidationRule => ({
    pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
    message: message || 'رقم الهاتف غير صحيح'
  }),
  
  nationalId: (message?: string): ValidationRule => ({
    pattern: /^[0-9]{14}$/,
    message: message || 'الرقم القومي يجب أن يكون 14 رقم'
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `يجب أن يكون ${min} أحرف على الأقل`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `يجب أن يكون ${max} أحرف على الأكثر`
  })
}