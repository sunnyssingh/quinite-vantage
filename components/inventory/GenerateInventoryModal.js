'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Loader2, Layers, Building } from 'lucide-react'

export default function GenerateInventoryModal({ project, unitTypes, isOpen, onClose, onGenerated }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        blockName: 'A',
        startFloor: '1',
        endFloor: '10',
        unitsPerFloor: '4',
        unitType: unitTypes?.[0]?.configuration || '3BHK'
    })

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/projects/${project.id}/generate-inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    configurations: unitTypes, // Pass all configs to look up details
                    namingPattern: '{block}-{floor}{unit}'
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Generation failed')

            toast.success(data.message || 'Inventory generated successfully')
            if (onGenerated) onGenerated()
            onClose()
        } catch (error) {
            console.error('Generation error', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Preview generation count
    const totalUnits = (parseInt(formData.endFloor) - parseInt(formData.startFloor) + 1) * parseInt(formData.unitsPerFloor)
    const previewNameStart = `${formData.blockName}-${formData.startFloor}01`
    const previewNameEnd = `${formData.blockName}-${formData.endFloor}${formData.unitsPerFloor.toString().padStart(2, '0')}`

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bulk Generate Inventory</DialogTitle>
                    <DialogDescription>
                        Automatically create unit listings for block/tower <strong>{formData.blockName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Block / Tower Name</Label>
                            <Input
                                value={formData.blockName}
                                onChange={e => setFormData({ ...formData, blockName: e.target.value })}
                                placeholder="e.g. A, B, Tower 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit Configuration</Label>
                            <Select
                                value={formData.unitType}
                                onValueChange={v => setFormData({ ...formData, unitType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unitTypes.map((u, i) => (
                                        <SelectItem key={i} value={u.configuration || u.type}>
                                            {u.configuration} {u.property_type} ({u.carpet_area} sqft)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Start Floor</Label>
                            <Input
                                type="number"
                                value={formData.startFloor}
                                onChange={e => setFormData({ ...formData, startFloor: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Floor</Label>
                            <Input
                                type="number"
                                value={formData.endFloor}
                                onChange={e => setFormData({ ...formData, endFloor: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Units/Floor</Label>
                            <Input
                                type="number"
                                value={formData.unitsPerFloor}
                                onChange={e => setFormData({ ...formData, unitsPerFloor: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border text-sm text-slate-600 flex flex-col gap-1">
                        <div className="flex justify-between font-medium">
                            <span>Total Units to Create:</span>
                            <span className="text-blue-600">{isNaN(totalUnits) ? 0 : totalUnits}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Naming Preview:</span>
                            <span>{previewNameStart} ... {previewNameEnd}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || totalUnits <= 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
                        Generate Units
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
