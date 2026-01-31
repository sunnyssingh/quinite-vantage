'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, Building, MapPin, TrendingUp, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import LeadProfileOverview from '@/components/crm/LeadProfileOverview'
import LeadActivityTimeline from '@/components/crm/LeadActivityTimeline'
import LeadTasksManager from '@/components/crm/LeadTasksManager'

export default function LeadProfilePage() {
    const params = useParams()
    const router = useRouter()
    const leadId = params.id

    const [lead, setLead] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchLeadData()
    }, [leadId])

    const fetchLeadData = async () => {
        try {
            setLoading(true)

            // Fetch lead basic info
            const leadRes = await fetch(`/api/leads/${leadId}`)
            if (!leadRes.ok) throw new Error('Failed to fetch lead')
            const leadData = await leadRes.json()
            setLead(leadData.lead)

            // Fetch lead profile
            const profileRes = await fetch(`/api/leads/${leadId}/profile`)
            if (!profileRes.ok) throw new Error('Failed to fetch profile')
            const profileData = await profileRes.json()
            setProfile(profileData.profile)

        } catch (error) {
            console.error('Error fetching lead data:', error)
            toast.error('Failed to load lead profile')
        } finally {
            setLoading(false)
        }
    }

    const getEngagementColor = (level) => {
        switch (level) {
            case 'hot': return 'bg-red-100 text-red-700 border-red-200'
            case 'warm': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getScoreColor = (score) => {
        if (score >= 75) return 'text-green-600'
        if (score >= 50) return 'text-yellow-600'
        if (score >= 25) return 'text-orange-600'
        return 'text-red-600'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading lead profile...</p>
                </div>
            </div>
        )
    }

    if (!lead || !profile) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-foreground mb-2">Lead not found</p>
                    <Button onClick={() => router.push('/dashboard/admin/crm/leads')}>
                        Back to Leads
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/10">
            {/* Header */}
            <div className="bg-background border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/dashboard/admin/crm/leads')}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {profile.company && `${profile.company} • `}
                                    {profile.job_title || 'Lead Profile'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Lead Score */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                <TrendingUp className={`w-4 h-4 ${getScoreColor(profile.lead_score || 0)}`} />
                                <span className={`text-sm font-semibold ${getScoreColor(profile.lead_score || 0)}`}>
                                    {profile.lead_score || 0}/100
                                </span>
                            </div>

                            {/* Engagement Level */}
                            <Badge className={getEngagementColor(profile.engagement_level || 'cold')}>
                                {(profile.engagement_level || 'cold').toUpperCase()}
                            </Badge>

                            {/* Quick Actions */}
                            <Button size="sm" variant="outline">
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                            </Button>
                            <Button size="sm" variant="outline">
                                <Phone className="w-4 h-4 mr-2" />
                                Call
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{lead.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Phone className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{lead.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Building className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Company</p>
                                        <p className="text-sm font-medium">{profile.company || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <MapPin className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p className="text-sm font-medium">{profile.location || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks & Follow-ups</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <LeadProfileOverview
                            lead={lead}
                            profile={profile}
                            onUpdate={fetchLeadData}
                        />
                    </TabsContent>

                    <TabsContent value="activity">
                        <LeadActivityTimeline leadId={leadId} />
                    </TabsContent>

                    <TabsContent value="tasks">
                        <LeadTasksManager leadId={leadId} />
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>Manage proposals, contracts, and other documents</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center py-8">Document management coming soon...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
