// Database connection and utilities

import { createPrismaClient, testDatabaseConnection } from './database'

// Test database connection on startup
testDatabaseConnection()

export const prisma = createPrismaClient()

// Helper function to handle database errors
export function handleDatabaseError(error: any): string {
  console.error('Database error:', error)
  
  if (error.code === 'P2002') {
    return 'هذا الكود مستخدم بالفعل'
  }
  
  if (error.code === 'P2003') {
    return 'لا يمكن حذف هذا العنصر لأنه مرتبط بعناصر أخرى'
  }
  
  if (error.code === 'P2025') {
    return 'العنصر غير موجود'
  }
  
  return 'خطأ في قاعدة البيانات'
}

// Helper function to check if record exists
export async function recordExists(model: any, where: any): Promise<boolean> {
  try {
    const count = await model.count({ where })
    return count > 0
  } catch (error) {
    console.error('Error checking record existence:', error)
    return false
  }
}

// Helper function to get record by ID
export async function getRecordById(model: any, id: string): Promise<any> {
  try {
    return await model.findUnique({ where: { id } })
  } catch (error) {
    console.error('Error getting record by ID:', error)
    return null
  }
}

// Helper function to create record
export async function createRecord(model: any, data: any): Promise<any> {
  try {
    return await model.create({ data })
  } catch (error) {
    console.error('Error creating record:', error)
    throw error
  }
}

// Helper function to update record
export async function updateRecord(model: any, id: string, data: any): Promise<any> {
  try {
    return await model.update({ where: { id }, data })
  } catch (error) {
    console.error('Error updating record:', error)
    throw error
  }
}

// Helper function to delete record (soft delete)
export async function deleteRecord(model: any, id: string): Promise<any> {
  try {
    return await model.update({ 
      where: { id }, 
      data: { deletedAt: new Date() } 
    })
  } catch (error) {
    console.error('Error deleting record:', error)
    throw error
  }
}

// Helper function to get all records with pagination
export async function getRecordsWithPagination(
  model: any, 
  page: number = 1, 
  limit: number = 10,
  where: any = {},
  include: any = {}
): Promise<{ data: any[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    const whereClause = { ...where, deletedAt: null }
    
    const [data, total] = await Promise.all([
      model.findMany({
        where: whereClause,
        include,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      model.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error getting records with pagination:', error)
    throw error
  }
}

// Helper function to search records
export async function searchRecords(
  model: any,
  searchTerm: string,
  searchFields: string[],
  page: number = 1,
  limit: number = 10
): Promise<{ data: any[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    
    // Create search conditions
    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    }))
    
    const whereClause = {
      deletedAt: null,
      OR: searchConditions
    }
    
    const [data, total] = await Promise.all([
      model.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      model.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error searching records:', error)
    throw error
  }
}