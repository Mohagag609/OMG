import { redirect } from 'next/navigation'

export default function HomePage() {
  // توجيه المستخدم إلى صفحة الإعدادات
  redirect('/settings/database')
}