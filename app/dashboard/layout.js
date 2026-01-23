'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient as createClientSupabaseClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'


export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndRedirect()
  }, [pathname])

  async function checkAuthAndRedirect() {
    try {
      const supabase = createClientSupabaseClient()

      // 1. Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log('❌ [Dashboard] No user, redirecting to login')
        router.push('/')
        return
      }



      // 2. Get user profile via API (bypasses RLS)
      const profileResponse = await fetch('/api/auth/user')
      const profileData = await profileResponse.json()

      if (!profileResponse.ok || !profileData.user?.profile) {
        router.push('/')
        return
      }

      const profile = profileData.user.profile



      // 3. Check onboarding status (skip for platform admins)
      if (profile.role !== 'platform_admin' && (!profile.organization_id || profile.organization?.onboarding_status === 'pending')) {
        router.push('/onboarding')
        return
      }



      // 4. Role-based dashboard redirect
      const roleRoutes = {
        platform_admin: '/dashboard/platform',
        super_admin: '/dashboard/admin',
        manager: '/dashboard/manager',
        employee: '/dashboard/employee'
      }

      const targetRoute = roleRoutes[profile.role] || '/dashboard/employee'

      // Only redirect if not already on correct dashboard
      if (!pathname.startsWith(targetRoute)) {
        router.push(targetRoute)
        return
      }


      setLoading(false)

    } catch (error) {

      router.push('/')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  return <>{children}</>
}