import { useQuery } from '@tanstack/react-query'

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
