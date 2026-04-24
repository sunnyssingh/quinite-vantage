'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, RotateCcw, Loader2, Shield, User2, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { usePermissions } from '@/contexts/PermissionContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function PermissionManager({ userId, userRole, user, onClose }) {
    const [loading, setLoading] = useState(true)
    const [allFeatures, setAllFeatures] = useState([])
    const [rolePermissions, setRolePermissions] = useState([])
    const [userPermissions, setUserPermissions] = useState([])
    const [selectedPermissions, setSelectedPermissions] = useState([])
    const [savingKey, setSavingKey] = useState(null)
    const [resetting, setResetting] = useState(false)
    const { refreshPermissions } = usePermissions()

    useEffect(() => {
        fetchPermissions()
    }, [userId])

    async function fetchPermissions() {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/users/${userId}/permissions`)
            if (!response.ok) throw new Error('Failed to fetch permissions')
            const data = await response.json()
            setAllFeatures(data.allFeatures || [])
            setRolePermissions(data.rolePermissions || [])
            setUserPermissions(data.userPermissions || [])
            setSelectedPermissions(data.effectivePermissions || [])
        } catch (error) {
            console.error('Error fetching permissions:', error)
            toast.error('Failed to load permissions')
        } finally {
            setLoading(false)
        }
    }

    async function handleToggle(featureKey) {
        const currentEnabled = selectedPermissions.includes(featureKey)
        const newPermissions = currentEnabled
            ? selectedPermissions.filter(k => k !== featureKey)
            : [...selectedPermissions, featureKey]

        setSavingKey(featureKey)
        setSelectedPermissions(newPermissions)

        try {
            const res = await fetch(`/api/admin/users/${userId}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: newPermissions })
            })
            if (!res.ok) throw new Error()
            const data = await res.json()
            setUserPermissions(data.userPermissions || userPermissions)
            refreshPermissions()
        } catch {
            setSelectedPermissions(selectedPermissions)
            toast.error('Failed to save permission')
        } finally {
            setSavingKey(null)
        }
    }

    async function handleReset() {
        if (!confirm('Reset this user to role-based permissions? All custom overrides will be removed.')) return

        setResetting(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}/permissions/reset`, { method: 'POST' })
            if (!res.ok) throw new Error()
            toast.success('Permissions reset to role defaults')
            refreshPermissions()
            await fetchPermissions()
        } catch {
            toast.error('Failed to reset permissions')
        } finally {
            setResetting(false)
        }
    }

    const categorizedFeatures = allFeatures.reduce((acc, feature) => {
        const cat = feature.category || 'other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(feature)
        return acc
    }, {})

    const categoryLabels = {
        leads: 'Lead Management', campaigns: 'Campaign Management',
        projects: 'Project Management', calls: 'Call Management',
        analytics: 'Analytics & Insights', users: 'User Management',
        settings: 'Settings & Configuration', audit: 'Audit & Compliance',
        inventory: 'Inventory Management', crm: 'CRM', other: 'Other'
    }

    if (loading) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="border-b bg-gray-50 p-4 space-y-4 shrink-0">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-11 h-11 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-60" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-4 space-y-6 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-lg border overflow-hidden">
                            <div className="px-4 py-2.5 bg-gray-50 border-b">
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="divide-y">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="flex items-center justify-between px-4 py-4">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-72" />
                                        </div>
                                        <Skeleton className="h-6 w-10 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-between">
                    <Skeleton className="h-10 w-44" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between p-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Permissions</h2>
                        <p className="text-sm text-slate-500 mt-0">Configure feature access and overrides for this team member.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Profile Card */}
                <div className="px-5 pb-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                        {/* Compact Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md shadow-blue-100 text-white font-bold text-base">
                            {user?.full_name
                                ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                : user?.email?.[0]?.toUpperCase() ?? '?'}
                        </div>

                        {/* User Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-slate-900 text-base truncate leading-none">
                                    {user?.full_name || 'Team Member'}
                                </h3>
                                <Badge className={`text-[9px] uppercase tracking-wider font-bold py-0 px-1.5 rounded-full ${
                                    userRole === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    userRole === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                } shadow-sm border`}>
                                    {userRole?.replace('_', ' ')}
                                </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <User2 className="w-3 h-3" />
                                <span className="truncate">{user?.email}</span>
                            </div>

                            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-200/60">
                                {user?.phone && (
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                        <Building2 className="w-3 h-3" />
                                        {user.phone}
                                    </div>
                                )}
                                {!loading && (
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                                        <Shield className="w-3 h-3" />
                                        {userPermissions.length} Active Overrides
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Super Admin Notice */}
            {userRole === 'super_admin' && (
                <div className="mx-4 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-900">Full Access Enabled</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Super Admins have unrestricted access to all features. Individual permissions cannot be restricted for this role.
                        </p>
                    </div>
                </div>
            )}

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {Object.entries(categorizedFeatures).map(([category, features]) => (
                    <div key={category} className="rounded-lg border overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b">
                            <h4 className="font-semibold text-sm text-gray-700">
                                {categoryLabels[category] || category}
                            </h4>
                        </div>
                        <div className="divide-y">
                            {features.map(feature => {
                                const isSuperAdmin = userRole === 'super_admin'
                                const isEnabled = isSuperAdmin || selectedPermissions.includes(feature.feature_key)
                                const isOverride = !isSuperAdmin && userPermissions.includes(feature.feature_key)
                                const isRoleDefault = !isSuperAdmin && rolePermissions.includes(feature.feature_key)
                                const isSaving = savingKey === feature.feature_key

                                return (
                                    <div
                                        key={feature.feature_key}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm text-gray-900">{feature.feature_name}</span>
                                                {isSuperAdmin ? (
                                                     <Badge className="text-xs bg-green-100 text-green-800 border-green-200 font-normal">
                                                        Always enabled
                                                    </Badge>
                                                ) : isOverride ? (
                                                    <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 font-normal">
                                                        Custom override
                                                    </Badge>
                                                ) : isRoleDefault ? (
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        Role default
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isSaving && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                            <Switch
                                                checked={isEnabled}
                                                disabled={isSaving || resetting || isSuperAdmin}
                                                onCheckedChange={() => handleToggle(feature.feature_key)}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <button
                    onClick={handleReset}
                    disabled={resetting || userPermissions.length === 0 || userRole === 'super_admin'}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Reset to Role Defaults
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}
