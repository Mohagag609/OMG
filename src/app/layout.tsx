import type { Metadata } from 'next'
import { Inter, Cairo } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { MainLayout } from '@/components/layout/main-layout'

const inter = Inter({ subsets: ['latin'] })
const cairo = Cairo({ subsets: ['arabic'] })

export const metadata: Metadata = {
  title: 'مدير الاستثمار العقاري',
  description: 'تطبيق شامل لإدارة الاستثمارات العقارية مع نظام مراقبة ونسخ احتياطية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className={`${cairo.className} antialiased h-full`}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  )
}