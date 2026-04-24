'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, RotateCcw, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { usePermissions } from '@/contexts/PermissionContext'

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
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-gray-50 shrink-0">
                <div className="flex items-start justify-between p-4 pb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Manage Permissions</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* User card */}
                <div className="px-4 pb-4 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-semibold text-base">
                        {user?.full_name
                            ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            : user?.email?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">
                                {user?.full_name || 'Unknown User'}
                            </span>
                            <Badge className={`text-xs shrink-0 ${
                                userRole === 'manager' ? 'bg-purple-100 text-purple-800' :
                                userRole === 'super_admin' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                                {userRole?.replace('_', ' ')}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{user?.email}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            {user?.phone && <span>{user.phone}</span>}
                            {user?.created_at && (
                                <span>Joined {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                            {!loading && (
                                <span className="text-blue-600 font-medium">
                                    {userPermissions.length} custom override{userPermissions.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                                const isEnabled = selectedPermissions.includes(feature.feature_key)
                                const isOverride = userPermissions.includes(feature.feature_key)
                                const isRoleDefault = rolePermissions.includes(feature.feature_key)
                                const isSaving = savingKey === feature.feature_key

                                return (
                                    <div
                                        key={feature.feature_key}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm text-gray-900">{feature.feature_name}</span>
                                                {isOverride ? (
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
                                                disabled={isSaving || resetting}
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
                    disabled={resetting || userPermissions.length === 0}
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
