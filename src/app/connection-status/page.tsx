'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Layout from '@/components/Layout'

interface HealthStatus {
  success: boolean
  status: string
  message: string
  timestamp: string
  error?: string
}

export default function ConnectionStatus() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
      setLastChecked(new Date())
    } catch (error) {
      setHealthStatus({
        success: false,
        status: 'error',
        message: 'فشل في فحص الاتصال',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400'
      case 'unhealthy': return 'text-red-600 dark:text-red-400'
      case 'error': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'unhealthy': return '❌'
      case 'error': return '⚠️'
      default: return '❓'
    }
  }

  return (
    <Layout title="حالة الاتصال" subtitle="فحص حالة الاتصال بقاعدة البيانات" icon="🔗">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>فحص الاتصال بقاعدة البيانات</span>
              <Button 
                onClick={checkConnection} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'جاري الفحص...' : 'فحص الاتصال'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthStatus && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(healthStatus.status)}</span>
                  <div>
                    <h3 className={`text-lg font-semibold ${getStatusColor(healthStatus.status)}`}>
                      {healthStatus.status === 'healthy' ? 'الاتصال يعمل بشكل طبيعي' :
                       healthStatus.status === 'unhealthy' ? 'فشل في الاتصال' :
                       'خطأ في الفحص'}
                    </h3>
                    <p className="text-muted-foreground">{healthStatus.message}</p>
                  </div>
                </div>
                
                {healthStatus.error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      تفاصيل الخطأ:
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                      {healthStatus.error}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  آخر فحص: {lastChecked ? lastChecked.toLocaleString('ar-SA') : 'لم يتم الفحص بعد'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">نوع قاعدة البيانات:</span> PostgreSQL
              </div>
              <div>
                <span className="font-medium">مزود الخدمة:</span> Neon Database
              </div>
              <div>
                <span className="font-medium">المنطقة:</span> us-east-1 (AWS)
              </div>
              <div>
                <span className="font-medium">حالة SSL:</span> مفعل
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حلول المشاكل الشائعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">1. تحقق من الاتصال بالإنترنت</h4>
                <p className="text-muted-foreground">تأكد من أن اتصالك بالإنترنت يعمل بشكل طبيعي</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">2. تحقق من إعدادات الجدار الناري</h4>
                <p className="text-muted-foreground">تأكد من أن الجدار الناري لا يحجب الاتصال بقاعدة البيانات</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3. إعادة تحميل الصفحة</h4>
                <p className="text-muted-foreground">جرب إعادة تحميل الصفحة أو إعادة تشغيل التطبيق</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">4. الاتصال بالدعم الفني</h4>
                <p className="text-muted-foreground">إذا استمرت المشكلة، يرجى الاتصال بالدعم الفني</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}