import { redirect } from 'next/navigation'

export default async function CampaignPage({ params }) {
    const { id, campaignId } = await params
    // Redirect to the pipeline page by default when clicking the campaign breadcrumb
    redirect(`/dashboard/admin/crm/projects/${id}/campaigns/${campaignId}/pipeline`)
}
