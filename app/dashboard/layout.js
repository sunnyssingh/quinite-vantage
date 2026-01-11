'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  FolderKanban,
  Megaphone,
  Users2,
  BarChart3,
  UserCircle,
  FileText,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/toaster'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      // Get user data with permissions
      const response = await fetch('/api/auth/user')
      const data = await response.json()

      if (!data.user) {
        router.push('/')
        return
      }

      // CRITICAL: Platform Admins should NOT access org dashboard
      if (data.user.profile?.is_platform_admin) {
        router.push('/platform/dashboard')
        return
      }

      // Check if user has organization - if not, redirect to onboarding
      if (!data.user.profile?.organization_id) {
        console.log('⚠️ User has no organization_id, redirecting to onboarding')
        router.push('/onboarding')
        return
      }

      // Check onboarding status
      if (data.user.profile?.organization?.onboarding_status === 'PENDING') {
        router.push('/onboarding')
        return
      }

      setUser(data.user)
      setProfile(data.user.profile)
      setPermissions(data.user.permissions || [])
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/')
  }

  const hasPermission = (permission) => {
    return permissions.includes(permission) || profile?.is_platform_admin
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', permission: null },
    { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects', permission: 'project.view' },
    { icon: Megaphone, label: 'Campaigns', href: '/dashboard/campaigns', permission: 'campaign.view' },
    { icon: Users2, label: 'Leads', href: '/dashboard/leads', permission: 'leads.view' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', permission: 'analytics.view_basic' },
    { icon: UserCircle, label: 'Users', href: '/dashboard/users', permission: 'users.create' },
    { icon: FileText, label: 'Audit Logs', href: '/dashboard/audit', permission: 'audit.view' },
  ]

  const filteredNavItems = navItems.filter(item =>
    !item.permission || hasPermission(item.permission) || profile?.is_platform_admin
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="space-y-4 w-64">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">SaaS Platform</h1>
                  {profile?.is_platform_admin && (
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Shield className="w-3 h-3" />
                      <span>Platform Admin</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
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
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500">{profile?.role?.name || 'User'}</p>
              {profile?.organization?.name && (
                <p className="text-xs text-gray-400 mt-1">{profile.organization.name}</p>
              )}
            </div>
            <Separator className="mb-3" />
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
      <Toaster />
    </div>
  )
}