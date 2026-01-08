'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Building2, 
  FileText, 
  Users2,
  LogOut,
  Menu,
  X,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PlatformLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [impersonating, setImpersonating] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin-login')
        return
      }

      // Get user data
      const response = await fetch('/api/auth/user')
      const data = await response.json()
      
      if (!data.user) {
        router.push('/admin-login')
        return
      }

      // CRITICAL: Verify Platform Admin access
      if (!data.user.profile?.is_platform_admin) {
        router.push('/dashboard') // Redirect org users to their dashboard
        return
      }

      setUser(data.user)
      setProfile(data.user.profile)
      setLoading(false)
      
      // Check for active impersonation
      checkImpersonation()
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/admin-login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkImpersonation = async () => {
    try {
      const response = await fetch('/api/platform/impersonations')
      const data = await response.json()
      const active = data.sessions?.find(s => s.is_active)
      setImpersonating(active || null)
    } catch (error) {
      console.error('Error checking impersonation:', error)
    }
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/admin-login')
  }

  const navItems = [
    { icon: Shield, label: 'Dashboard', href: '/platform/dashboard' },
    { icon: Building2, label: 'Organizations', href: '/platform/organizations' },
    { icon: FileText, label: 'Audit Logs', href: '/platform/audit' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading Platform...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-purple-900 to-slate-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Platform Admin</h1>
                  <p className="text-xs text-purple-300">Control Plane</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden text-white hover:bg-purple-800"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${
                      isActive 
                        ? 'bg-purple-700 text-white hover:bg-purple-600' 
                        : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                    }`}
                    onClick={() => {
                      router.push(item.href)
                      setSidebarOpen(false)
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User info & logout */}
          <div className="p-4 border-t border-purple-800">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-purple-300" />
                <p className="text-sm font-medium text-white">Platform Admin</p>
              </div>
              <p className="text-xs text-purple-300">{user?.email}</p>
            </div>
            <Separator className="mb-3 bg-purple-800" />
            <Button 
              variant="outline" 
              className="w-full justify-start border-purple-700 text-white hover:bg-purple-800"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Impersonation Banner */}
        {impersonating && (
          <Alert className="rounded-none border-l-0 border-r-0 border-t-0 bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>Impersonating:</strong> Organization User
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-4"
                onClick={async () => {
                  await fetch('/api/platform/end-impersonation', { method: 'POST' })
                  setImpersonating(null)
                  checkImpersonation()
                }}
              >
                End Impersonation
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}