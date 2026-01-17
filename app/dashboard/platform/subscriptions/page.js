'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, Users, CreditCard, MoreHorizontal, CheckCircle, XCircle, Clock, Plus, Edit, Archive } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PlatformSubscriptionsPage() {
    const [activeTab, setActiveTab] = useState('subscriptions')
    const [subscriptions, setSubscriptions] = useState([])
    const [metrics, setMetrics] = useState({})
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [planFilter, setPlanFilter] = useState('all')

    // Plans State
    const [plans, setPlans] = useState([])
    const [plansLoading, setPlansLoading] = useState(false)
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState(null)
    const [planFormData, setPlanFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        features: {
            max_users: 5,
            max_storage_gb: 1,
            custom_domain: false,
            api_access: false,
            priority_support: false
        },
        sort_order: 0,
        is_active: true
    })

    // Change Plan State
    const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false)
    const [changePlanData, setChangePlanData] = useState({
        subscriptionId: null,
        planId: '',
        billingCycle: 'monthly'
    })

    useEffect(() => {
        fetchSubscriptions()
        fetchPlans()
    }, [statusFilter, planFilter])

    const fetchPlans = async () => {
        setPlansLoading(true)
        try {
            const response = await fetch('/api/platform/plans')
            const data = await response.json()
            if (response.ok) {
                setPlans(data.plans || [])
            } else {
                toast.error('Failed to fetch plans')
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
        } finally {
            setPlansLoading(false)
        }
    }

    const handleSavePlan = async () => {
        const loadingToast = toast.loading(editingPlan ? 'Updating plan...' : 'Creating plan...')
        try {
            const url = editingPlan
                ? `/api/platform/plans?id=${editingPlan.id}`
                : '/api/platform/plans'

            const method = editingPlan ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planFormData)
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(`Plan ${editingPlan ? 'updated' : 'created'} successfully`, { id: loadingToast })
                setIsPlanDialogOpen(false)
                fetchPlans()
                setEditingPlan(null)
                resetPlanForm()
            } else {
                toast.error(data.error || 'Operation failed', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error saving plan:', error)
            toast.error('Operation failed', { id: loadingToast })
        }
    }

    const resetPlanForm = () => {
        setPlanFormData({
            name: '',
            slug: '',
            description: '',
            price_monthly: 0,
            price_yearly: 0,
            features: {
                max_users: 5,
                max_storage_gb: 1,
                custom_domain: false,
                api_access: false,
                priority_support: false
            },
            sort_order: 0,
            is_active: true
        })
    }

    const openEditPlan = (plan) => {
        setEditingPlan(plan)
        setPlanFormData({
            name: plan.name,
            slug: plan.slug,
            description: plan.description || '',
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            features: plan.features || {},
            sort_order: plan.sort_order,
            is_active: plan.is_active
        })
        setIsPlanDialogOpen(true)
    }

    const fetchSubscriptions = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (planFilter !== 'all') params.append('plan', planFilter)

            const response = await fetch(`/api/platform/subscriptions?${params}`)
            const data = await response.json()

            if (response.ok) {
                setSubscriptions(data.subscriptions || [])
                setMetrics(data.metrics || {})
            } else {
                toast.error(data.error || 'Failed to fetch subscriptions')
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error)
            toast.error('Failed to fetch subscriptions')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (subscriptionId, action) => {
        const loadingToast = toast.loading(`${action === 'cancel' ? 'Cancelling' : action === 'activate' ? 'Activating' : 'Extending trial for'} subscription...`)

        try {
            const response = await fetch(`/api/platform/subscriptions?action=${action}&id=${subscriptionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'extend_trial' ? JSON.stringify({ days: 7 }) : undefined
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(`Subscription ${action}d successfully`, { id: loadingToast })
                fetchSubscriptions()
            } else {
                toast.error(data.error || 'Action failed', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error performing action:', error)
            toast.error('Action failed', { id: loadingToast })
        }
    }

    const openChangePlan = (sub) => {
        setChangePlanData({
            subscriptionId: sub.id,
            planId: sub.plan?.id || '',
            billingCycle: sub.billing_cycle || 'monthly'
        })
        setIsChangePlanDialogOpen(true)
    }

    const handleConfirmChangePlan = async () => {
        if (!changePlanData.planId || !changePlanData.subscriptionId) return

        const loadingToast = toast.loading('Assigning plan...')
        try {
            const response = await fetch(`/api/platform/subscriptions?action=change_plan&id=${changePlanData.subscriptionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: changePlanData.planId,
                    billingCycle: changePlanData.billingCycle
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Plan assigned successfully', { id: loadingToast })
                setIsChangePlanDialogOpen(false)
                fetchSubscriptions()
            } else {
                toast.error(data.error || 'Failed to assign plan', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error assigning plan:', error)
            toast.error('Failed to assign plan', { id: loadingToast })
        }
    }

    const getStatusBadge = (status) => {
        const variants = {
            active: 'bg-green-100 text-green-800 hover:bg-green-100',
            trialing: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
            cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
            past_due: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
            inactive: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        }
        return <Badge className={variants[status] || variants.inactive}>{status}</Badge>
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subscriptions & Plans</h1>
                    <p className="text-gray-500 mt-1">Manage organization subscriptions and packages</p>
                </div>
                {activeTab === 'plans' && (
                    <Button onClick={() => { setEditingPlan(null); resetPlanForm(); setIsPlanDialogOpen(true) }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Plan
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                    <TabsTrigger value="plans">Plans & Packages</TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Total Subscriptions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{metrics.total || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {metrics.active || 0} active, {metrics.trialing || 0} trialing
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Monthly Recurring Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.mrr || 0)}</div>
                                <p className="text-xs text-gray-500 mt-1">Per month</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Annual Recurring Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.arr || 0)}</div>
                                <p className="text-xs text-gray-500 mt-1">Per year</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Cancelled
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{metrics.cancelled || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">Churn rate: {metrics.total > 0 ? ((metrics.cancelled / metrics.total) * 100).toFixed(1) : 0}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>All Subscriptions</CardTitle>
                                    <CardDescription>View and manage organization subscriptions</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="trialing">Trialing</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="past_due">Past Due</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={planFilter} onValueChange={setPlanFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Filter by plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Plans</SelectItem>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : subscriptions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No subscriptions found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Organization</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Billing Cycle</TableHead>
                                                <TableHead>Period End</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscriptions.map((sub) => (
                                                <TableRow key={sub.id}>
                                                    <TableCell className="font-medium">
                                                        {sub.organization?.company_name || sub.organization?.name || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{sub.plan?.name}</Badge>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                                    <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {formatDate(sub.current_period_end)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {sub.status === 'trialing' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(sub.id, 'extend_trial')}>
                                                                        <Clock className="w-4 h-4 mr-2" />
                                                                        Extend Trial (7 days)
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {sub.status === 'active' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(sub.id, 'cancel')}>
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Cancel Subscription
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {sub.status === 'cancelled' && (
                                                                    <DropdownMenuItem onClick={() => handleAction(sub.id, 'activate')}>
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Reactivate
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => openChangePlan(sub)}>
                                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                                    Assign Plan
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plans</CardTitle>
                            <CardDescription>Manage available subscription packages</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {plansLoading ? (
                                <div className="text-center py-8">Loading plans...</div>
                            ) : plans.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Archive className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No plans found</p>
                                    <Button variant="outline" className="mt-4" onClick={() => setIsPlanDialogOpen(true)}>
                                        Create your first plan
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Pricing</TableHead>
                                                <TableHead>Limits</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {plans.map((plan) => (
                                                <TableRow key={plan.id}>
                                                    <TableCell className="font-medium">
                                                        <div>{plan.name}</div>
                                                        <div className="text-xs text-gray-500">{plan.slug}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {formatCurrency(plan.price_monthly)}/mo
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatCurrency(plan.price_yearly)}/yr
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {plan.features?.max_users} Users
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {plan.features?.max_storage_gb}GB Storage
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {plan.is_active ? (
                                                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                        ) : (
                                                            <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => openEditPlan(plan)}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Plan Dialog */}
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                        <DialogDescription>
                            Configure subscription plan details, pricing, and limits.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Plan Name</Label>
                                <Input
                                    id="name"
                                    value={planFormData.name}
                                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    placeholder="e.g. Pro Plan"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (Unique ID)</Label>
                                <Input
                                    id="slug"
                                    value={planFormData.slug}
                                    onChange={(e) => setPlanFormData({ ...planFormData, slug: e.target.value })}
                                    placeholder="e.g. pro-plan"
                                    disabled={!!editingPlan}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_monthly">Monthly Price (INR)</Label>
                                <Input
                                    id="price_monthly"
                                    type="number"
                                    value={planFormData.price_monthly}
                                    onChange={(e) => setPlanFormData({ ...planFormData, price_monthly: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_yearly">Yearly Price (INR)</Label>
                                <Input
                                    id="price_yearly"
                                    type="number"
                                    value={planFormData.price_yearly}
                                    onChange={(e) => setPlanFormData({ ...planFormData, price_yearly: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Limits & Features</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">Max Users</Label>
                                        <Input
                                            type="number"
                                            value={planFormData.features.max_users}
                                            onChange={(e) => setPlanFormData({
                                                ...planFormData,
                                                features: { ...planFormData.features, max_users: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Storage (GB)</Label>
                                        <Input
                                            type="number"
                                            value={planFormData.features.max_storage_gb}
                                            onChange={(e) => setPlanFormData({
                                                ...planFormData,
                                                features: { ...planFormData.features, max_storage_gb: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="custom_domain">Custom Domain</Label>
                                    <Switch
                                        id="custom_domain"
                                        checked={planFormData.features.custom_domain}
                                        onCheckedChange={(checked) => setPlanFormData({
                                            ...planFormData,
                                            features: { ...planFormData.features, custom_domain: checked }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="api_access">API Access</Label>
                                    <Switch
                                        id="api_access"
                                        checked={planFormData.features.api_access}
                                        onCheckedChange={(checked) => setPlanFormData({
                                            ...planFormData,
                                            features: { ...planFormData.features, api_access: checked }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="priority_support">Priority Support</Label>
                                    <Switch
                                        id="priority_support"
                                        checked={planFormData.features.priority_support}
                                        onCheckedChange={(checked) => setPlanFormData({
                                            ...planFormData,
                                            features: { ...planFormData.features, priority_support: checked }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <Label htmlFor="is_active">Plan Active</Label>
                                    <Switch
                                        id="is_active"
                                        checked={planFormData.is_active}
                                        onCheckedChange={(checked) => setPlanFormData({ ...planFormData, is_active: checked })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={planFormData.description}
                                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                                placeholder="Brief description of the plan..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePlan}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Plan Dialog */}
            <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Plan & Package</DialogTitle>
                        <DialogDescription>
                            Manually assign a subscription plan to this organization.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Plan</Label>
                            <Select
                                value={changePlanData.planId}
                                onValueChange={(val) => setChangePlanData(prev => ({ ...prev, planId: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} ({formatCurrency(p.price_monthly)}/mo)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Billing Cycle</Label>
                            <Select
                                value={changePlanData.billingCycle}
                                onValueChange={(val) => setChangePlanData(prev => ({ ...prev, billingCycle: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select billing cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangePlanDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmChangePlan} disabled={!changePlanData.planId}>Assign Plan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
