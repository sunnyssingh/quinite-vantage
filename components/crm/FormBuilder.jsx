import { useState, useEffect } from 'react'
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GripVertical, Trash2, Smartphone, Type, Mail, CheckSquare, AlignLeft, Calendar, Hash, Link as LinkIcon, List, Disc, Heading, Plus, X, Monitor, Copy, Check } from 'lucide-react'
import { nanoid } from 'nanoid'

// Expanded Field Types
const FIELD_TYPES = [
    { type: 'text', label: 'Short Text', icon: Type },
    { type: 'textarea', label: 'Long Text', icon: AlignLeft },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Smartphone },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'url', label: 'Website', icon: LinkIcon },
    { type: 'select', label: 'Dropdown', icon: List, hasOptions: true },
    { type: 'radio', label: 'Radio Group', icon: Disc, hasOptions: true },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'header', label: 'Section Header', icon: Heading, isStatic: true },
]

export default function FormBuilder({ projectId }) {
    const [fields, setFields] = useState([
        // Pre-populate with mandatory fields
        {
            id: nanoid(),
            type: 'text',
            label: 'Full Name',
            placeholder: 'Ravi Sastri',
            required: true,
            isStatic: false
        },
        {
            id: nanoid(),
            type: 'phone',
            label: 'Phone Number',
            placeholder: '+918866066069',
            required: true,
            isStatic: false
        }
    ])
    const [activeDragItem, setActiveDragItem] = useState(null)
    const [selectedField, setSelectedField] = useState(null)
    const [formName, setFormName] = useState('New Lead Form')
    const [saving, setSaving] = useState(false)
    const [shareUrl, setShareUrl] = useState(null)
    const [isMobile, setIsMobile] = useState(false)
    const [copied, setCopied] = useState(false)

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
            setIsMobile(mobile)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleCopy = () => {
        if (!shareUrl) return
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Show mobile message if on mobile
    if (isMobile) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Monitor className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">Desktop Required</h3>
                    <p className="text-slate-600">
                        The Form Builder requires a desktop or laptop computer for the best experience.
                        Please switch to a larger screen to create and edit forms.
                    </p>
                    <p className="text-sm text-slate-500">
                        Minimum screen width: 768px
                    </p>
                </div>
            </div>
        )
    }

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
                const typeData = active.data.current
                const newField = {
                    id: nanoid(),
                    type: typeData.type,
                    label: `New ${typeData.label}`,
                    placeholder: '',
                    required: false,
                    isStatic: typeData.isStatic || false,
                    options: typeData.hasOptions ? ['Option 1', 'Option 2', 'Option 3'] : undefined
                }
                setFields([...fields, newField])
                setSelectedField(newField)
            }
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

    const handleAddOption = () => {
        if (!selectedField?.options) return
        const newOptions = [...selectedField.options, `Option ${selectedField.options.length + 1}`]
        updateField(selectedField.id, 'options', newOptions)
    }

    const handleRemoveOption = (index) => {
        if (!selectedField?.options) return
        const newOptions = selectedField.options.filter((_, i) => i !== index)
        updateField(selectedField.id, 'options', newOptions)
    }

    const handleOptionChange = (index, value) => {
        if (!selectedField?.options) return
        const newOptions = [...selectedField.options]
        newOptions[index] = value
        updateField(selectedField.id, 'options', newOptions)
    }

    const handleSave = async () => {
        if (fields.length === 0) {
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    schema: fields,
                    projectId: projectId || 'none'
                })
            })

            const data = await res.json()
            if (res.ok) {
                const url = `${window.location.origin}/forms/${data.form.id}`
                setShareUrl(url)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full gap-3">
                {/* Compact Header Controls */}
                <div className="flex items-center justify-between gap-3 px-1">
                    <Input
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Form Name"
                        className="h-9 max-w-xs font-medium text-sm"
                    />
                    <div className="flex items-center gap-2">
                        {shareUrl && (
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-xs border border-green-200">
                                <span className="font-medium">Link:</span>
                                <a href={shareUrl} target="_blank" className="underline hover:text-green-800 max-w-[200px] truncate">
                                    {shareUrl}
                                </a>
                                <div className="h-4 w-px bg-green-200 mx-1" />
                                <button
                                    onClick={handleCopy}
                                    className="p-1 hover:bg-green-100 rounded-sm transition-colors text-green-700 hover:text-green-800"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        )}
                        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9">
                            {saving ? 'Saving...' : 'Save & Get Link'}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 border rounded-lg overflow-hidden bg-white min-h-0">
                    {/* 1. Toolbox (Left) - Narrower */}
                    <div className="w-48 border-r bg-slate-50 p-3 flex flex-col gap-2 overflow-y-auto">
                        <h3 className="font-semibold text-xs text-slate-500 mb-1">Form Elements</h3>
                        <div className="grid grid-cols-2 gap-1.5">
                            {FIELD_TYPES.map(ft => (
                                <DraggableToolboxItem key={ft.type} type={ft} />
                            ))}
                        </div>
                    </div>

                    {/* 2. Canvas (Center) - More space */}
                    <div className="flex-1 bg-slate-100 p-4 overflow-y-auto">
                        <FormCanvas fields={fields} onSelect={setSelectedField} selectedId={selectedField?.id} onRemove={removeField} />
                    </div>

                    {/* 3. Properties (Right) - Only show when field selected */}
                    {selectedField ? (
                        <div className="w-64 border-l bg-white p-3 overflow-y-auto">
                            <h3 className="font-semibold text-base mb-3">Properties</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Label / Heading</Label>
                                    <Input
                                        value={selectedField.label}
                                        onChange={e => updateField(selectedField.id, 'label', e.target.value)}
                                    />
                                </div>

                                {!selectedField.isStatic && selectedField.type !== 'checkbox' && selectedField.type !== 'select' && selectedField.type !== 'radio' && (
                                    <div className="space-y-2">
                                        <Label>Placeholder</Label>
                                        <Input
                                            value={selectedField.placeholder}
                                            onChange={e => updateField(selectedField.id, 'placeholder', e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Options Editor */}
                                {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Options</Label>
                                            <Button variant="ghost" size="sm" onClick={handleAddOption} className="h-6 text-xs gap-1">
                                                <Plus className="w-3 h-3" /> Add
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedField.options?.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded-full text-[10px] text-slate-500">{i + 1}</div>
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleRemoveOption(i)}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!selectedField.isStatic && (
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <Label>Required Field</Label>
                                        <Switch
                                            checked={selectedField.required}
                                            onCheckedChange={c => updateField(selectedField.id, 'required', c)}
                                        />
                                    </div>
                                )}

                                <Button variant="destructive" className="w-full mt-8" onClick={() => removeField(selectedField.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <DragOverlay>
                    {activeDragItem ? (
                        <div className="p-2 bg-white border-2 border-blue-500 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium cursor-grabbing">
                            <activeDragItem.icon className="w-4 h-4 text-blue-600" />
                            {activeDragItem.label}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
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
            className="p-2 bg-white border rounded shadow-sm hover:shadow-md cursor-grab flex flex-col items-center gap-1.5 transition-all text-center h-20 justify-center"
        >
            <type.icon className="w-5 h-5 text-slate-500" />
            <span className="text-[10px] font-medium text-slate-700 leading-tight">{type.label}</span>
        </div>
    )
}

function FormCanvas({ fields, onSelect, selectedId, onRemove }) {
    const { setNodeRef } = useDroppable({
        id: 'canvas'
    })

    return (
        <div ref={setNodeRef} className="max-w-xl mx-auto min-h-[600px] bg-white rounded-xl shadow-sm border p-6 space-y-4">
            {fields.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-lg p-16">
                    <p>Drag form elements here</p>
                </div>
            ) : (
                fields.map((field) => (
                    <div
                        key={field.id}
                        onClick={() => onSelect(field)}
                        className={`group relative p-3 rounded border-2 border-transparent hover:border-blue-100 cursor-pointer transition-all ${selectedId === field.id ? 'border-blue-500 bg-blue-50/50' : ''}`}
                    >
                        <div className="space-y-2 pointer-events-none">
                            {field.type === 'header' ? (
                                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">{field.label}</h2>
                            ) : (
                                <Label className="text-sm font-medium text-slate-700">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </Label>
                            )}

                            {/* Previews */}
                            {field.type === 'textarea' ? (
                                <div className="h-24 w-full bg-slate-50 border rounded-md p-3 text-sm text-slate-400">Long text input area...</div>
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border rounded bg-slate-50" />
                                    <span className="text-sm text-slate-500">I agree / Confirm selection</span>
                                </div>
                            ) : field.type === 'select' ? (
                                <div className="h-10 w-full bg-slate-50 border rounded-md px-3 flex items-center justify-between text-sm text-slate-500">
                                    <span>Select an option</span>
                                    <List className="w-4 h-4 opacity-50" />
                                </div>
                            ) : field.type === 'radio' ? (
                                <div className="space-y-2">
                                    {field.options?.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border bg-slate-50" />
                                            <span className="text-sm text-slate-600">{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : field.type !== 'header' && (
                                <div className="h-10 w-full bg-slate-50 border rounded-md px-3 flex items-center text-sm text-slate-400">
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
