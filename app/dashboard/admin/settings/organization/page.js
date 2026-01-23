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

export default function OrganizationSettingsPage() {
    const supabase = createClient()
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
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            console.log('User:', user, 'Error:', userError)
            if (!user) {
                toast.error('Not authenticated')
                return
            }

            // Use RPC function to avoid RLS infinite recursion
            const { data: organizationId, error: rpcError } = await supabase
                .rpc('get_user_organization_id', { user_id: user.id })

            console.log('Organization ID from RPC:', organizationId, 'Error:', rpcError)
            if (rpcError) {
                console.error('RPC error details:', rpcError)
                throw rpcError
            }
            if (!organizationId) {
                throw new Error('No organization_id found for user')
            }

            // Fetch organization details
            console.log('Fetching org with ID:', organizationId)
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', organizationId)
                .single()

            console.log('Organization:', org, 'Error:', orgError)
            if (orgError) {
                console.error('Org error details:', orgError)
                throw orgError
            }

            setOrganization(org)

            // If logo exists in settings, set it
            if (org.settings?.logo_url) {
                setLogoUrl(org.settings.logo_url)
            }
        } catch (error) {
            console.error('Error fetching organization:', error)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
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

            // Update organization settings with logo URL
            const updatedSettings = {
                ...organization.settings,
                logo_url: publicUrl
            }

            const { error: updateError } = await supabase
                .from('organizations')
                .update({ settings: updatedSettings })
                .eq('id', organization.id)

            if (updateError) throw updateError

            setLogoUrl(publicUrl)
            setOrganization({ ...organization, settings: updatedSettings })
            toast.success('Logo uploaded successfully!')
        } catch (error) {
            console.error('Error uploading logo:', error)
            toast.error('Failed to upload logo')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="p-8">
                <div className="text-center text-gray-500">
                    No organization found
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Organization Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>
                        View your organization information. Contact support to update these details.
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Logo
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG up to 2MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Organization Name - Read Only */}
                    <div>
                        <Label htmlFor="org-name">Organization Name</Label>
                        <div className="flex items-center gap-3 mt-2">
                            {logoUrl && (
                                <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                                    <Image
                                        src={logoUrl}
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <Input
                                id="org-name"
                                value={organization.name || ''}
                                readOnly
                                disabled
                                className="bg-gray-50 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            This field cannot be edited
                        </p>
                    </div>

                    {/* Sector/Industry - Read Only */}
                    <div>
                        <Label htmlFor="sector">Industry / Sector</Label>
                        <Input
                            id="sector"
                            value={organization.sector || 'Not specified'}
                            readOnly
                            disabled
                            className="bg-gray-50 cursor-not-allowed mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This field cannot be edited
                        </p>
                    </div>

                    {/* Additional Info (Optional - can be shown but read-only) */}
                    {organization.company_name && (
                        <div>
                            <Label htmlFor="company-name">Company Name</Label>
                            <Input
                                id="company-name"
                                value={organization.company_name}
                                readOnly
                                disabled
                                className="bg-gray-50 cursor-not-allowed mt-2"
                            />
                        </div>
                    )}

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
                </CardContent>
            </Card>
        </div>
    )
}
