'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Shield, Save, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

export default function RolePermissionsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [features, setFeatures] = useState({})
    const [rolePermissions, setRolePermissions] = useState({})
    const [roles, setRoles] = useState([])
    const [selectedRole, setSelectedRole] = useState('employee')
    const [changes, setChanges] = useState({})
    const { toast } = useToast()

    useEffect(() => {
        fetchPermissions()
    }, [])

    const fetchPermissions = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/permissions/roles')

            if (response.ok) {
                const data = await response.json()
                setFeatures(data.features || {})
                setRolePermissions(data.rolePermissions || {})
                setRoles(data.roles || [])
                setChanges({})
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch role permissions',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
            toast({
                title: 'Error',
                description: 'An error occurred while fetching permissions',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const togglePermission = (role, featureKey, currentValue) => {
        const newValue = !currentValue

        // Update local state
        setRolePermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [featureKey]: newValue
            }
        }))

        // Track changes
        setChanges(prev => ({
            ...prev,
            [`${role}:${featureKey}`]: newValue
        }))
    }

    const saveChanges = async () => {
        if (Object.keys(changes).length === 0) {
            toast({
                title: 'No Changes',
                description: 'No permission changes to save',
            })
            return
        }

        try {
            setSaving(true)

            // Group changes by role
            const changesByRole = {}
            Object.entries(changes).forEach(([key, value]) => {
                const [role, featureKey] = key.split(':')
                if (!changesByRole[role]) {
                    changesByRole[role] = []
                }
                changesByRole[role].push({ feature_key: featureKey, is_enabled: value })
            })

            // Save each role's changes
            const promises = Object.entries(changesByRole).map(([role, permissions]) => {
                return Promise.all(permissions.map(perm =>
                    fetch(`/api/permissions/roles/${role}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(perm)
                    })
                ))
            })

            await Promise.all(promises)

            toast({
                title: 'Success',
                description: `Saved ${Object.keys(changes).length} permission changes`,
            })

            setChanges({})
        } catch (error) {
            console.error('Error saving permissions:', error)
            toast({
                title: 'Error',
                description: 'Failed to save permission changes',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const discardChanges = () => {
        fetchPermissions()
        toast({
            title: 'Changes Discarded',
            description: 'All unsaved changes have been discarded',
        })
    }

    const getCategoryIcon = (category) => {
        const icons = {
            leads: '👥',
            campaigns: '📢',
            projects: '📁',
            calls: '📞',
            analytics: '📊',
            users: '👤',
            settings: '⚙️',
            audit: '📋',
            inventory: '🏢'
        }
        return icons[category] || '📌'
    }

    const getRoleBadgeColor = (role) => {
        const colors = {
            employee: 'bg-blue-100 text-blue-800',
            manager: 'bg-purple-100 text-purple-800',
            super_admin: 'bg-green-100 text-green-800'
        }
        return colors[role] || 'bg-gray-100 text-gray-800'
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        Role Permissions
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage dashboard feature access for each role
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={discardChanges}
                        disabled={Object.keys(changes).length === 0 || saving}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Discard Changes
                    </Button>
                    <Button
                        onClick={saveChanges}
                        disabled={Object.keys(changes).length === 0 || saving}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes {Object.keys(changes).length > 0 && `(${Object.keys(changes).length})`}
                    </Button>
                </div>
            </div>

            {/* Changes Banner */}
            {Object.keys(changes).length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-orange-800">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">
                                You have {Object.keys(changes).length} unsaved change{Object.keys(changes).length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Role Tabs */}
            <Tabs value={selectedRole} onValueChange={setSelectedRole}>
                <TabsList className="grid w-full grid-cols-3">
                    {roles.map(role => (
                        <TabsTrigger key={role} value={role} className="capitalize">
                            <Badge className={`mr-2 ${getRoleBadgeColor(role)}`}>
                                {role}
                            </Badge>
                            {rolePermissions[role] && Object.values(rolePermissions[role]).filter(Boolean).length} permissions
                        </TabsTrigger>
                    ))}
                </TabsList>

                {roles.map(role => (
                    <TabsContent key={role} value={role} className="space-y-4 mt-6">
                        {/* Permission Categories */}
                        {Object.entries(features).map(([category, categoryFeatures]) => (
                            <Card key={category}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <span className="text-2xl">{getCategoryIcon(category)}</span>
                                        <span className="capitalize">{category}</span>
                                        <Badge variant="outline" className="ml-auto">
                                            {categoryFeatures.filter(f => rolePermissions[role]?.[f.feature_key]).length} / {categoryFeatures.length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {categoryFeatures.map(feature => {
                                            const isEnabled = rolePermissions[role]?.[feature.feature_key] || false
                                            const hasChange = changes[`${role}:${feature.feature_key}`] !== undefined

                                            return (
                                                <div
                                                    key={feature.feature_key}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${hasChange ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium">{feature.feature_name}</h4>
                                                            {hasChange && (
                                                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                                                                    Modified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {feature.description}
                                                        </p>
                                                        <code className="text-xs text-gray-500 mt-1 block">
                                                            {feature.feature_key}
                                                        </code>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4">
                                                        {isEnabled ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-gray-400" />
                                                        )}
                                                        <Switch
                                                            checked={isEnabled}
                                                            onCheckedChange={() => togglePermission(role, feature.feature_key, isEnabled)}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
