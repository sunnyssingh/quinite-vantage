'use client'

import { Building2, CreditCard, Plug2, Users, Lock } from 'lucide-react'
import Link from 'next/link'
import { usePermission } from '@/contexts/PermissionContext'

export default function SettingsPage() {
    const canViewSettings = usePermission('view_settings')
    const canViewUsers = usePermission('view_users')

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {canViewSettings ? (
                    <>
                        <Link
                            href="/dashboard/admin/settings/organization"
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="mb-4">
                                <Building2 className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Organization</h3>
                            <p className="text-gray-600">
                                Manage your organization details and preferences
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/admin/settings/subscription"
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="mb-4">
                                <CreditCard className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Subscription</h3>
                            <p className="text-gray-600">
                                Manage your subscription, view usage, and upgrade plans
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/admin/settings/integrations"
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="mb-4">
                                <Plug2 className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h3>
                            <p className="text-gray-600">
                                Connect with third-party services and tools
                            </p>
                        </Link>
                    </>
                ) : (
                    <div className="md:col-span-3 bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Restricted Access</h3>
                        <p className="text-gray-500 mt-2">You don't have permission to view organization settings.</p>
                    </div>
                )}

                {canViewUsers && (
                    <Link
                        href="/dashboard/admin/users"
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="mb-4">
                            <Users className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
                        <p className="text-gray-600">
                            Manage users, roles, and access permissions
                        </p>
                    </Link>
                )}
            </div>
        </div>
    )
}
