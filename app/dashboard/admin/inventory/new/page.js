'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPropertyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        type: 'apartment',
        status: 'available',
        bedrooms: '',
        bathrooms: '',
        size: '',
        address: '',
        description: ''
    })

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSelect = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/inventory/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to create property')

            toast.success('Property created successfully')
            router.push('/dashboard/admin/inventory')
        } catch (error) {
            toast.error('Error creating property')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/admin/inventory">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Add New Property</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                            <Label>Property Title *</Label>
                            <Input name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Luxury 3BHK in Indiranagar" />
                        </div>

                        <div className="space-y-2">
                            <Label>Price (₹) *</Label>
                            <Input name="price" type="number" required value={formData.price} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select value={formData.type} onValueChange={(val) => handleSelect('type', val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="apartment">Apartment</SelectItem>
                                    <SelectItem value="villa">Villa</SelectItem>
                                    <SelectItem value="plot">Plot</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(val) => handleSelect('status', val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="sold">Sold</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label>Address</Label>
                            <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="Full address..." />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Details & Features</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Bedrooms</Label>
                            <Input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Bathrooms</Label>
                            <Input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Size (Sq. Ft)</Label>
                            <Input name="size" type="number" value={formData.size} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 col-span-3">
                            <Label>Description</Label>
                            <Textarea name="description" value={formData.description} onChange={handleChange} className="min-h-[100px]" />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4 sm:flex sm:justify-end">
                    <Link href="/dashboard/admin/inventory" className="w-full sm:w-auto">
                        <Button variant="outline" type="button" className="w-full">Cancel</Button>
                    </Link>
                    <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white" disabled={loading}>
                        {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                        Create Listing
                    </Button>
                </div>
            </form>
        </div>
    )
}
