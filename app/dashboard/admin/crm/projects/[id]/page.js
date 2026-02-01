import { redirect } from 'next/navigation'

export default async function ProjectPage({ params }) {
    const { id } = await params
    // Redirect to the campaigns list by default when identifying a project
    redirect(`/dashboard/admin/crm/projects/${id}/campaigns`)
}
