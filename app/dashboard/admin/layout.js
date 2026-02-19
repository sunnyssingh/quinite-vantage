'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }) {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        if (!authLoading) checkAccess()
    }, [authLoading, user, profile])

    function checkAccess() {
        // 1. No user -> Redirect
        if (!user) {
            router.push('/')
            return
        }

        // 2. No profile -> Redirect
        if (!profile) {
            // If auth is done loading but no profile, something is wrong
            console.error('❌ [Admin] User logged in but no profile found')
            router.push('/')
            return
        }

        // 3. Check Role
        const allowedRoles = ['employee', 'manager', 'super_admin']
        if (!allowedRoles.includes(profile.role)) {
            console.log(`⛔ [Admin] Access denied - role: ${profile.role}`)
            toast.error('Access denied')
            router.push('/')
            return
        }

        setAuthorized(true)
    }

    if (authLoading || !authorized) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <LoadingSpinner className="w-8 h-8 text-primary" />
            </div>
        )
    }

    const isFullScreenModule = pathname?.startsWith('/dashboard/admin/crm') ||
        pathname?.startsWith('/dashboard/admin/inventory') ||
        pathname?.startsWith('/dashboard/admin/settings')

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
