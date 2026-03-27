'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Home, Store, ConciergeBell, Briefcase, ShoppingBag, Factory } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ResidentialConfigForm({ onAdd, onCancel, category = 'residential', initialData = null }) {
    const [config, setConfig] = useState(initialData || {
        transaction_type: 'Sell',
        category: category,
        property_type: '',
        configuration: category === 'residential' ? '3BHK' : '',
        carpet_area: '',
        area_unit: 'sqft',
        price: '',
        count: ''
    })

    // Set default property type based on category
    useEffect(() => {
        if (!config.property_type) {
            const types = getPropertyTypes(category)
            if (types.length > 0) {
                setConfig(prev => ({ ...prev, property_type: types[0].id }))
            }
        }
    }, [category])

    const getPropertyTypes = (cat) => {
        // Handle case-insensitive check
        const safeCat = (cat || 'residential').toLowerCase()

        switch (safeCat) {
            case 'commercial':
                return [
                    { id: 'Office', label: 'Office', icon: Briefcase },
                    { id: 'Retail', label: 'Retail', icon: ShoppingBag },
                    { id: 'Showroom', label: 'Showroom', icon: Store },
                    { id: 'Industrial', label: 'Industrial', icon: Factory },
                ]
            case 'land':
                return [
                    { id: 'Plot', label: 'Plot', icon: Home },
                    { id: 'Land', label: 'Land', icon: Building2 },
                ]
            default: // residential
                return [
                    { id: 'Apartment', label: 'Apartment', icon: Building2 },
                    { id: 'Villa Bungalow', label: 'Villa Bungalow', icon: Home },
                    { id: 'Penthouse', label: 'Penthouse', icon: ConciergeBell },
                ]
        }
    }

    const propertyTypes = getPropertyTypes(config.category)
    const isResidential = (config.category || 'residential').toLowerCase() === 'residential'

    const formatPriceDisplay = (price) => {
        if (!price) return ''
        const num = Number(price)
        if (num >= 10000000) {
            return `${(num / 10000000).toFixed(2)} Crores`
        } else if (num >= 100000) {
            return `${(num / 100000).toFixed(2)} Lacs`
        }
        return num.toLocaleString('en-IN')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!config.count || !config.carpet_area) return

        let displayTitle = ''
        if (isResidential) {
            displayTitle = `${config.configuration} ${config.property_type} (${config.carpet_area} sqft`
        } else {
            displayTitle = `${config.property_type} (${config.carpet_area} sqft`
        }

        if (config.price) {
            displayTitle += ` @ ₹${formatPriceDisplay(config.price)}`
        }
        displayTitle += ` ${config.area_unit})`


        onAdd({
            ...config,
            type: config.property_type,
            displayTitle: displayTitle
        })
    }

    return (
        <div className="space-y-6 bg-white p-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <Select
                        value={config.transaction_type}
                        onValueChange={(v) => setConfig(prev => ({ ...prev, transaction_type: v }))}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sell">Sell</SelectItem>
                            <SelectItem value="Rent">Rent</SelectItem>
                            <SelectItem value="Lease">Lease</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                        value={config.category}
                        onValueChange={(v) => setConfig(prev => ({ ...prev, category: v, property_type: '', configuration: v === 'residential' ? '3BHK' : '' }))}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-3">
                <Label>Property Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {propertyTypes.map((type) => {
                        const Icon = type.icon
                        const isSelected = config.property_type === type.id
                        return (
                            <div
                                key={type.id}
                                onClick={() => setConfig(prev => ({ ...prev, property_type: type.id }))}
                                className={cn(
                                    "cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all hover:border-blue-400",
                                    isSelected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "bg-white border-slate-200"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isSelected ? "text-blue-600" : "text-slate-500")} />
                                <span className={cn("text-xs font-semibold text-center leading-tight", isSelected ? "text-blue-700" : "text-slate-600")}>
                                    {type.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {isResidential && (
                    <div className="space-y-2">
                        <Label>Configuration</Label>
                        <Select
                            value={config.configuration}
                            onValueChange={(v) => setConfig(prev => ({ ...prev, configuration: v }))}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select BHK" />
                            </SelectTrigger>
                            <SelectContent>
                                {['1RK', '1BHK', '1.5BHK', '2BHK', '2.5BHK', '3BHK', '3.5BHK', '4BHK', '5BHK', 'Penthouse'].map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>{isResidential ? `Carpet Area (${config.area_unit})` : `Area (${config.area_unit})`} *</Label>
                        <div className="flex bg-muted rounded-md p-0.5 text-[10px] font-bold">
                            <button
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, area_unit: 'sqft' }))}
                                className={cn("px-1.5 py-0.5 rounded", config.area_unit === 'sqft' ? "bg-white shadow-sm" : "text-muted-foreground")}
                            >
                                SQFT
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, area_unit: 'sqmt' }))}
                                className={cn("px-1.5 py-0.5 rounded", config.area_unit === 'sqmt' ? "bg-white shadow-sm" : "text-muted-foreground")}
                            >
                                SQMT
                            </button>
                        </div>
                    </div>
                    <Input
                        type="number"
                        placeholder="e.g. 1200"
                        value={config.carpet_area}
                        onChange={(e) => setConfig(prev => ({ ...prev, carpet_area: e.target.value }))}
                        className="bg-white"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Price (per unit) *</Label>
                        <span className="text-[10px] font-bold text-blue-600">
                            {formatPriceDisplay(config.price)}
                        </span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                        <Input
                            type="number"
                            placeholder="e.g. 7500000"
                            value={config.price}
                            onChange={(e) => setConfig(prev => ({ ...prev, price: e.target.value }))}
                            className="bg-white pl-7"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Count *</Label>
                    <Input
                        type="number"
                        placeholder="e.g. 10"
                        value={config.count}
                        onChange={(e) => setConfig(prev => ({ ...prev, count: e.target.value }))}
                        className="bg-white"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={handleSubmit} disabled={!config.count || !config.carpet_area || !config.price} className="bg-blue-600 hover:bg-blue-700">
                    {initialData ? 'Update Unit Type' : 'Add Unit Type'}
                </Button>
            </div>
        </div>
    )
}
