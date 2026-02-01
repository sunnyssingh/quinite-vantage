'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createClientSupabaseClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    UserPlus,
    Megaphone,
    BarChart3,
    FileText,
    Settings,
    LogOut,
    Building2,
    KanbanSquare,
    Building
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import MobileNav from '@/components/dashboard/MobileNav'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import AdminHeader from '@/components/admin/AdminHeader'
import CustomBreadcrumbs from '@/components/ui/CustomBreadcrumbs'


export default function AdminLayout({ children }) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)

    useEffect(() => {
        checkRole()
    }, [])

    async function checkRole() {
        try {
            console.log('🔍 [Admin] Checking role...')
            const supabase = createClientSupabaseClient()
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError) {
                console.error('❌ [Admin] User error:', userError)
            }

            if (!user) {
                console.log('❌ [Admin] No user found, redirecting to login')
                router.push('/')
                return
            }

            setUser(user)

            // Fetch profile via API (bypasses RLS)
            const profileResponse = await fetch('/api/auth/user')
            const profileData = await profileResponse.json()

            if (!profileResponse.ok || !profileData.user?.profile) {
                console.error('❌ [Admin] Profile fetch failed:', profileData.error)
                router.push('/')
                return
            }

            const userProfile = profileData.user.profile
            setProfile(userProfile)

            // Only super_admin can access this dashboard
            if (userProfile?.role !== 'super_admin') {
                console.log('⛔ [Admin] Access denied - not super_admin')
                router.push('/')
                return
            }

            setAuthorized(true)
            setLoading(false)

        } catch (error) {
            console.error('❌ [Admin] Error:', error)
            router.push('/')
        }
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/dashboard/admin' },
        { icon: KanbanSquare, label: 'CRM', href: '/dashboard/admin/crm' },
        { icon: Building, label: 'Inventory', href: '/dashboard/admin/inventory' },
        { icon: BarChart3, label: 'Analytics', href: '/dashboard/admin/analytics' },
        { icon: FileText, label: 'Audit Logs', href: '/dashboard/admin/audit' },
        { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
        { icon: Users, label: 'Profile', href: '/dashboard/admin/profile' },
        { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
    ]

    if (!loading && !authorized) {
        return null
    }

    const isFullScreenModule = pathname === '/dashboard/admin' ||
        pathname?.startsWith('/dashboard/admin/crm') ||
        pathname?.startsWith('/dashboard/admin/inventory')

    return (
        <div className="h-screen bg-secondary/20 flex flex-col overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-border/40 shrink-0">
                <AdminHeader user={user} profile={profile} />
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full bg-background/50 relative flex flex-col min-h-0 overflow-hidden">
                {isFullScreenModule ? (
                    /* CRM/Inventory: Delegate scroll to children (CrmLayout) */
                    <div className="flex-1 h-full w-full overflow-hidden">
                        {children}
                    </div>
                ) : (
                    /* Other pages: Global scroll */
                    <div className="flex-1 h-full w-full overflow-y-auto scroll-smooth p-4">
                        {children}
                    </div>
                )}
            </main>
        </div>
    )
}
