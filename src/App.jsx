import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import AppRoutes from '@/routes/AppRoutes'
import CookieBanner from '@/components/CookieBanner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppRoutes />
              <Toaster richColors position="top-right" />
              <CookieBanner />
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  )
}
