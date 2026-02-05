'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function EditPropertyModal({ property, isOpen, onClose, onPropertyUpdated }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: ''
    })

    useEffect(() => {
        if (property) {
            setFormData({
                title: property.title || (property.type ? `${property.type} - ` : ''),
                description: property.description || '',
                address: property.address || '',
                price: property.price || '',
                bedrooms: property.bedrooms || '',
                bathrooms: property.bathrooms || '',
                area: property.size_sqft || property.area || '',
                type: property.type || '' // virtual field
            })
        } else {
            // Reset if null (Create generic)
            setFormData({
                title: '',
                description: '',
                address: '',
                price: '',
                bedrooms: '',
                bathrooms: '',
                area: ''
            })
        }
    }, [property])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const isNew = !property?.id
            const url = isNew
                ? `/api/inventory/properties`
                : `/api/inventory/properties/${property.id}`

            const method = isNew ? 'POST' : 'PATCH'

            const payload = {
                title: formData.title,
                description: formData.description,
                address: formData.address,
                price: formData.price ? Number(formData.price) : null,
                bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
                size_sqft: formData.area ? Number(formData.area) : null,
                // If new, we might need project_id if it's passed?
                // The modal currently doesn't know about project_id unless property has it.
                // We need to pass projectId to the modal.
                ...(isNew && property?.projectId ? { project_id: property.projectId } : {}),
                ...(formData.type ? { type: formData.type } : {}) // Store type if we had a column, but we might rely on title for now.
            }
            // For now, let's append Type to title if it's new and title doesn't have it?
            // "1BHK Unit 101"

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update property')
            }

            toast.success(property?.id ? 'Property updated successfully' : 'Property created successfully')

            if (onPropertyUpdated) {
                onPropertyUpdated(data.property)
            }

            onClose()
        } catch (error) {
            console.error('Update property error:', error)
            toast.error(error.message || 'Failed to update property')
        } finally {
            setLoading(false)
        }
    }

    if (!property) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{property?.id ? 'Edit Property' : 'Add Property'}</DialogTitle>
                    <DialogDescription>
                        Update property details
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Property Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Luxury 3BHK Apartment"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Property description..."
                            rows={3}
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Property address"
                        />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="e.g., 5000000"
                            min="0"
                        />
                    </div>

                    {/* Property Details Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Bedrooms</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                value={formData.bedrooms}
                                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                                placeholder="e.g., 3"
                                min="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">Bathrooms</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                value={formData.bathrooms}
                                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                                placeholder="e.g., 2"
                                min="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="area">Area (sq ft)</Label>
                            <Input
                                id="area"
                                type="number"
                                value={formData.area}
                                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                placeholder="e.g., 1200"
                                min="0"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                property?.id ? 'Update Property' : 'Create Property'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
