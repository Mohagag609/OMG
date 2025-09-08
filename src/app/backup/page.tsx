'use client'

import React, { useState, useEffect } from 'react'
import ModernCard from '../../components/ModernCard'
import ModernButton from '../../components/ModernButton'
import { NotificationSystem } from '../../components/NotificationSystem'
import SidebarToggle from '../../components/SidebarToggle'
import Sidebar from '../../components/Sidebar'
import NavigationButtons from '../../components/NavigationButtons'

interface BackupFile {
  id: string
  name: string
  size: number
  createdAt: string
  type: 'system' | 'data' | 'schema'
}

export default function BackupNewPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resetType, setResetType] = useState<'data' | 'schema' | 'complete'>('data')

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  // Fetch backup files
  const fetchBackupFiles = async () => {
    try {
      const response = await fetch('/api/backup/list')
      if (response.ok) {
        const data = await response.json()
        setBackupFiles(data.backups || [])
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    }
  }

  useEffect(() => {
    fetchBackupFiles()
  }, [])

  // Create system backup
  const createSystemBackup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/system/backup')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system-backup-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        addNotification('تم إنشاء النسخة الاحتياطية الشاملة بنجاح', 'success')
        fetchBackupFiles()
      } else {
        const error = await response.json()
        addNotification(error.error || 'فشل في إنشاء النسخة الاحتياطية', 'error')
      }
    } catch (error) {
      console.error('Backup error:', error)
      addNotification('حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Create data backup
  const createDataBackup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/backup/real-data')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-backup-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        addNotification('تم إنشاء نسخة احتياطية للبيانات بنجاح', 'success')
        fetchBackupFiles()
      } else {
        const error = await response.json()
        addNotification(error.error || 'فشل في إنشاء نسخة احتياطية للبيانات', 'error')
      }
    } catch (error) {
      console.error('Data backup error:', error)
      addNotification('حدث خطأ أثناء إنشاء نسخة احتياطية للبيانات', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Import data
  const importData = async () => {
    if (!selectedFile) {
      addNotification('يرجى اختيار ملف للاستيراد', 'error')
      return
    }

    setIsLoading(true)
    addNotification('بدء عملية الاستيراد...', 'info')
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      console.log('Starting import with file:', selectedFile.name, 'Size:', selectedFile.size)

      const response = await fetch('/api/system/import', {
        method: 'POST',
        body: formData
      })

      console.log('Import response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Import result:', result)
        
        // Create a more readable success message
        const importedData = result.importedData || {}
        const verificationResults = result.verificationResults || {}
        
        let successMessage = 'تم استيراد البيانات بنجاح!\n'
        successMessage += `المستخدمين: ${importedData.users || 0}\n`
        successMessage += `الوحدات: ${importedData.units || 0}\n`
        successMessage += `العملاء: ${importedData.customers || 0}\n`
        successMessage += `السماسرة: ${importedData.brokers || 0}\n`
        successMessage += `العقود: ${importedData.contracts || 0}\n`
        successMessage += `الأقساط: ${importedData.installments || 0}\n`
        successMessage += `الخزائن: ${importedData.safes || 0}\n`
        successMessage += `الشركاء: ${importedData.partners || 0}\n`
        
        if (verificationResults.users > 0) {
          successMessage += `\nتم التحقق: ${verificationResults.users} مستخدم في قاعدة البيانات`
        }
        
        addNotification(successMessage, 'success')
        fetchBackupFiles()
      } else {
        const error = await response.json()
        console.error('Import error response:', error)
        
        let errorMessage = error.error || 'فشل في استيراد البيانات'
        if (error.details) {
          errorMessage += `\nالتفاصيل: ${error.details}`
        }
        if (error.currentDataCount) {
          errorMessage += `\nالبيانات الحالية: ${JSON.stringify(error.currentDataCount)}`
        }
        
        addNotification(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Import error:', error)
      addNotification(`حدث خطأ أثناء استيراد البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset database
  const resetDatabase = async () => {
    if (!confirm(`هل أنت متأكد من إعادة ضبط قاعدة البيانات (${resetType})؟ هذا الإجراء لا يمكن التراجع عنه!`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/system/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resetType })
      })

      if (response.ok) {
        const result = await response.json()
        addNotification(`تم إعادة ضبط قاعدة البيانات بنجاح (${result.resetType})`, 'success')
        fetchBackupFiles()
      } else {
        const error = await response.json()
        addNotification(error.error || 'فشل في إعادة ضبط قاعدة البيانات', 'error')
      }
    } catch (error) {
      console.error('Reset error:', error)
      addNotification('حدث خطأ أثناء إعادة ضبط قاعدة البيانات', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Download backup
  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupId}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        addNotification('تم تحميل النسخة الاحتياطية بنجاح', 'success')
      } else {
        addNotification('فشل في تحميل النسخة الاحتياطية', 'error')
      }
    } catch (error) {
      console.error('Download error:', error)
      addNotification('حدث خطأ أثناء تحميل النسخة الاحتياطية', 'error')
    }
  }

  // Delete backup
  const deleteBackup = async (backupId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      return
    }

    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification('تم حذف النسخة الاحتياطية بنجاح', 'success')
        fetchBackupFiles()
      } else {
        addNotification('فشل في حذف النسخة الاحتياطية', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      addNotification('حدث خطأ أثناء حذف النسخة الاحتياطية', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarToggle onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-0'}`}>
        <div className="p-6">
          <NavigationButtons />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة النسخ الاحتياطية</h1>
            <p className="text-gray-600">إنشاء واستيراد وإعادة تهيئة النسخ الاحتياطية للنظام</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Backup Section */}
            <ModernCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">إنشاء نسخة احتياطية</h2>
              
              <div className="space-y-4">
                <ModernButton
                  onClick={createSystemBackup}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'نسخة احتياطية شاملة للنظام'}
                </ModernButton>
                
                <ModernButton
                  onClick={createDataBackup}
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'نسخة احتياطية للبيانات فقط'}
                </ModernButton>
              </div>
            </ModernCard>

            {/* Import Section */}
            <ModernCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">استيراد البيانات</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر ملف النسخة الاحتياطية
                  </label>
                  <input
                    type="file"
                    accept=".json,.zip"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <ModernButton
                  onClick={importData}
                  disabled={isLoading || !selectedFile}
                  className="w-full"
                >
                  {isLoading ? 'جاري الاستيراد...' : 'استيراد البيانات'}
                </ModernButton>
              </div>
            </ModernCard>

            {/* Reset Section */}
            <ModernCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">إعادة تهيئة قاعدة البيانات</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع إعادة الضبط
                  </label>
                  <select
                    value={resetType}
                    onChange={(e) => setResetType(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="data">مسح البيانات فقط</option>
                    <option value="schema">إعادة إنشاء الجداول</option>
                    <option value="complete">إعادة ضبط كاملة</option>
                  </select>
                </div>
                
                <ModernButton
                  onClick={resetDatabase}
                  disabled={isLoading}
                  variant="danger"
                  className="w-full"
                >
                  {isLoading ? 'جاري إعادة الضبط...' : 'إعادة ضبط قاعدة البيانات'}
                </ModernButton>
              </div>
            </ModernCard>

            {/* System Info */}
            <ModernCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات النظام</h2>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>نوع قاعدة البيانات:</strong> PostgreSQL (Neon)</p>
                <p><strong>حالة الاتصال:</strong> متصل</p>
                <p><strong>عدد النسخ الاحتياطية:</strong> {backupFiles.length}</p>
                <p><strong>آخر تحديث:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
              </div>
            </ModernCard>
          </div>

          {/* Backup Files List */}
          {backupFiles.length > 0 && (
            <ModernCard className="p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">النسخ الاحتياطية المحفوظة</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الاسم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        النوع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحجم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backupFiles.map((backup) => (
                      <tr key={backup.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {backup.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            backup.type === 'system' ? 'bg-blue-100 text-blue-800' :
                            backup.type === 'data' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {backup.type === 'system' ? 'نظام' :
                             backup.type === 'data' ? 'بيانات' : 'مخطط'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(backup.size / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(backup.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => downloadBackup(backup.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            تحميل
                          </button>
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ModernCard>
          )}
        </div>
      </div>

      <NotificationSystem 
        notifications={notifications} 
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
      />
    </div>
  )
}