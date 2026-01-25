'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, User } from 'lucide-react'

export function LeadCard({ lead }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id, data: { ...lead, type: 'Lead' } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg border-primary/50 ring-1 ring-primary' : ''}`}
        >
            <CardHeader className="p-3 pb-0 space-y-0">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-sm truncate" title={lead.name}>{lead.name}</h4>
                    {lead.call_status && (
                        <Badge variant={lead.call_status === 'completed' ? 'success' : 'secondary'} className="text-[10px] h-5 px-1.5">
                            {lead.call_status}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
                {lead.project && (
                    <Badge variant="outline" className="text-[10px] font-normal text-slate-500 bg-slate-50">
                        {lead.project.name}
                    </Badge>
                )}
                <div className="space-y-1 pt-1">
                    {lead.phone && (
                        <div className="flex items-center text-xs text-slate-500">
                            <Phone className="w-3 h-3 mr-1.5" />
                            {lead.phone}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
