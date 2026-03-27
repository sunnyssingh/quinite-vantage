import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

const supabase = createClient()

/**
 * Hook to fetch projects specifically enabled for Inventory
 */
export function useInventoryProjects() {
    return useQuery({
        queryKey: ['inventory-projects'],
        queryFn: async () => {
            const res = await fetch('/api/inventory/projects')
            if (!res.ok) throw new Error('Failed to fetch inventory projects')
            const data = await res.json()
            return data.projects || []
        },
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to fetch all properties for the inventory
 */
export function useInventoryProperties(projectId = null) {
    return useQuery({
        queryKey: ['inventory-properties', projectId],
        queryFn: async () => {
            const url = projectId 
                ? `/api/inventory/properties?project_id=${projectId}`
                : '/api/inventory/properties'
            const res = await fetch(url)
            if (!res.ok) throw new Error('Failed to fetch properties')
            const data = await res.json()
            return data.properties || []
        },
        staleTime: 2 * 60 * 1000, // Properties change more frequently
    })
}

/**
 * Hook to fetch specific project details from inventory perspective
 */
export function useInventoryProject(projectId) {
    return useQuery({
        queryKey: ['inventory-project', projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}`)
            if (!res.ok) throw new Error('Failed to fetch project')
            const data = await res.json()
            return data.project
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to fetch inventory-specific analytics
 */
export function useInventoryAnalytics() {
    return useQuery({
        queryKey: ['inventory-analytics'],
        queryFn: async () => {
            const res = await fetch('/api/inventory/analytics')
            if (!res.ok) throw new Error('Failed to fetch inventory analytics')
            return res.json()
        },
        staleTime: 10 * 60 * 1000,
    })
}

/**
 * Comprehensive hook for inventory management (Towers + Units)
 */
export function useInventory({ projectId, organizationId }) {
    const { data: towers = [], isLoading: towersLoading, refetch: refetchTowers } = useQuery({
        queryKey: ['inventory-towers', projectId, organizationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('towers')
                .select('*')
                .eq('project_id', projectId)
                .eq('organization_id', organizationId)
                .order('order_index')
            if (error) throw error
            return data
        },
        enabled: !!projectId && !!organizationId,
    })

    const { data: units = {}, isLoading: unitsLoading, refetch: refetchUnits } = useQuery({
        queryKey: ['inventory-units', projectId, organizationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('project_id', projectId)
                .eq('organization_id', organizationId)
                .order('floor_number', { ascending: false })
            if (error) throw error
            
            // Return as object keyed by tower_id
            return (data || []).reduce((acc, unit) => {
                const towerId = unit.tower_id || 'unassigned'
                if (!acc[towerId]) acc[towerId] = []
                acc[towerId].push(unit)
                return acc
            }, {})
        },
        enabled: !!projectId && !!organizationId,
    })

    const isLoading = towersLoading || unitsLoading

    // Mutations
    const addTower = async (towerData) => {
        const { data, error } = await supabase
            .from('towers')
            .insert({ ...towerData, project_id: projectId, organization_id: organizationId })
            .select().single()

        if (error) {
            toast.error('Failed to add tower')
            throw error
        }
        await refetchTowers()
        return data
    }

    const updateTower = async (towerId, updates) => {
        const { data, error } = await supabase
            .from('towers')
            .update(updates)
            .eq('id', towerId)
            .eq('organization_id', organizationId)
            .select().single()

        if (error) {
            toast.error('Failed to update tower')
            throw error
        }
        await refetchTowers()
        return data
    }

    const deleteTower = async (towerId) => {
        // Cascades via FK, but manually delete properties first for safety or if no cascade
        await supabase.from('properties').delete().eq('tower_id', towerId).eq('organization_id', organizationId)
        const { error } = await supabase.from('towers').delete().eq('id', towerId).eq('organization_id', organizationId)
        
        if (error) {
            toast.error('Failed to delete tower')
            throw error
        }
        await refetchTowers()
        await refetchUnits()
    }

    const addUnit = async (unitData) => {
        const { data, error } = await supabase
            .from('properties')
            .insert({ ...unitData, project_id: projectId, organization_id: organizationId })
            .select().single()

        if (error) {
            toast.error('Failed to add unit')
            throw error
        }
        await refetchUnits()
        return data
    }

    const updateUnit = async (unitId, updates) => {
        const { data, error } = await supabase
            .from('properties')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', unitId)
            .eq('organization_id', organizationId)
            .select().single()

        if (error) {
            toast.error('Failed to update unit')
            throw error
        }
        await refetchUnits()
        return data
    }

    const deleteUnit = async (unitId) => {
        const { error } = await supabase.from('properties').delete().eq('id', unitId).eq('organization_id', organizationId)
        if (error) {
            toast.error('Failed to delete unit')
            throw error
        }
        await refetchUnits()
    }

    const updateUnitStatus = async (unitId, newStatus) => {
        return updateUnit(unitId, { status: newStatus })
    }

    const updateUnitPrice = async (unitId, priceData) => {
        return updateUnit(unitId, priceData)
    }

    return {
        towers,
        units,
        isLoading,
        addTower,
        updateTower,
        deleteTower,
        addUnit,
        updateUnit,
        deleteUnit,
        updateUnitStatus,
        updateUnitPrice,
        refetch: () => { refetchTowers(); refetchUnits(); },
    }
}
