'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Building, MapPin, TrendingUp, X, Edit2, Save, Camera } from 'lucide-react'
import { toast } from 'react-hot-toast'
import LeadActivityTimeline from '@/components/crm/LeadActivityTimeline'
import ClientPreferencesCard from '@/components/crm/ClientPreferencesCard'
import PropertyDealsCard from '@/components/crm/PropertyDealsCard'
import ComingUpNextCard from '@/components/crm/ComingUpNextCard'
import BestTimeToContactCard from '@/components/crm/BestTimeToContactCard'
import SentimentAnalysisCard from '@/components/crm/SentimentAnalysisCard'
import { Textarea } from '@/components/ui/textarea'
import EditLeadProfileDialog from '@/components/crm/EditLeadProfileDialog'
import AvatarPickerDialog from '@/components/crm/AvatarPickerDialog'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

// Helper to get initials
const getInitials = (name) => {
    if (!name) return 'LP'
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export default function LeadProfileView({ leadId, onClose, isModal = false }) {
    const [lead, setLead] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [notes, setNotes] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

    useEffect(() => {
        if (lead?.notes) setNotes(lead.notes)
    }, [lead])

    const handleSaveNotes = async () => {
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

    useEffect(() => {
        if (leadId) {
            fetchLeadData()
        }
    }, [leadId])

    const [organization, setOrganization] = useState(null)

    const fetchLeadData = async () => {
        try {
            setLoading(true)

            // Fetch lead basic info (with cache-busting to ensure fresh data)
            const leadRes = await fetch(`/api/leads/${leadId}?t=${Date.now()}`, {
                cache: 'no-store'
            })
            if (!leadRes.ok) throw new Error('Failed to fetch lead')
            const leadData = await leadRes.json()
            console.log('Fetched lead data:', leadData.lead.avatar_url) // Debug log
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

            console.log('Lead data with call logs:', leadData.lead)

        } catch (error) {
            console.error('Error fetching lead data:', error)
            toast.error('Failed to load lead profile')
        } finally {
            setLoading(false)
        }
    }

    const getEngagementColor = (level) => {
        switch (level) {
            case 'hot': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'
            case 'warm': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900'
            case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900'
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-800'
        }
    }

    const getScoreColor = (score) => {
        if (score >= 75) return 'text-green-600 dark:text-green-400'
        if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
        if (score >= 25) return 'text-orange-600 dark:text-orange-400'
        return 'text-red-600 dark:text-red-400'
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
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div
                        className="h-28 w-full"
                        style={{
                            background: 'linear-gradient(to right, #ffffff, #e1f5fe, #b3e5fc)'
                        }}
                    />

                    <div className="flex flex-col items-center text-center px-6 -mt-12 mb-6">
                        <div className="relative mb-3 group">
                            <Avatar key={lead.avatar_url || 'no-avatar'} className="h-24 w-24 border-4 border-background shadow-md">
                                {lead.avatar_url ? (
                                    <img
                                        src={lead.avatar_url}
                                        alt={lead.name}
                                        className="aspect-square h-full w-full object-cover"
                                        onError={(e) => {
                                            console.error('Avatar failed to load:', lead.avatar_url)
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                ) : null}
                                <AvatarFallback className="text-2xl font-bold bg-white text-primary">
                                    {getInitials(lead.name)}
                                </AvatarFallback>
                            </Avatar>
                            {/* Edit Avatar Overlay */}
                            <button
                                onClick={() => setAvatarPickerOpen(true)}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                aria-label="Change avatar"
                            >
                                <Camera className="w-6 h-6 text-white" />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                        <p className="text-sm text-gray-500">{profile.company || 'No Company'}</p>
                    </div>

                    <div className="px-6 pb-6 flex flex-col flex-1 gap-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900 truncate" title={lead.email}>{lead.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900 truncate">{lead.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="font-medium text-gray-900 truncate">{lead.department || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Location</h3>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 pt-1">
                                    <p className="font-medium text-gray-900 leading-snug">
                                        {[
                                            profile.mailing_city,
                                            profile.mailing_state,
                                            profile.mailing_country
                                        ].filter(Boolean).join(', ') || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        {[profile.mailing_street, profile.mailing_zip].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full rounded-lg border-dashed border-gray-300 hover:border-primary hover:text-primary transition-colors mt-auto" onClick={() => setEditDialogOpen(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    </div>
                </div>
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
                                    className="rounded-none border-b-2 border-transparent px-0 py-2.5 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent font-medium capitalize text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-12 gap-6">
                                {/* Properties Card */}
                                <div className="col-span-12 md:col-span-4">
                                    <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                                    <Building className="w-4 h-4" />
                                                </div>
                                                <CardTitle className="text-sm font-semibold text-gray-900">Properties</CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium">
                                                {(lead.projects?.length || (lead.project ? 1 : 0))}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent>
                                            {(lead.projects || (lead.project ? [lead.project] : [])).length > 0 ? (
                                                <div className="max-h-[350px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                                                    {(lead.projects || [lead.project]).map((project, index) => (
                                                        <div key={index} className="group flex items-start gap-3 p-2 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer">
                                                            {/* Small Thumbnail */}
                                                            <div className="h-14 w-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                                                                {project.image_url ? (
                                                                    <img
                                                                        src={project.image_url}
                                                                        alt={project.name}
                                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                        onError={(e) => e.target.style.display = 'none'}
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full text-slate-400">
                                                                        <Building className="w-5 h-5 opacity-40" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Details */}
                                                            <div className="flex-1 min-w-0 py-0.5">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <h4 className="font-semibold text-sm text-slate-900 leading-tight truncate">{project.name}</h4>
                                                                    {project.project_type && (
                                                                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                                            {project.project_type}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {project.address && (
                                                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                                        <MapPin className="w-3 h-3 shrink-0 opacity-70" />
                                                                        <span className="truncate">{project.address}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-gray-50/50">
                                                    <Building className="w-8 h-8 mb-2 opacity-20" />
                                                    <p className="text-sm">No properties linked</p>
                                                    <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-primary">Link Property</Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Client Preferences - Spans 8 cols */}
                                <div className="col-span-12 md:col-span-8">
                                    <ClientPreferencesCard
                                        profile={profile}
                                        leadId={leadId}
                                        onUpdate={fetchLeadData}
                                        currency={organization?.currency || 'USD'}
                                    />
                                </div>
                            </div>

                            {/* Secondary Row */}
                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-4">
                                    <PropertyDealsCard deals={lead.deals || []} />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <ComingUpNextCard leadId={leadId} />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <BestTimeToContactCard
                                        profile={profile}
                                        leadId={leadId}
                                        onUpdate={fetchLeadData}
                                    />
                                </div>
                            </div>

                            {/* Sentiment */}
                            <div>
                                <SentimentAnalysisCard callLogs={lead.call_logs || []} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                                <CardDescription>Internal notes and remarks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[200px] resize-none text-base p-4 focus-visible:ring-1 focus-visible:ring-primary/20"
                                    placeholder="Start typing..."
                                />
                                <div className="flex justify-end mt-4">
                                    <Button onClick={handleSaveNotes} disabled={savingNotes} size="sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'emails' && (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground bg-gray-50/50 rounded-xl border-2 border-dashed">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Mail className="w-8 h-8 text-primary/60" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Connect Email</h3>
                            <p className="max-w-xs text-center mt-2 text-sm">Sync your email to see all communications in one place.</p>
                            <Button variant="outline" className="mt-6">Integrate Now</Button>
                        </div>
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
        </div>
    )
}
