'use client';

import { createContext, useContext, ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';

// إنشاء Context بسيط
const AppContext = createContext({});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AppContext.Provider value={{}}>
        {children}
      </AppContext.Provider>
    </ThemeProvider>
  );
}

// Hook لاستخدام Context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a Provider');
  }
  return context;
}