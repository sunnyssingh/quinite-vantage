'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Building, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

export default function LinkPropertyDialog({ lead, isOpen, onClose, onLinkSuccess }) {
    const [search, setSearch] = useState('')
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState(null)
    const [linking, setLinking] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setSearch('')
            setSelectedPropertyId(null)
            fetchProperties()
        }
    }, [isOpen])

    const fetchProperties = async () => {
        setLoading(true)
        try {
            // Only fetch available properties
            const res = await fetch('/api/inventory/properties?status=available')
            const data = await res.json()
            setProperties(data.properties || [])
        } catch (error) {
            console.error('Failed to load properites:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProperties = properties.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase())
    )

    const handleLink = async () => {
        if (!selectedPropertyId) return

        setLinking(true)
        try {
            const res = await fetch(`/api/leads/${lead.id}/link-property`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: selectedPropertyId })
            })

            if (!res.ok) throw new Error('Failed to link property')

            toast.success('Property linked to lead')
            if (onLinkSuccess) onLinkSuccess()
            onClose()
        } catch (error) {
            toast.error('Failed to link property')
        } finally {
            setLinking(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Link Property</DialogTitle>
                    <DialogDescription>
                        Select a property to link to this lead. Only available properties are shown.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search properties..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="h-[300px] overflow-y-auto border rounded-xl bg-muted/10 p-2 space-y-2">
                        {loading ? (
                            <div className="text-center p-4 text-sm text-muted-foreground">Loading...</div>
                        ) : filteredProperties.length === 0 ? (
                            <div className="text-center p-8 text-sm text-muted-foreground">
                                No available properties found.
                            </div>
                        ) : (
                            filteredProperties.map(property => (
                                <div
                                    key={property.id}
                                    onClick={() => setSelectedPropertyId(property.id)}
                                    className={`
                                        group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                        ${selectedPropertyId === property.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-transparent bg-card hover:bg-accent/50 hover:border-border'
                                        }
                                    `}
                                >
                                    <div className="mt-1 p-1.5 bg-secondary rounded-md shrink-0">
                                        <Building className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-sm text-foreground truncate">{property.title}</h4>
                                            {selectedPropertyId === property.id && (
                                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background">
                                                {property.type}
                                            </Badge>
                                            <span className="text-xs font-semibold text-foreground">
                                                ₹{parseInt(property.price).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        {property.project_name && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {property.project_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={linking}>Cancel</Button>
                    <Button onClick={handleLink} disabled={!selectedPropertyId || linking}>
                        {linking ? 'Linking...' : 'Link Selected Property'}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
