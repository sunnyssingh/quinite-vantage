'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, ArrowLeft, Building2 } from 'lucide-react'
import PipelineBoard from '@/components/crm/PipelineBoard'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import LeadSourceDialog from '@/components/crm/LeadSourceDialog'

export default function ProjectPipelinePage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id

    // Board state
    const [isDealInitOpen, setIsDealInitOpen] = useState(false)
    const [project, setProject] = useState(null)
    const pipelineBoardRef = useRef(null)

    // Fetch project details for header
    useEffect(() => {
        if (!projectId) return
        fetch(`/api/projects?id=${projectId}`).then(res => res.json()).then(data => {
            // Assuming API returns { projects: [...] } or single project
            const found = data.projects?.find(p => p.id === projectId)
            if (found) setProject(found)
        })
    }, [projectId])

    const projectName = project?.name || 'Project'

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
                        {projectName} Pipeline
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground text-sm">
                            Manage deals and leads specifically for {projectName}
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
                <PipelineBoard ref={pipelineBoardRef} projectId={projectId} />
            </div>

            <LeadSourceDialog
                open={isDealInitOpen}
                onOpenChange={setIsDealInitOpen}
                projectId={projectId}
                // We pass current project as the only option to prevent confusion
                projects={project ? [project] : []}
            />
        </div>
    )
}
