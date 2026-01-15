'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createClientSupabaseClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Megaphone,
    LogOut,
    Building2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileNav from '@/components/dashboard/MobileNav'


export default function ManagerLayout({ children }) {
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
            const supabase = createClientSupabaseClient()
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }
            setUser(user)

            const profileResponse = await fetch('/api/auth/user')
            const profileData = await profileResponse.json()

            if (!profileResponse.ok || !profileData.user?.profile) {
                router.push('/')
                return
            }

            const userProfile = profileData.user.profile
            setProfile(userProfile)

            // Allow manager and super_admin
            if (['manager', 'super_admin'].includes(userProfile?.role)) {
                setAuthorized(true)
            } else {
                console.log('⛔ [Manager] Access denied')
                // redirect to employee dashboard if they are employee?
                // But logic says handle role redirects in root layout.
                router.push('/')
            }
            setLoading(false)

        } catch (error) {
            console.error('❌ [Manager] Error:', error)
            router.push('/')
        }
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', href: '/dashboard/manager' },
        { icon: Users, label: 'Team', href: '/dashboard/manager/users' },
        { icon: FolderKanban, label: 'Projects', href: '/dashboard/manager/projects' },
        { icon: Megaphone, label: 'Campaigns', href: '/dashboard/manager/campaigns' },
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
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900">Quinite Vantage</span>
                </div>
                <MobileNav navItems={navItems} role={profile?.role} userEmail={user?.email} />
            </div>

            <div className="flex">
                {/* Desktop Sidebar - Hidden on mobile */}
                <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 overflow-y-auto z-10">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Manager Panel</h2>
                                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                            </div>
                        </div>
                    </div>

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

                    <div className="p-4 border-t border-gray-200 bg-white mt-auto">
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

                <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
