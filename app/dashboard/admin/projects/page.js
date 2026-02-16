'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PermissionGate } from '@/components/permissions/PermissionGate'
import Link from 'next/link'

export default function ProjectsPage() {
    return (
        <PermissionGate
            feature="view_projects"
            fallbackMessage="You do not have permission to view projects."
        >
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projects</h1>
                        <p className="text-muted-foreground mt-1">Manage your organization's projects and campaigns</p>
                    </div>
                    <PermissionGate feature="create_projects">
                        <Link href="/dashboard/admin/crm/projects">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Go to CRM Projects
                            </Button>
                        </Link>
                    </PermissionGate>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Projects Overview</CardTitle>
                        <CardDescription>
                            This page is a placeholder for the high-level projects overview.
                            Please use the CRM Projects section for detailed management.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p>Full project management is available in the CRM section.</p>
                            <Link href="/dashboard/admin/crm/projects" className="mt-4 text-primary hover:underline">
                                Go to CRM Projects &rarr;
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PermissionGate>
    )
}
