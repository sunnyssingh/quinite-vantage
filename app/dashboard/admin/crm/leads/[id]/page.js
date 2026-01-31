'use client'

import { useParams, useRouter } from 'next/navigation'
import LeadProfileView from '@/components/crm/LeadProfileViewNew'

export default function LeadProfilePage() {
    const params = useParams()
    const router = useRouter()
    const leadId = params.id

    return (
        <LeadProfileView
            leadId={leadId}
            onClose={() => router.push('/dashboard/admin/crm/leads')}
        />
    )
}
