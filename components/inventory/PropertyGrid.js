'use client'

import { PropertyCard } from './PropertyCard'

export function PropertyGrid({ properties }) {
    if (!properties || properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800">No Properties Found</h3>
                <p className="text-slate-500 mt-2">Add your first property listing to get started.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
            ))}
        </div>
    )
}
