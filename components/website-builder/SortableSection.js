'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SortableSection({ id, section, onEdit, onDelete, children }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative border rounded-xl bg-white shadow-sm hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-primary z-50' : 'border-slate-200'}`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-move text-slate-400 hover:text-slate-600 border-r border-slate-100 hover:bg-slate-50 rounded-l-xl z-20"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Content Area */}
            <div className="pl-8 p-4 min-h-[100px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{section.type} Section</span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(section)}>
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => onDelete(section.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Render the actual section preview */}
                <div className="pointer-events-none opacity-80 zoom-[0.8] origin-top-left w-full overflow-hidden relative">
                    {children}
                </div>
            </div>
        </div>
    )
}
