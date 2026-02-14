'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

import LeadActivityTimeline from '@/components/crm/LeadActivityTimeline'
import EditLeadProfileDialog from '@/components/crm/EditLeadProfileDialog'
import LinkPropertyDialog from '@/components/crm/LinkPropertyDialog'
import AvatarPickerDialog from '@/components/crm/AvatarPickerDialog'

// New sub-components
import LeadProfileSidebar from '@/components/crm/LeadProfileSidebar'
import LeadProfileOverview from '@/components/crm/LeadProfileOverview'
import LeadProfileNotes from '@/components/crm/LeadProfileNotes'
import LeadProfileEmails from '@/components/crm/LeadProfileEmails'

export default function LeadProfileView({ leadId, onClose, isModal = false }) {
    const [lead, setLead] = useState(null)
    const [profile, setProfile] = useState(null)
    const [organization, setOrganization] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [notes, setNotes] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

    useEffect(() => {
        if (leadId) {
            fetchLeadData()
        }
    }, [leadId])

    useEffect(() => {
        if (lead?.notes) setNotes(lead.notes)
    }, [lead])

    const fetchLeadData = async () => {
        try {
            setLoading(true)

            // Fetch lead basic info (with cache-busting to ensure fresh data)
            const leadRes = await fetch(`/api/leads/${leadId}?t=${Date.now()}`, {
                cache: 'no-store'
            })
            if (!leadRes.ok) throw new Error('Failed to fetch lead')
            const leadData = await leadRes.json()
            setLead(leadData.lead)

            // Fetch lead profile
            const profileRes = await fetch(`/api/leads/${leadId}/profile`)
            if (!profileRes.ok) throw new Error('Failed to fetch profile')
            const profileData = await profileRes.json()
            setProfile(profileData.profile)

            // Fetch organization settings for currency
            const orgRes = await fetch('/api/organization/settings')
            if (orgRes.ok) {
                const orgData = await orgRes.json()
                setOrganization(orgData.organization)
            }

        } catch (error) {
            console.error('Error fetching lead data:', error)
            toast.error('Failed to load lead profile')
        } finally {
            setLoading(false)
        }
    }

    const handleUnlink = async () => {
        if (!confirm('Are you sure you want to unlink this property?')) return
        try {
            const res = await fetch(`/api/leads/${leadId}/unlink-property`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to unlink property')
            toast.success('Property unlinked')
            fetchLeadData()
        } catch (error) {
            toast.error('Failed to unlink property')
        }
    }

    const handleSaveNotes = async () => {
        if (!leadId) {
            toast.error("Cannot save notes: Invalid lead ID")
            return
        }
        try {
            setSavingNotes(true)
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            })
            if (!res.ok) throw new Error('Failed to update notes')
            toast.success('Notes updated')
            setLead(prev => ({ ...prev, notes }))
        } catch (error) {
            toast.error('Failed to save notes')
        } finally {
            setSavingNotes(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                {/* Tabs Skeleton */}
                <Skeleton className="h-10 w-full" />
                {/* Content Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        )
    }

    if (!lead || !profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <p className="text-lg font-medium text-foreground mb-2">Lead not found</p>
                    {onClose && (
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col md:flex-row gap-6 ${isModal ? 'h-[80vh]' : ''}`}>
            {/* Sidebar - Sticky if not modal */}
            <div className={`w-full md:w-80 flex flex-col shrink-0 space-y-4 ${!isModal ? '' : 'overflow-y-auto'}`}>
                <LeadProfileSidebar
                    lead={lead}
                    profile={profile}
                    onEditProfile={() => setEditDialogOpen(true)}
                    onEditAvatar={() => setAvatarPickerOpen(true)}
                />
            </div>

            {/* Main Content */}
            <div className={`flex-1 min-w-0 ${isModal ? 'overflow-y-auto' : ''}`}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b bg-transparent mb-6">
                        <TabsList className="h-auto w-full justify-start bg-transparent p-0 space-x-8">
                            {['overview', 'notes', 'emails', 'timeline'].map(tab => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:text-primary !bg-transparent !shadow-none font-medium capitalize text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {activeTab === 'overview' && (
                        <LeadProfileOverview
                            lead={lead}
                            profile={profile}
                            organization={organization}
                            onUpdate={fetchLeadData}
                            onLinkProperty={() => setLinkDialogOpen(true)}
                            onUnlinkProperty={handleUnlink}
                        />
                    )}

                    {activeTab === 'notes' && (
                        <LeadProfileNotes
                            notes={notes}
                            setNotes={setNotes}
                            onSave={handleSaveNotes}
                            isSaving={savingNotes}
                        />
                    )}

                    {activeTab === 'emails' && (
                        <LeadProfileEmails />
                    )}

                    {activeTab === 'timeline' && (
                        <div className="max-w-3xl">
                            <LeadActivityTimeline leadId={leadId} />
                        </div>
                    )}
                </Tabs>
            </div>

            <EditLeadProfileDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                lead={lead}
                profile={profile}
                onSave={fetchLeadData}
            />

            <AvatarPickerDialog
                open={avatarPickerOpen}
                onOpenChange={setAvatarPickerOpen}
                lead={lead}
                onSave={fetchLeadData}
            />

            <LinkPropertyDialog
                lead={lead}
                isOpen={linkDialogOpen}
                onClose={() => setLinkDialogOpen(false)}
                onLinkSuccess={() => {
                    fetchLeadData()
                    toast.success('Property linked successfully')
                }}
            />
        </div>
    )
}
