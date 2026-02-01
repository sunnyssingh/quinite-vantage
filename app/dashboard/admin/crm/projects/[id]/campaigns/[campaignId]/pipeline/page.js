'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, ArrowLeft, Building2 } from 'lucide-react'
import PipelineBoard from '@/components/crm/PipelineBoard'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import LeadSourceDialog from '@/components/crm/LeadSourceDialog'

import { createClient } from '@/lib/supabase/client'

export default function CampaignPipelinePage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id
    const campaignId = params.campaignId
    const supabase = createClient()

    // Board state
    const [isDealInitOpen, setIsDealInitOpen] = useState(false)
    const [campaignName, setCampaignName] = useState('Campaign')
    const [projectName, setProjectName] = useState('Project')
    const pipelineBoardRef = useRef(null)

    // Fetch details
    useEffect(() => {
        const fetchDetails = async () => {
            // 1. Fetch Project Name
            try {
                const res = await fetch(`/api/projects?id=${projectId}`)
                const data = await res.json()
                const found = data.projects?.find(p => p.id === projectId)
                if (found) setProjectName(found.name)
            } catch (e) {
                console.error('Failed to fetch project name:', e)
            }

            // 2. Fetch Campaign Name (via API to ensure RLS compliance)
            if (campaignId) {
                try {
                    const res = await fetch(`/api/campaigns/${campaignId}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (data.campaign) setCampaignName(data.campaign.name)
                    }
                } catch (e) {
                    console.error('Failed to fetch campaign name:', e)
                }
            }
        }
        fetchDetails()
    }, [projectId, campaignId])

    return (
        <div className="min-h-screen bg-muted/5">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 border-b border-border bg-background shadow-sm">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2 pl-0 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/dashboard/admin/crm/projects/${projectId}/campaigns`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Campaigns
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-foreground" />
                        {campaignName} Pipeline
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground text-sm">
                            Manage deals and leads specifically for <span className="underline decoration-blue-500/50 decoration-2 underline-offset-4">{projectName}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            pipelineBoardRef.current?.refresh()
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9 border-dashed"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sync
                    </Button>

                    <Button
                        onClick={() => setIsDealInitOpen(true)}
                        className="gap-2 h-9 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Deal
                    </Button>
                </div>
            </div>

            {/* Board */}
            <div className="p-6">
                <PipelineBoard
                    ref={pipelineBoardRef}
                    projectId={projectId}
                    campaignId={campaignId}
                />
            </div>

            <LeadSourceDialog
                open={isDealInitOpen}
                onOpenChange={setIsDealInitOpen}
                projectId={projectId}
                // We pass current project as the only option
                projects={[{ id: projectId, name: projectName }]} // Simplified since we don't have full object if fetch fails, but 'project' state above would satisfy if we used it.
            // Actually let's use the fetched project state if we had it.
            />
        </div>
    )
}
