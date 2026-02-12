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
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 border-b border-border bg-background shadow-sm sticky top-0 z-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        CRM Pipeline
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage your deal flow, track progress, and organize leads across all projects.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Project Filter */}
                    <Select
                        value={projectId || 'all'}
                        onValueChange={(val) => {
                            if (val === 'all') {
                                router.push('/dashboard/admin/crm')
                            } else {
                                router.push(`/dashboard/admin/crm?project_id=${val}`)
                            }
                        }}
                    >
                        <SelectTrigger className="w-[200px] h-9 bg-background border-border/50">
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
                        variant="outline"
                        size="sm"
                        onClick={() => pipelineBoardRef.current?.refresh()}
                        className="gap-2 h-9 border-dashed"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Sync
                    </Button>

                    <PermissionGate permission="create_leads">
                        <Button
                            onClick={() => setIsDealInitOpen(true)}
                            className="gap-2 h-9 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Deal
                        </Button>
                    </PermissionGate>
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
