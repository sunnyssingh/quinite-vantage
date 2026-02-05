'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Building2, Package, BarChart3, Edit } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ProjectMetrics from '@/components/projects/ProjectMetrics'
import ProjectInventoryTab from '@/components/projects/ProjectInventoryTab'
import VisualUnitGrid from '@/components/inventory/VisualUnitGrid'
import EditProjectModal from '@/components/inventory/EditProjectModal'

export default function InventoryProjectDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id

    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showEditModal, setShowEditModal] = useState(false)

    useEffect(() => {
        fetchProject()
    }, [projectId])

    const fetchProject = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/projects/${projectId}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch project')
            }

            setProject(data.project)
        } catch (error) {
            console.error('Fetch project error:', error)
            toast.error('Failed to load project details')
        } finally {
            setLoading(false)
        }
    }

    const handleMetricsUpdate = (updatedMetrics) => {
        // Update project metrics when property status changes
        setProject(prev => ({
            ...prev,
            ...updatedMetrics
        }))
    }

    const handleProjectUpdated = (updatedProject) => {
        setProject(updatedProject)
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Project Not Found</h3>
                <p className="text-sm text-muted-foreground mb-4">The project you're looking for doesn't exist</p>
                <Button onClick={() => router.push('/dashboard/admin/inventory')}>
                    Back to Inventory
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard/admin/inventory')}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                    {project.address && (
                        <p className="text-sm text-muted-foreground mt-1">{project.address}</p>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2"
                >
                    <Edit className="w-4 h-4" />
                    Edit Project
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="properties" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        List View
                    </TabsTrigger>
                    <TabsTrigger value="visual" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Visual View
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Project Details</h3>
                        {project.description && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                                <p className="text-sm text-foreground">{project.description}</p>
                            </div>
                        )}
                        {project.project_status && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                                <p className="text-sm text-foreground capitalize">{project.project_status.replace('_', ' ')}</p>
                            </div>
                        )}
                    </Card>

                    {/* Project Metrics */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Inventory Metrics</h3>
                        <ProjectMetrics project={project} />
                    </div>
                </TabsContent>

                {/* Properties Tab */}
                <TabsContent value="properties">
                    <ProjectInventoryTab
                        projectId={projectId}
                        project={project}
                        onMetricsUpdate={handleMetricsUpdate}
                    />
                </TabsContent>

                <TabsContent value="visual">
                    <Card className="p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-1">Visual Inventory</h3>
                            <p className="text-sm text-muted-foreground">Click on any unit to update its status.</p>
                        </div>
                        <VisualUnitGrid
                            projectId={projectId}
                            onMetricsUpdate={handleMetricsUpdate}
                        />
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Project Modal */}
            <EditProjectModal
                project={project}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onProjectUpdated={handleProjectUpdated}
            />
        </div>
    )
}

