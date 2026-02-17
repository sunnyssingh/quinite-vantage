'use client'

import { Building2, CreditCard, Plug2, Users, Lock, Layout } from 'lucide-react'
import Link from 'next/link'
import { usePermissions } from '@/contexts/PermissionContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
    const { loading, hasPermission } = usePermissions()

    const canViewSettings = hasPermission('view_settings')
    const canViewUsers = hasPermission('view_users')

    if (loading) {
        return (
            <div className="h-full bg-gray-50/50 overflow-y-auto">
                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-5 w-96" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full bg-gray-50/50 overflow-y-auto">
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
                    <p className="text-muted-foreground text-slate-500">
                        Manage your organization preferences, subscription, and team members.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canViewSettings ? (
                        <>
                            <Link href="/dashboard/admin/settings/organization" className="group">
                                <div className="h-full p-6 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 group-hover:ring-1 group-hover:ring-blue-100">
                                    <div className="mb-5 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">Organization</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Update your company logo, branding details, and general preferences to match your identity.
                                    </p>
                                </div>
                            </Link>

                            <Link href="/dashboard/admin/settings/subscription" className="group">
                                <div className="h-full p-6 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-200 group-hover:ring-1 group-hover:ring-indigo-100">
                                    <div className="mb-5 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">Subscription</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        View your current plan, manage billing methods, and download invoices.
                                    </p>
                                </div>
                            </Link>

                            <Link href="/dashboard/admin/settings/website" className="group">
                                <div className="h-full p-6 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-pink-200 group-hover:ring-1 group-hover:ring-pink-100">
                                    <div className="mb-5 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors duration-200">
                                        <Layout className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-pink-700 transition-colors">Website Builder</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Customize your public profile, domain, and showcase your projects to the world.
                                    </p>
                                </div>
                            </Link>

                            <Link href="/dashboard/admin/settings/integrations" className="group">
                                <div className="h-full p-6 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-200 group-hover:ring-1 group-hover:ring-purple-100">
                                    <div className="mb-5 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
                                        <Plug2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">Integrations</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Connect your favorite tools and third-party services to streamline your workflow.
                                    </p>
                                </div>
                            </Link>
                        </>
                    ) : (
                        <div className="col-span-full bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-200">
                            <Lock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                            <h3 className="text-base font-medium text-slate-900">Restricted Access</h3>
                            <p className="text-sm text-slate-500 mt-1">You don't have permission to view organization settings.</p>
                        </div>
                    )}

                    {canViewUsers && (
                        <Link href="/dashboard/admin/users" className="group">
                            <div className="h-full p-6 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-200 group-hover:ring-1 group-hover:ring-emerald-100">
                                <div className="mb-5 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">User Management</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Add new team members, assign roles, and manage access permissions securely.
                                </p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
