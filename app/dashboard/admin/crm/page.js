'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import PipelineBoard from '@/components/crm/PipelineBoard'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import LeadSourceDialog from '@/components/crm/LeadSourceDialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function CrmPipelinePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const projectId = searchParams.get('project_id')
    const [isDealInitOpen, setIsDealInitOpen] = useState(false)
    const [projects, setProjects] = useState([])
    const pipelineBoardRef = useRef(null)

    // Fetch projects for the dialog dropdown
    useEffect(() => {
        fetch('/api/projects').then(res => res.json()).then(data => {
            setProjects(data.projects || [])
        })
    }, [])

    const projectName = projects.find(p => p.id === projectId)?.name || 'Project'

    return (
        <div className="min-h-screen bg-muted/5">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 border-b border-border bg-background shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        {projectId ? `${projectName} Pipeline` : 'CRM Pipeline'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground text-sm">
                            {projectId ? `Manage deals for ${projectName}` : 'Manage pipelines, leads, and campaigns.'}
                        </p>
                        {!projectId ? (
                            <Select
                                value={projectId || ""}
                                onValueChange={(val) => {
                                    if (val) router.push(`/dashboard/admin/crm?project_id=${val}`)
                                }}
                            >
                                <SelectTrigger className="w-[200px] h-7 text-xs bg-background border-border/50">
                                    <SelectValue placeholder="Filter by Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => router.push('/dashboard/admin/crm')}
                                className="h-auto p-0 text-primary"
                            >
                                ← Show All
                            </Button>
                        )}
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
                projects={projects}
            />
        </div>
    )
}
