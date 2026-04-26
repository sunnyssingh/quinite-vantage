import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useUnitDeals(unitId) {
    return useQuery({
        queryKey: ['unit-deals', unitId],
        queryFn: async () => {
            const res = await fetch(`/api/inventory/units/${unitId}/deals`)
            if (!res.ok) throw new Error('Failed to load unit deals')
            return res.json()
        },
        enabled: !!unitId,
        staleTime: 30_000,
    })
}

export function useUnitDealsInvalidate() {
    const qc = useQueryClient()
    return (unitId, leadId) => {
        qc.invalidateQueries({ queryKey: ['unit-deals', unitId] })
        if (leadId) qc.invalidateQueries({ queryKey: ['lead-deals', leadId] })
    }
}
