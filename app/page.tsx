import { redirect } from 'next/navigation'

export default function HomePage() {
  // في بيئة الإنتاج (Netlify)، استخدم التطبيق مباشرة
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    redirect('/dashboard')
  }
  
  // في بيئة التطوير، اذهب إلى إعدادات قاعدة البيانات
  redirect('/settings/database')
}