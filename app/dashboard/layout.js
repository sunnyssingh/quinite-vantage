'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient as createClientSupabaseClient } from '@/lib/supabase/client'


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

      console.log('✅ [Dashboard] User authenticated:', user.email)

      // 2. Get user profile via API (bypasses RLS)
      const profileResponse = await fetch('/api/auth/user')
      const profileData = await profileResponse.json()

      if (!profileResponse.ok || !profileData.user?.profile) {
        console.error('❌ [Dashboard] Profile fetch failed:', profileData.error)
        router.push('/')
        return
      }

      const profile = profileData.user.profile

      console.log('📊 [Dashboard] Profile loaded:', {
        role: profile.role,
        orgId: profile.organization_id,
        onboardingStatus: profile.organization?.onboarding_status
      })
      console.log('🔍 [Dashboard] Full profile data:', profile)
      console.log('🔍 [Dashboard] Organization data:', profile.organization)

      // 3. Check onboarding status
      if (!profile.organization_id || profile.organization?.onboarding_status === 'pending') {
        console.log('⚠️ [Dashboard] Onboarding incomplete, redirecting')
        console.log('📊 [Dashboard] Org ID:', profile.organization_id)
        console.log('📊 [Dashboard] Status:', profile.organization?.onboarding_status)
        router.push('/onboarding')
        return
      }

      console.log('✅ [Dashboard] Onboarding complete, proceeding...')

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
        console.log(`🔄 [Dashboard] Redirecting ${profile.role} to ${targetRoute}`)
        router.push(targetRoute)
        return
      }

      console.log('✅ [Dashboard] User on correct dashboard')
      setLoading(false)

    } catch (error) {
      console.error('❌ [Dashboard] Error:', error)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}