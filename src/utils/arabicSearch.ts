// Arabic search utilities for advanced filtering

// Normalize Arabic text for better search
export function normalizeArabicText(text: string): string {
  if (!text) return ''
  
  return text
    // Remove diacritics (تشكيل)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    // Normalize Alef variations
    .replace(/[\u0622\u0623\u0625\u0627]/g, '\u0627')
    // Normalize Yeh variations
    .replace(/[\u0649\u064A]/g, '\u064A')
    // Normalize Teh Marbuta
    .replace(/\u0629/g, '\u0647')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Create search conditions for Arabic text
export function createArabicSearchConditions(searchTerm: string, fields: string[]): any {
  if (!searchTerm || !fields.length) return {}
  
  const normalizedTerm = normalizeArabicText(searchTerm)
  
  // Create OR conditions for each field
  const searchConditions = fields.map(field => ({
    [field]: {
      contains: normalizedTerm,
      mode: 'insensitive' as const
    }
  }))
  
  return {
    OR: searchConditions
  }
}

// Advanced Arabic search with multiple variations
export function createAdvancedArabicSearch(searchTerm: string, fields: string[]): any {
  if (!searchTerm || !fields.length) return {}
  
  const normalizedTerm = normalizeArabicText(searchTerm)
  
  // Create multiple search variations
  const variations = [
    normalizedTerm,
    // Add original term
    searchTerm.toLowerCase(),
    // Add without spaces
    normalizedTerm.replace(/\s/g, ''),
    // Add with different spacing
    normalizedTerm.replace(/\s/g, '  ')
  ]
  
  // Remove duplicates
  const uniqueVariations = [...new Set(variations)]
  
  const searchConditions = fields.flatMap(field =>
    uniqueVariations.map(variation => ({
      [field]: {
        contains: variation,
        mode: 'insensitive' as const
      }
    }))
  )
  
  return {
    OR: searchConditions
  }
}

// Common Arabic name variations
export function getArabicNameVariations(name: string): string[] {
  if (!name) return []
  
  const normalized = normalizeArabicText(name)
  const variations = [normalized, name.toLowerCase()]
  
  // Add common variations for Arabic names
  const commonVariations = {
    'أحمد': ['احمد', 'إحمد', 'احمد', 'أحمد', 'إحمد'],
    'محمد': ['محمد', 'محمد', 'محمد'],
    'علي': ['علي', 'علي', 'علي'],
    'حسن': ['حسن', 'حسن', 'حسن'],
    'حسين': ['حسين', 'حسين', 'حسين'],
    'عبدالله': ['عبدالله', 'عبد الله', 'عبدالله'],
    'عبدالرحمن': ['عبدالرحمن', 'عبد الرحمن', 'عبدالرحمن']
  }
  
  // Check if the name matches any common variations
  for (const [key, variants] of Object.entries(commonVariations)) {
    if (normalized.includes(key) || variants.some(v => normalized.includes(v))) {
      variations.push(...variants)
    }
  }
  
  return [...new Set(variations)]
}