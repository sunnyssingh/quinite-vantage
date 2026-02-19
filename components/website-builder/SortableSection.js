import React, { memo, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical, Edit2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const SortableSection = memo(({ id, section, isEditing, onEdit, onDelete, onDuplicate, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const [hovered, setHovered] = useState(false)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                'relative group transition-all duration-150',
                isDragging ? 'opacity-40 z-50' : 'opacity-100',
                isEditing ? 'ring-2 ring-inset ring-blue-500' : ''
            )}
        >
            {/* Floating top action bar — shows on hover */}
            <div
                className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full z-30 flex items-center gap-px rounded-t-lg overflow-hidden shadow-lg transition-all duration-150',
                    (hovered || isEditing) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderBottom: 'none' }}
            >
                {/* Drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="flex items-center justify-center w-8 h-7 cursor-move text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-200" />

                {/* Section label */}
                <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 capitalize">
                    {section.type}
                </span>

                <div className="w-px h-4 bg-slate-200" />

                {/* Edit */}
                <button
                    onClick={() => onEdit(section.id)}
                    className="flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Edit section"
                >
                    <Edit2 className="w-3 h-3" />
                    Edit
                </button>

                {/* Duplicate */}
                <button
                    onClick={() => onDuplicate(section.id)}
                    className="flex items-center justify-center w-7 h-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Duplicate"
                >
                    <Copy className="w-3 h-3" />
                </button>

                {/* Delete */}
                <button
                    onClick={() => onDelete(section.id)}
                    className="flex items-center justify-center w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete section"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {/* Section content */}
            <div className={cn(
                'relative transition-all duration-150',
                isEditing ? 'brightness-[0.98]' : ''
            )}>
                {children}
            </div>

            {/* Left accent bar when selected */}
            {isEditing && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 z-20" />
            )}
        </div>
    )
}, (prev, next) => (
    prev.id === next.id &&
    prev.section === next.section &&
    prev.isEditing === next.isEditing
))

SortableSection.displayName = 'SortableSection'
export default SortableSection
