'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LeadCard } from './LeadCard'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export function PipelineColumn({ stage, leads, onAddLead }) { // [MOD] Added onAddLead prop
    const { setNodeRef } = useDroppable({
        id: stage.id,
        data: { type: 'Stage', stage }
    })

    // Format stage name helper (optional color handling can be added here)
    const count = leads.length

    return (
        <div className="flex flex-col w-80 flex-shrink-0 h-full max-h-full">
            <div className="flex items-center justify-between px-2 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || '#cbd5e1' }} />
                    <h3 className="font-semibold text-slate-700">{stage.name}</h3>
                    <Badge variant="secondary" className="rounded-full px-2 text-xs font-normal">
                        {count}
                    </Badge>
                </div>
                <button
                    onClick={() => onAddLead(stage.id)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition"
                    title="Quick Add Lead"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 bg-slate-100/50 rounded-xl border border-slate-200/60 p-2 overflow-y-auto"
            >
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 min-h-[100px]">
                        {leads.map(lead => (
                            <LeadCard key={lead.id} lead={lead} />
                        ))}
                        {leads.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                                Drop leads here
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}
