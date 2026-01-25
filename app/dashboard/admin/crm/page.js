'use client'

import { Button } from '@/components/ui/button'
import { Filter, Plus, List, Megaphone, KanbanSquare, RefreshCw } from 'lucide-react'
import PipelineBoard from '@/components/crm/PipelineBoard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { useState, useEffect, useRef } from 'react'
import LeadSourceDialog from '@/components/crm/LeadSourceDialog'

export default function CrmPipelinePage() {
    const searchParams = useSearchParams()
    const router = useRouter() // [NEW]
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
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 border-b bg-white">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        {projectId ? `${projectName} Pipeline` : 'CRM Pipeline'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-600 text-sm">
                            {projectId ? `Manage deals for ${projectName}` : 'Manage pipelines, leads, and AI campaigns.'}
                        </p>
                        {!projectId ? (
                            <select
                                className="text-sm border-slate-300 rounded-md px-2 py-1 bg-white focus:ring-purple-500 focus:border-purple-500 ml-2"
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val) router.push(`/dashboard/admin/crm?project_id=${val}`)
                                }}
                            >
                                <option value="">Select Project to View</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard/admin/crm')}
                                className="ml-2 text-slate-500 hover:text-slate-900 h-7 text-xs"
                            >
                                ← Back to All
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">


                    <Button
                        onClick={() => {
                            console.log('🔄 [CRM Page] Refresh button clicked')
                            pipelineBoardRef.current?.refresh()
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>

                    <Button
                        onClick={() => setIsDealInitOpen(true)} // [MOD] Open dialog
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Deal
                    </Button>
                </div>
            </div>

            {/* Module Navigation (Tabs Removed) */}
            <div className="flex-1 min-h-0 bg-slate-50/50 p-4">
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
