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
    Building2
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'


export default function AdminLayout({ children }) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        checkRole()
    }, [])

    async function checkRole() {
        try {
            console.log('🔍 [Admin] Checking role...')
            const supabase = createClientSupabaseClient()
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            console.log('👤 [Admin] User:', user?.email)
            console.log('🔑 [Admin] User ID:', user?.id)

            if (userError) {
                console.error('❌ [Admin] User error:', userError)
            }

            if (!user) {
                console.log('❌ [Admin] No user found, redirecting to login')
                router.push('/')
                return
            }

            console.log('📋 [Admin] Fetching profile...')

            // Fetch profile via API (bypasses RLS)
            const profileResponse = await fetch('/api/auth/user')
            const profileData = await profileResponse.json()

            if (!profileResponse.ok || !profileData.user?.profile) {
                console.error('❌ [Admin] Profile fetch failed:', profileData.error)
                router.push('/')
                return
            }

            const profile = profileData.user.profile

            console.log('📊 [Admin] Profile data:', profile)
            console.log('🎭 [Admin] Role:', profile?.role)

            // Only super_admin can access this dashboard
            if (profile?.role !== 'super_admin') {
                console.log('⛔ [Admin] Access denied - not super_admin')
                console.log('🔄 [Admin] Redirecting to login')
                router.push('/')
                return
            }

            console.log('✅ [Admin] Access granted')
            setAuthorized(true)
            setLoading(false)

        } catch (error) {
            console.error('❌ [Admin] Error:', error)
            router.push('/')
        }
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/dashboard/admin' },
        { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
        { icon: FolderKanban, label: 'Projects', href: '/dashboard/admin/projects' },
        { icon: UserPlus, label: 'Leads', href: '/dashboard/admin/leads' },
        { icon: Megaphone, label: 'Campaigns', href: '/dashboard/admin/campaigns' },
        { icon: BarChart3, label: 'Analytics', href: '/dashboard/admin/analytics' },
        { icon: FileText, label: 'Audit Logs', href: '/dashboard/admin/audit' },
        { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (!authorized) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
                    {/* Logo/Brand */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                                <p className="text-xs text-gray-500">Super Admin</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-1">
                        {navItems.map((item, index) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                        <button
                            onClick={async () => {
                                const supabase = createClientSupabaseClient()
                                await supabase.auth.signOut()
                                router.push('/')
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all w-full"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64">
                    {children}
                </main>
            </div>
        </div>
    )
}
