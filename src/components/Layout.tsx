'use client'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: string
}

const Layout = ({ children }: LayoutProps) => {
  // This is now just a wrapper component since the actual layout is handled by AppLayout
  return <>{children}</>
}

export default Layout