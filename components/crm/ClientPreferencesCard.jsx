'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Edit2, Save, X, Loader2 } from 'lucide-react'
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                        <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-900">Client Preferences</CardTitle>
                </div>
                {!isEditing ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    {/* Location */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Location Preference</p>
                        {isEditing ? (
                            <Input
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="h-8"
                            />
                        ) : (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {profile.location || 'Any'}
                            </p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                        {isEditing ? (
                            <Select
                                value={formData.timeline}
                                onValueChange={(val) => setFormData({ ...formData, timeline: val })}
                            >
                                <SelectTrigger className="h-8">
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
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {profile.timeline || 'Not specified'}
                            </p>
                        )}
                    </div>

                    {/* Property Type with Dropdown options */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Property Type</p>
                        {isEditing ? (
                            <Select
                                value={formData.property_type_interest}
                                onValueChange={handlePropertyTypeChange}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(PROPERTY_OPTS).map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {profile.property_type_interest || 'Any'}
                            </p>
                        )}
                    </div>

                    {/* Sub-category with Dropdown options */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Sub-category</p>
                        {isEditing ? (
                            <Select
                                value={formData.sub_category_interest}
                                onValueChange={(val) => setFormData({ ...formData, sub_category_interest: val })}
                                disabled={!formData.property_type_interest}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select sub-category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formData.property_type_interest && PROPERTY_OPTS[formData.property_type_interest]?.map((sub) => (
                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {profile.sub_category_interest || 'Any'}
                            </p>
                        )}
                    </div>

                    {/* Budget Section */}
                    <div className="col-span-2 grid grid-cols-2 gap-8 mt-2">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Min Budget</p>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={formData.min_budget}
                                    onChange={e => setFormData({ ...formData, min_budget: e.target.value })}
                                    className="h-8"
                                />
                            ) : (
                                <p className="text-base font-semibold text-orange-500">
                                    {formatCurrency(profile.min_budget)}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Max Budget</p>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={formData.max_budget}
                                    onChange={e => setFormData({ ...formData, max_budget: e.target.value })}
                                    className="h-8"
                                />
                            ) : (
                                <p className="text-base font-semibold text-orange-500">
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
