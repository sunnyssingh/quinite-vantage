'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import PipelineBoard from '@/components/crm/PipelineBoard'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { PermissionGate } from '@/components/permissions/PermissionGate'
import LeadSourceDialog from '@/components/crm/LeadSourceDialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function CrmPipelineContent() {
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



    return (
        <div className="min-h-screen bg-muted/5 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border bg-background sticky top-0 z-10">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        CRM Pipeline
                    </h1>

                    <PermissionGate permission="create_leads">
                        <Button
                            onClick={() => setIsDealInitOpen(true)}
                            className="w-auto"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">New Lead</span>
                            <span className="sm:hidden">New</span>
                        </Button>
                    </PermissionGate>
                </div>

                {/* Filter Card */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex gap-2">
                        <Select
                            value={projectId || 'all'}
                            onValueChange={(val) => {
                                const params = new URLSearchParams(searchParams.toString())
                                if (val === 'all') {
                                    params.delete('project_id')
                                } else {
                                    params.set('project_id', val)
                                }
                                router.push(`?${params.toString()}`)
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => pipelineBoardRef.current?.refresh()}
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Pipeline Board */}
            <div className="flex-1 p-6 overflow-x-auto">
                <PipelineBoard
                    ref={pipelineBoardRef}
                    projectId={projectId}
                />
            </div>

            {/* Lead Source Dialog */}
            <LeadSourceDialog
                open={isDealInitOpen}
                onOpenChange={setIsDealInitOpen}
                projects={projects}
                initialProjectId={projectId}
            />
        </div>
    )
}

export default function CrmPipelinePage() {
    return (
        <Suspense fallback={<div className="p-6">Loading...</div>}>
            <CrmPipelineContent />
        </Suspense>
    )
}
