'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LeadCard } from './LeadCard'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PipelineColumn({ stage, leads, onAddLead }) {
    const { setNodeRef } = useDroppable({
        id: stage.id,
        data: { type: 'Stage', stage }
    })

    const count = leads.length

    return (
        <div className="flex flex-col w-80 flex-shrink-0 min-h-[calc(100vh-300px)]">
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2 mb-3 bg-card border border-border rounded-lg shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-3 h-3 rounded-full ring-2 ring-background shadow-sm"
                        style={{ backgroundColor: stage.color || '#a1a1aa' }}
                    />
                    <h3 className="font-semibold text-foreground text-sm tracking-tight">
                        {stage.name}
                    </h3>
                    <Badge
                        variant="secondary"
                        className="rounded-full px-2 text-[10px] font-semibold bg-primary/10 text-primary border-0 h-5"
                    >
                        {count}
                    </Badge>
                </div>
                <Button
                    onClick={() => onAddLead(stage.id)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Quick Add Lead"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className="flex-1 bg-muted/20 rounded-xl border-2 border-dashed border-border/50 p-3 overflow-y-auto scrollbar-hide"
            >
                <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 min-h-[200px]">
                        {leads.map(lead => (
                            <LeadCard key={lead.id} lead={lead} />
                        ))}
                        {leads.length === 0 && (
                            <div className="h-32 border-2 border-dashed border-border/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground text-xs bg-background/50">
                                <Plus className="w-5 h-5 mb-2 opacity-30" />
                                <span>Drop leads here</span>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}
