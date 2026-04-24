'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Building2, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function PlatformPermissionsPage() {
    const [orgs, setOrgs] = useState([])
    const [orgsLoading, setOrgsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedOrg, setSelectedOrg] = useState(null)

    const [features, setFeatures] = useState({})
    const [rolePermissions, setRolePermissions] = useState({})
    const [permLoading, setPermLoading] = useState(false)
    const [savingKey, setSavingKey] = useState(null)
    const [selectedRole, setSelectedRole] = useState('employee')

    useEffect(() => {
        fetchOrgs()
    }, [])

    useEffect(() => {
        if (selectedOrg) fetchOrgPermissions(selectedOrg.id)
    }, [selectedOrg])

    async function fetchOrgs() {
        try {
            const res = await fetch('/api/platform/organizations')
            if (!res.ok) throw new Error()
            const data = await res.json()
            setOrgs(data.organizations || [])
        } catch {
            toast.error('Failed to load organizations')
        } finally {
            setOrgsLoading(false)
        }
    }

    async function fetchOrgPermissions(orgId) {
        setPermLoading(true)
        try {
            const res = await fetch(`/api/platform/permissions?orgId=${orgId}`)
            if (!res.ok) throw new Error()
            const data = await res.json()

            // data.features is an array; group by category
            const grouped = (data.features || []).reduce((acc, f) => {
                const cat = f.category || 'other'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(f)
                return acc
            }, {})
            setFeatures(grouped)
            setRolePermissions(data.rolePermissions || {})
        } catch {
            toast.error('Failed to load permissions')
        } finally {
            setPermLoading(false)
        }
    }

    async function handleToggle(role, featureKey, currentValue) {
        const key = `${role}:${featureKey}`
        setSavingKey(key)
        const newValue = !currentValue

        setRolePermissions(prev => ({
            ...prev,
            [role]: { ...prev[role], [featureKey]: newValue }
        }))

        try {
            const res = await fetch(`/api/platform/permissions?orgId=${selectedOrg.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, feature_key: featureKey, is_enabled: newValue })
            })
            if (!res.ok) throw new Error()
        } catch {
            setRolePermissions(prev => ({
                ...prev,
                [role]: { ...prev[role], [featureKey]: currentValue }
            }))
            toast.error('Failed to save permission')
        } finally {
            setSavingKey(null)
        }
    }

    const getCategoryIcon = (category) => {
        const icons = {
            leads: '👥', campaigns: '📢', projects: '📁', calls: '📞',
            analytics: '📊', users: '👤', settings: '⚙️', audit: '📋',
            inventory: '🏢', crm: '🎯'
        }
        return icons[category] || '📌'
    }

    const filteredOrgs = orgs.filter(o =>
        o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.slug?.toLowerCase().includes(search.toLowerCase())
    )

    const roles = ['employee', 'manager', 'super_admin']

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left panel — org list */}
            <div className="w-72 border-r bg-white flex flex-col shrink-0">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        Organizations
                    </h2>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {orgsLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    ) : filteredOrgs.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 p-8">No organizations found</p>
                    ) : (
                        filteredOrgs.map(org => (
                            <button
                                key={org.id}
                                onClick={() => setSelectedOrg(org)}
                                className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-purple-50 ${selectedOrg?.id === org.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}
                            >
                                <div className="font-medium text-sm text-gray-900 truncate">{org.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5 truncate">{org.slug}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right panel — permissions */}
            <div className="flex-1 overflow-y-auto">
                {!selectedOrg ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
                        <Shield className="w-12 h-12 text-gray-200" />
                        <p className="text-sm">Select an organization to manage permissions</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6 max-w-5xl">
                        {/* Header */}
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{selectedOrg.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Role permissions · Changes save automatically and take effect within ~60s
                            </p>
                        </div>

                        {permLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                            </div>
                        ) : (
                            <Tabs value={selectedRole} onValueChange={setSelectedRole}>
                                <TabsList>
                                    {roles.map(role => {
                                        const isAdmin = role === 'super_admin'
                                        const total = Object.values(features).reduce((s, arr) => s + arr.length, 0)
                                        const active = isAdmin ? total : Object.values(rolePermissions[role] || {}).filter(Boolean).length
                                        return (
                                            <TabsTrigger key={role} value={role} className="gap-2">
                                                <span className="capitalize">{role === 'super_admin' ? 'Super Admin' : role}</span>
                                                <Badge
                                                    variant={isAdmin ? 'default' : 'secondary'}
                                                    className={`text-xs ${isAdmin ? 'bg-green-600 text-white' : ''}`}
                                                >
                                                    {isAdmin ? 'Full access' : `${active}/${total}`}
                                                </Badge>
                                            </TabsTrigger>
                                        )
                                    })}
                                </TabsList>

                                {/* Admin tab — read-only, always full access */}
                                <TabsContent value="super_admin" className="mt-6">
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-4 flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-green-900 text-sm">Admin — Full Access</p>
                                            <p className="text-xs text-green-700 mt-0.5">
                                                The Admin role always has access to all features. Permissions cannot be restricted for this role.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.entries(features).map(([category, categoryFeatures]) => (
                                            <Card key={category} className="opacity-80">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center gap-2 text-base">
                                                        <span>{getCategoryIcon(category)}</span>
                                                        <span className="capitalize">{category}</span>
                                                        <Badge variant="outline" className="ml-auto text-xs text-green-700 border-green-300">
                                                            {categoryFeatures.length}/{categoryFeatures.length}
                                                        </Badge>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        {categoryFeatures.map(feature => (
                                                            <div key={feature.feature_key} className="flex items-center justify-between p-3 rounded-lg border border-green-100 bg-white">
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-sm">{feature.feature_name}</div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">{feature.description}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                    <Switch checked={true} disabled className="opacity-60" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Employee + Manager tabs — editable */}
                                {roles.filter(r => r !== 'super_admin').map(role => (
                                    <TabsContent key={role} value={role} className="space-y-4 mt-6">
                                        {Object.entries(features).map(([category, categoryFeatures]) => {
                                            const activeCount = categoryFeatures.filter(f => rolePermissions[role]?.[f.feature_key]).length
                                            return (
                                                <Card key={category}>
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="flex items-center gap-2 text-base">
                                                            <span>{getCategoryIcon(category)}</span>
                                                            <span className="capitalize">{category}</span>
                                                            <Badge variant="outline" className="ml-auto text-xs">
                                                                {activeCount}/{categoryFeatures.length}
                                                            </Badge>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-2">
                                                            {categoryFeatures.map(feature => {
                                                                const isEnabled = rolePermissions[role]?.[feature.feature_key] || false
                                                                const key = `${role}:${feature.feature_key}`
                                                                const isSaving = savingKey === key
                                                                return (
                                                                    <div key={feature.feature_key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-sm">{feature.feature_name}</div>
                                                                            <div className="text-xs text-gray-500 mt-0.5">{feature.description}</div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 ml-4 shrink-0">
                                                                            {isSaving ? (
                                                                                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                                                            ) : isEnabled ? (
                                                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                            ) : (
                                                                                <XCircle className="w-4 h-4 text-gray-300" />
                                                                            )}
                                                                            <Switch
                                                                                checked={isEnabled}
                                                                                disabled={isSaving}
                                                                                onCheckedChange={() => handleToggle(role, feature.feature_key, isEnabled)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
