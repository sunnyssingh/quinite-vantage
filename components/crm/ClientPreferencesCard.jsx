'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Edit2, Save, X, Loader2, MapPin, Calendar, Building, Layers, Wallet } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ClientPreferencesCard({ profile, leadId, onUpdate, currency = 'USD' }) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        location: '',
        property_type_interest: '',
        sub_category_interest: '',
        timeline: '',
        min_budget: '',
        max_budget: ''
    })

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handleEdit = () => {
        setFormData({
            location: profile.location || '',
            property_type_interest: profile.property_type_interest || '',
            sub_category_interest: profile.sub_category_interest || '',
            timeline: profile.timeline || '',
            min_budget: profile.min_budget || '',
            max_budget: profile.max_budget || ''
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // Prepare payload - convert empty strings for numbers to null
            const payload = { ...formData }
            if (payload.min_budget === '') payload.min_budget = null
            if (payload.max_budget === '') payload.max_budget = null

            const res = await fetch(`/api/leads/${leadId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error('Failed to update preferences')

            toast.success('Preferences updated')
            setIsEditing(false)
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const PROPERTY_OPTS = {
        "Residential": [
            "Flat / Apartment",
            "Independent House",
            "Villa / Bunglow",
            "Row House",
            "Duplex House",
            "Studio Apartment",
            "Penthouse",
            "Farm House"
        ],
        "Commercial": [
            "Office Space",
            "Shop",
            "Showroom",
            "Warehouse"
        ],
        "Industrial": [
            "Factory",
            "Industrial Shed",
            "Warehouse",
            "Industrial Plot"
        ],
        "Land": [
            "Residential Plot",
            "Commercial Plot",
            "Agricultural Land",
            "Industrial Land"
        ],
        "Co-Working Space": [
            "Hot Desk",
            "Fixed Desk",
            "Private Cabin",
            "Meeting Room"
        ],
        "PG/Hostel": [
            "Boys PG",
            "Girls PG",
            "Co-ed PG",
            "Student Hostel",
            "Working Professional Hostel"
        ]
    }

    const handlePropertyTypeChange = (value) => {
        setFormData({
            ...formData,
            property_type_interest: value,
            sub_category_interest: '' // Reset sub-category on type change
        })
    }

    return (
        <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4 bg-gradient-to-r from-emerald-50/50 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shadow-sm">
                        <Star className="w-4 h-4 fill-emerald-700" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold text-gray-900">Client Preferences</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Key requirements & criteria</p>
                    </div>
                </div>
                {!isEditing ? (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 rounded-full" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Location */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Location</span>
                        </div>
                        {isEditing ? (
                            <Input
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="h-9 bg-gray-50/50"
                                placeholder="Preferred location"
                            />
                        ) : (
                            <p className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {profile.location || 'Any'}
                            </p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Timeline</span>
                        </div>
                        {isEditing ? (
                            <Select
                                value={formData.timeline}
                                onValueChange={(val) => setFormData({ ...formData, timeline: val })}
                            >
                                <SelectTrigger className="h-9 bg-gray-50/50">
                                    <SelectValue placeholder="Select timeline" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Immediate">Immediate</SelectItem>
                                    <SelectItem value="1-3 Months">1-3 Months</SelectItem>
                                    <SelectItem value="3-6 Months">3-6 Months</SelectItem>
                                    <SelectItem value="6+ Months">6+ Months</SelectItem>
                                    <SelectItem value="Investment">Investment Only</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                                {profile.timeline || 'Not specified'}
                            </div>
                        )}
                    </div>

                    {/* Property Type */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <Building className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Property Type</span>
                        </div>
                        {isEditing ? (
                            <Select
                                value={formData.property_type_interest}
                                onValueChange={handlePropertyTypeChange}
                            >
                                <SelectTrigger className="h-9 bg-gray-50/50">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(PROPERTY_OPTS).map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {profile.property_type_interest || 'Any'}
                            </p>
                        )}
                    </div>

                    {/* Sub-category */}
                    <div className="group">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Category</span>
                        </div>
                        {isEditing ? (
                            <Select
                                value={formData.sub_category_interest}
                                onValueChange={(val) => setFormData({ ...formData, sub_category_interest: val })}
                                disabled={!formData.property_type_interest}
                            >
                                <SelectTrigger className="h-9 bg-gray-50/50">
                                    <SelectValue placeholder="Select sub-category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formData.property_type_interest && PROPERTY_OPTS[formData.property_type_interest]?.map((sub) => (
                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {profile.sub_category_interest || 'Any'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Budget Section */}
                <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Budget Range</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                        <div>
                            <p className="text-xs text-orange-600/70 font-semibold mb-1">Minimum</p>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={formData.min_budget}
                                    onChange={e => setFormData({ ...formData, min_budget: e.target.value })}
                                    className="h-9 bg-white border-orange-200 focus-visible:ring-orange-500/20"
                                    placeholder="Min"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(profile.min_budget)}
                                </p>
                            )}
                        </div>
                        <div className="relative">
                            {/* Decorative Separator */}
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-orange-200 sm:block hidden"></div>

                            <p className="text-xs text-orange-600/70 font-semibold mb-1">Maximum</p>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={formData.max_budget}
                                    onChange={e => setFormData({ ...formData, max_budget: e.target.value })}
                                    className="h-9 bg-white border-orange-200 focus-visible:ring-orange-500/20"
                                    placeholder="Max"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(profile.max_budget)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
