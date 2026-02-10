'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BillingPlansManagement() {
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingPlan, setEditingPlan] = useState(null)
    const [showForm, setShowForm] = useState(false)

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/billing/plans?all=true')
            const data = await res.json()
            setPlans(data.plans || [])
        } catch (error) {
            console.error('Error fetching plans:', error)
            toast.error('Failed to load billing plans')
        } finally {
            setLoading(false)
        }
    }

    const handleSavePlan = async (planData) => {
        try {
            const url = editingPlan
                ? `/api/billing/plans/${editingPlan.id}`
                : '/api/billing/plans'

            const method = editingPlan ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData)
            })

            if (res.ok) {
                toast.success(editingPlan ? 'Plan updated' : 'Plan created')
                setShowForm(false)
                setEditingPlan(null)
                fetchPlans()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to save plan')
            }
        } catch (error) {
            console.error('Error saving plan:', error)
            toast.error('Error saving plan')
        }
    }

    const handleDeletePlan = async (planId) => {
        if (!confirm('Are you sure you want to deactivate this plan?')) return

        try {
            const res = await fetch(`/api/billing/plans/${planId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Plan deactivated')
                fetchPlans()
            } else {
                toast.error('Failed to deactivate plan')
            }
        } catch (error) {
            console.error('Error deleting plan:', error)
            toast.error('Error deactivating plan')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Billing Plans</h2>
                    <p className="text-muted-foreground">Manage subscription plans and pricing</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingPlan(null) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                </Button>
            </div>

            {showForm && (
                <PlanForm
                    plan={editingPlan}
                    onSave={handleSavePlan}
                    onCancel={() => { setShowForm(false); setEditingPlan(null) }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                    <Card key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {plan.name}
                                        {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                                    </CardTitle>
                                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Module:</span>
                                    <Badge variant="outline">{plan.module_type}</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Per User/Month:</span>
                                    <span className="font-semibold">₹{parseFloat(plan.per_user_price_inr).toFixed(2)}</span>
                                </div>
                                {plan.discount_percentage > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount:</span>
                                        <span className="text-green-600 font-semibold">{plan.discount_percentage}%</span>
                                    </div>
                                )}
                            </div>

                            {plan.features && Object.keys(plan.features).length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Features:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(plan.features).map(([key, value]) => (
                                            value && (
                                                <Badge key={key} variant="secondary" className="text-xs">
                                                    {key.replace(/_/g, ' ')}
                                                </Badge>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => { setEditingPlan(plan); setShowForm(true) }}
                                >
                                    <Edit className="mr-1 h-3 w-3" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeletePlan(plan.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function PlanForm({ plan, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: plan?.name || '',
        description: plan?.description || '',
        module_type: plan?.module_type || 'crm',
        per_user_price_inr: plan?.per_user_price_inr || 100,
        discount_percentage: plan?.discount_percentage || 0,
        features: plan?.features || {
            csv_export: false,
            advanced_analytics: false,
            bulk_import: false
        },
        is_active: plan?.is_active ?? true
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{plan ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="module_type">Module Type</Label>
                            <Select
                                value={formData.module_type}
                                onValueChange={(value) => setFormData({ ...formData, module_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="crm">CRM</SelectItem>
                                    <SelectItem value="inventory">Inventory</SelectItem>
                                    <SelectItem value="analytics">Analytics</SelectItem>
                                    <SelectItem value="all_modules">All Modules</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price per User/Month (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.per_user_price_inr}
                                onChange={(e) => setFormData({ ...formData, per_user_price_inr: parseFloat(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discount">Discount (%)</Label>
                            <Input
                                id="discount"
                                type="number"
                                step="0.01"
                                value={formData.discount_percentage}
                                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Features</Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="csv_export" className="font-normal">CSV Export</Label>
                                <Switch
                                    id="csv_export"
                                    checked={formData.features.csv_export}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, features: { ...formData.features, csv_export: checked } })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="advanced_analytics" className="font-normal">Advanced Analytics</Label>
                                <Switch
                                    id="advanced_analytics"
                                    checked={formData.features.advanced_analytics}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, features: { ...formData.features, advanced_analytics: checked } })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="bulk_import" className="font-normal">Bulk Import</Label>
                                <Switch
                                    id="bulk_import"
                                    checked={formData.features.bulk_import}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, features: { ...formData.features, bulk_import: checked } })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active" className="font-normal">Active</Label>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                            <DollarSign className="mr-2 h-4 w-4" />
                            {plan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
