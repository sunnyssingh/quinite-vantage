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
                        value={projectId || "all"}
                        onValueChange={(val) => {
                            if (val === "all") router.push('/dashboard/admin/crm')
                            else router.push(`/dashboard/admin/crm?project_id=${val}`)
                        }}
                    >
                        <SelectTrigger className="w-[240px] h-9 bg-background border-border/50 shadow-sm">
                            <SelectValue placeholder="Filter by Project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium text-primary">
                                All Projects
                            </SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={() => {
                            pipelineBoardRef.current?.refresh()
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9 border-dashed"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Sync</span>
                    </Button>

                    <Button
                        onClick={() => setIsDealInitOpen(true)}
                        className="gap-2 h-9 text-sm font-medium shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Deal
                    </Button>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto p-6">
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
