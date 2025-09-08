// Database connection and utilities
import { prisma } from './database'

export { prisma }

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