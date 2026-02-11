'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Check, X, RotateCcw, Loader2 } from 'lucide-react'

/**
 * PermissionManager Component
 * Allows super admins to manage user-specific permissions
 * Shows visual indicators for role-based vs user-specific permissions
 */
export default function PermissionManager({ userId, userRole, onClose }) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [allFeatures, setAllFeatures] = useState([])
    const [rolePermissions, setRolePermissions] = useState([])
    const [userPermissions, setUserPermissions] = useState([])
    const [selectedPermissions, setSelectedPermissions] = useState([])

    useEffect(() => {
        fetchPermissions()
    }, [userId])

    async function fetchPermissions() {
        try {
            const response = await fetch(`/api/admin/users/${userId}/permissions`)
            if (!response.ok) {
                throw new Error('Failed to fetch permissions')
            }

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

    async function handleSave() {
        setSaving(true)
        try {
            const response = await fetch(`/api/admin/users/${userId}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: selectedPermissions })
            })

            if (!response.ok) {
                throw new Error('Failed to update permissions')
            }

            const data = await response.json()
            toast.success(`Permissions updated! ${data.overrideCount} custom permissions set.`)
            onClose?.()
        } catch (error) {
            console.error('Error saving permissions:', error)
            toast.error('Failed to save permissions')
        } finally {
            setSaving(false)
        }
    }

    async function handleReset() {
        if (!confirm('Reset this user to role-based permissions? All custom permissions will be removed.')) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/users/${userId}/permissions/reset`, {
                method: 'POST'
            })

            if (!response.ok) {
                throw new Error('Failed to reset permissions')
            }

            toast.success('Permissions reset to role defaults')
            fetchPermissions() // Reload
        } catch (error) {
            console.error('Error resetting permissions:', error)
            toast.error('Failed to reset permissions')
        } finally {
            setSaving(false)
        }
    }

    function togglePermission(featureKey) {
        setSelectedPermissions(prev => {
            if (prev.includes(featureKey)) {
                return prev.filter(k => k !== featureKey)
            } else {
                return [...prev, featureKey]
            }
        })
    }

    function isRolePermission(featureKey) {
        return rolePermissions.includes(featureKey)
    }

    function isUserPermission(featureKey) {
        return userPermissions.includes(featureKey)
    }

    function getPermissionSource(featureKey) {
        if (isUserPermission(featureKey)) {
            return 'user' // User-specific override
        } else if (isRolePermission(featureKey)) {
            return 'role' // Role-based default
        }
        return null
    }

    // Group features by category
    const categorizedFeatures = allFeatures.reduce((acc, feature) => {
        const category = feature.category || 'other'
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(feature)
        return acc
    }, {})

    const categoryLabels = {
        leads: 'Lead Management',
        campaigns: 'Campaign Management',
        projects: 'Project Management',
        calls: 'Call Management',
        analytics: 'Analytics & Insights',
        users: 'User Management',
        settings: 'Settings & Configuration',
        audit: 'Audit & Compliance',
        inventory: 'Inventory Management',
        other: 'Other'
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Manage Permissions</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Role: <span className="font-medium capitalize">{userRole?.replace('_', ' ')}</span>
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-4 py-3 bg-blue-50 border-b border-blue-100 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-700">Role-based (Default)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">User-specific (Override)</span>
                </div>
            </div>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.entries(categorizedFeatures).map(([category, features]) => (
                    <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h4 className="font-semibold text-gray-900">
                                {categoryLabels[category] || category}
                            </h4>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {features.map(feature => {
                                const isEnabled = selectedPermissions.includes(feature.feature_key)
                                const source = getPermissionSource(feature.feature_key)
                                const isOverride = source === 'user'

                                return (
                                    <div
                                        key={feature.feature_key}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            {/* Indicator Dot */}
                                            <div
                                                className={`w-3 h-3 rounded-full ${isOverride
                                                        ? 'bg-green-500'
                                                        : source === 'role'
                                                            ? 'bg-blue-500'
                                                            : 'bg-gray-300'
                                                    }`}
                                            ></div>

                                            {/* Feature Info */}
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {feature.feature_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {feature.description}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => togglePermission(feature.feature_key)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={handleReset}
                    disabled={saving || userPermissions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Role Defaults
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
