import { useState } from 'react'
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Trash2, Smartphone, Type, Mail, CheckSquare, AlignLeft } from 'lucide-react'
import { nanoid } from 'nanoid'

// Field Types
const FIELD_TYPES = [
    { type: 'text', label: 'Short Text', icon: Type },
    { type: 'textarea', label: 'Long Text', icon: AlignLeft },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Smartphone },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
]

export default function FormBuilder() {
    const [fields, setFields] = useState([])
    const [activeDragItem, setActiveDragItem] = useState(null)
    const [selectedField, setSelectedField] = useState(null)

    // DND Handlers
    const handleDragStart = (e) => {
        const { active } = e
        setActiveDragItem(active.data.current)
    }

    const handleDragEnd = (e) => {
        const { active, over } = e
        setActiveDragItem(null)

        if (!over) return

        if (active.data.current.isToolboxItem) {
            // Adding new item
            if (over.id === 'canvas' || fields.find(f => f.id === over.id)) {
                const newField = {
                    id: nanoid(),
                    type: active.data.current.type,
                    label: `New ${active.data.current.label}`,
                    placeholder: '',
                    required: false
                }
                setFields([...fields, newField])
                setSelectedField(newField)
            }
        } else {
            // Reordering logic (simplified for now - just append if dropped on canvas)
            // Real reordering requires arrayMove from dnd-kit/sortable which is imported
        }
    }

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id))
        if (selectedField?.id === id) setSelectedField(null)
    }

    const updateField = (id, key, value) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f))
        if (selectedField?.id === id) {
            setSelectedField({ ...selectedField, [key]: value })
        }
    }

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full border rounded-lg overflow-hidden bg-white">
                {/* 1. Toolbox (Left) */}
                <div className="w-64 border-r bg-slate-50 p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-sm text-slate-500 mb-2">Form Elements</h3>
                    {FIELD_TYPES.map(ft => (
                        <DraggableToolboxItem key={ft.type} type={ft} />
                    ))}
                </div>

                {/* 2. Canvas (Center) */}
                <div className="flex-1 bg-slate-100 p-8 overflow-y-auto">
                    <FormCanvas fields={fields} onSelect={setSelectedField} selectedId={selectedField?.id} onRemove={removeField} />
                </div>

                {/* 3. Properties (Right) */}
                {selectedField ? (
                    <div className="w-72 border-l bg-white p-4">
                        <h3 className="font-semibold text-lg mb-4">Properties</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={selectedField.label}
                                    onChange={e => updateField(selectedField.id, 'label', e.target.value)}
                                />
                            </div>
                            {selectedField.type !== 'checkbox' && (
                                <div className="space-y-2">
                                    <Label>Placeholder</Label>
                                    <Input
                                        value={selectedField.placeholder}
                                        onChange={e => updateField(selectedField.id, 'placeholder', e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-2">
                                <Label>Required</Label>
                                <Switch
                                    checked={selectedField.required}
                                    onCheckedChange={c => updateField(selectedField.id, 'required', c)}
                                />
                            </div>
                            <Button variant="destructive" className="w-full mt-8" onClick={() => removeField(selectedField.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="w-72 border-l bg-white p-4 flex items-center justify-center text-slate-400 text-sm">
                        Select a field to edit properties
                    </div>
                )}
            </div>

            <DragOverlay>
                {activeDragItem ? (
                    <div className="p-3 bg-white border rounded shadow flex items-center gap-2 w-48">
                        <activeDragItem.icon className="w-4 h-4" />
                        {activeDragItem.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

function DraggableToolboxItem({ type }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `toolbox-${type.type}`,
        data: { ...type, isToolboxItem: true }
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="p-3 bg-white border rounded shadow-sm hover:shadow-md cursor-grab flex items-center gap-2 transition-all"
        >
            <type.icon className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium">{type.label}</span>
        </div>
    )
}

function FormCanvas({ fields, onSelect, selectedId, onRemove }) {
    const { setNodeRef } = useDroppable({
        id: 'canvas'
    })

    return (
        <div ref={setNodeRef} className="max-w-md mx-auto min-h-[500px] bg-white rounded-xl shadow-sm border p-6 space-y-4">
            {fields.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-lg p-10">
                    <p>Drag elements here</p>
                </div>
            ) : (
                fields.map((field) => (
                    <div
                        key={field.id}
                        onClick={() => onSelect(field)}
                        className={`group relative p-3 rounded border-2 border-transparent hover:border-blue-100 cursor-pointer ${selectedId === field.id ? 'border-blue-500 bg-blue-50/50' : ''}`}
                    >
                        <div className="space-y-1.5 pointer-events-none">
                            <Label className="pointer-events-none">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            {field.type === 'textarea' ? (
                                <div className="h-20 w-full bg-slate-50 border rounded p-2 text-xs text-slate-400">Long Text Area</div>
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border rounded bg-slate-50" />
                                    <span className="text-sm text-slate-500">Option</span>
                                </div>
                            ) : (
                                <div className="h-9 w-full bg-slate-50 border rounded px-3 py-2 text-xs text-slate-400">
                                    {field.placeholder || `Enter ${field.label}`}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
