'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Building2, Upload, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermission } from '@/contexts/PermissionContext'
import PermissionTooltip from '@/components/permissions/PermissionTooltip'
import { Lock } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES } from '@/lib/constants/countries'

export default function OrganizationSettingsPage() {
    const supabase = createClient()
    const canEdit = usePermission('manage_settings')
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [organization, setOrganization] = useState(null)
    const [logoUrl, setLogoUrl] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchOrganization()
    }, [])

    const fetchOrganization = async () => {
        try {
            const response = await fetch('/api/organization/settings')
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch organization')
            }

            if (!data.organization) {
                throw new Error('No organization data received')
            }

            const org = data.organization
            setOrganization(org)
            console.log('Fetched Organization:', org)

            // If logo exists in settings, set it
            if (org.settings?.logo_url) {
                setLogoUrl(org.settings.logo_url)
            }
        } catch (error) {
            console.error('Error fetching organization:', error)
            toast.error(`Failed to load organization: ${error.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleLogoUpload = async (event) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file')
                return
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should be less than 2MB')
                return
            }

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${organization.id}-${Date.now()}.${fileExt}`
            const filePath = `org-logos/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath)

            // Update organization settings with logo URL via API (server-side)
            const response = await fetch('/api/organization/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    logo_url: publicUrl
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update organization logo')
            }

            // Update local state with the returned organization data
            setLogoUrl(publicUrl)
            setOrganization(data.organization)
            toast.success('Logo uploaded successfully!')
        } catch (error) {
            console.error('Error uploading logo:', error)
            toast.error(`Failed to upload logo: ${error.message}`)
        } finally {
            setUploading(false)
        }
    }

    const handleCountryChange = (countryName) => {
        const country = COUNTRIES.find(c => c.name === countryName)
        if (country) {
            setOrganization(prev => ({
                ...prev,
                country: country.name,
                currency: country.currency,
                currency_symbol: country.symbol
            }))
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/organization/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Only country/currency are editable (if not set)
                    country: organization.country,
                    currency: organization.currency,
                    currency_symbol: organization.currency_symbol
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update organization')
            }

            setOrganization(data.organization)
            toast.success('Organization updated successfully')
        } catch (error) {
            console.error('Error updating organization:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }


    if (loading && !organization) {
        return (
            <div className="p-8 max-w-4xl space-y-6">
                <Skeleton className="h-10 w-64 rounded-md mb-8" />
                <div className="border rounded-xl bg-card p-6 space-y-8">
                    <div className="space-y-2 mb-6">
                        <Skeleton className="h-7 w-48 rounded" />
                        <Skeleton className="h-4 w-full max-w-md rounded" />
                    </div>
                    <div className="space-y-6">
                        <div className="flex gap-6 items-center">
                            <Skeleton className="h-24 w-24 rounded-lg" />
                            <div className="space-y-3">
                                <Skeleton className="h-10 w-32 rounded-md" />
                                <Skeleton className="h-3 w-24 rounded" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                            <Skeleton className="h-24 w-full rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!organization && !loading) {
        return (
            <div className="p-8">
                <div className="text-center text-gray-500">
                    No organization found
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen h-full bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto">
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Organization Settings</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>
                            Update your organization information and public profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Logo Upload Section */}
                        <div>
                            <Label className="mb-2 block">Organization Logo</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {logoUrl ? (
                                        <Image
                                            src={logoUrl}
                                            alt="Organization Logo"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <PermissionTooltip
                                        hasPermission={canEdit}
                                        message="You need 'Manage Settings' permission to upload a logo."
                                    >
                                        <div className="relative">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                disabled={!canEdit}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    if (!canEdit) return
                                                    fileInputRef.current?.click()
                                                }}
                                                disabled={uploading || !canEdit}
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        {!canEdit ? <Lock className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                                        Upload Logo
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </PermissionTooltip>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG up to 2MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Organization Name - Read Only */}
                        <div>
                            <Label htmlFor="org-name">Organization Name</Label>
                            <Input
                                id="org-name"
                                value={organization.name || ''}
                                readOnly
                                disabled
                                className="mt-2 bg-gray-50 cursor-not-allowed"
                                placeholder="Enter organization name"
                            />
                        </div>

                        {/* Sector/Industry - Read Only */}
                        <div>
                            <Label htmlFor="sector">Industry / Sector</Label>
                            <Input
                                id="sector"
                                value={organization.sector?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || ''}
                                readOnly
                                disabled
                                className="mt-2 bg-gray-50 cursor-not-allowed"
                                placeholder="e.g. Real Estate, Healthcare, Education"
                            />
                        </div>

                        {/* Company Name - Read Only */}
                        <div>
                            <Label htmlFor="company-name">Legal Company Name</Label>
                            <Input
                                id="company-name"
                                value={organization.company_name || ''}
                                readOnly
                                disabled
                                className="mt-2 bg-gray-50 cursor-not-allowed"
                                placeholder="Official registered company name"
                            />
                        </div>

                        {/* Country & Currency Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="country">Country</Label>
                                <Select
                                    value={organization.country || ''}
                                    onValueChange={handleCountryChange}
                                    disabled={!!organization.country || !canEdit}
                                >
                                    <SelectTrigger className={`mt-2 ${(organization.country || !canEdit) ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map((c) => (
                                            <SelectItem key={c.code} value={c.name}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {organization.country && (
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Country cannot be changed after onboarding.
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="currency">Currency</Label>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1">
                                        <Input
                                            id="currency"
                                            value={organization.currency ? `${organization.currency} (${organization.currency_symbol})` : 'Auto-selected'}
                                            readOnly
                                            disabled
                                            className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address - Read Only */}
                        <div>
                            <Label htmlFor="address">Address</Label>
                            <textarea
                                id="address"
                                value={[
                                    organization.address_line_1,
                                    organization.address_line_2,
                                    organization.city,
                                    organization.state,
                                    organization.pincode,
                                    organization.country
                                ].filter(Boolean).join(', ') || ''}
                                readOnly
                                disabled
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                                placeholder="Address will be populated from onboarding details"
                            />
                        </div>

                        {/* Tier - Read Only */}
                        {organization.tier && (
                            <div>
                                <Label htmlFor="tier">Subscription Tier</Label>
                                <Input
                                    id="tier"
                                    value={organization.tier.toUpperCase()}
                                    readOnly
                                    disabled
                                    className="bg-gray-50 cursor-not-allowed mt-2"
                                />
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <PermissionTooltip
                                hasPermission={canEdit}
                                message="You need 'Manage Settings' permission to save changes."
                            >
                                <Button
                                    onClick={() => {
                                        if (!canEdit) return
                                        handleSave()
                                    }}
                                    disabled={loading || uploading || !canEdit}
                                    className="min-w-[120px]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {!canEdit && <Lock className="w-4 h-4 mr-2" />}
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </PermissionTooltip>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
