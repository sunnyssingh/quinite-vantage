'use client'

import ComingUpNextCard from './ComingUpNextCard'
import BestTimeToContactCard from './BestTimeToContactCard'
import SentimentAnalysisCard from './SentimentAnalysisCard'
import ClientPreferencesCard from './ClientPreferencesCard'
import AiInsightsCard from './AiInsightsCard'
import DealsOverviewCard from './DealsOverviewCard'

export default function LeadProfileOverview({
    lead,
    organization,
    onUpdate,
    onViewAllTasks,
    onViewAllDeals,
}) {
    const leadId = lead.id

    return (
        <div className="space-y-6">
            {/* Row 1: Deals + Client Preferences */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-5">
                    <DealsOverviewCard
                        leadId={leadId}
                        onViewAllDeals={onViewAllDeals}
                    />
                </div>
                <div className="col-span-12 md:col-span-7">
                    <ClientPreferencesCard
                        lead={lead}
                        leadId={leadId}
                        onUpdate={onUpdate}
                        currency={organization?.currency || 'USD'}
                    />
                </div>
            </div>

            {/* Row 2: Tasks + Best Time to Contact */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-6">
                    <ComingUpNextCard 
                        leadId={leadId} 
                        leadName={lead?.name}
                        onShowAll={onViewAllTasks}
                    />
                </div>
                <div className="col-span-12 md:col-span-6">
                    <BestTimeToContactCard
                        lead={lead}
                        leadId={leadId}
                        onUpdate={onUpdate}
                    />
                </div>
            </div>

            {/* Row 3: Sentiment + AI Insights */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-6">
                    <SentimentAnalysisCard callLogs={lead.call_logs || []} />
                </div>
                <div className="col-span-12 md:col-span-6">
                    <AiInsightsCard lead={lead} />
                </div>
            </div>
        </div>
    )
}
